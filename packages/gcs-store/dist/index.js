"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GCSStore = void 0;
const node_stream_1 = __importDefault(require("node:stream"));
const debug_1 = __importDefault(require("debug"));
const server_1 = require("@tus/server");
const server_2 = require("@tus/server");
const log = (0, debug_1.default)('tus-node-server:stores:gcsstore');
class GCSStore extends server_2.DataStore {
    constructor(options) {
        super();
        if (!options.bucket) {
            throw new Error('GCSDataStore must have a bucket');
        }
        this.bucket = options.bucket;
        this.extensions = ['creation', 'creation-with-upload', 'creation-defer-length'];
    }
    create(file) {
        return new Promise((resolve, reject) => {
            if (!file.id) {
                reject(server_1.ERRORS.FILE_NOT_FOUND);
                return;
            }
            const gcs_file = this.bucket.file(file.id);
            const options = {
                metadata: {
                    metadata: {
                        tus_version: server_1.TUS_RESUMABLE,
                        size: file.size,
                        sizeIsDeferred: `${file.sizeIsDeferred}`,
                        offset: file.offset,
                        metadata: JSON.stringify(file.metadata),
                    },
                },
            };
            const fake_stream = new node_stream_1.default.PassThrough();
            fake_stream.end();
            fake_stream
                .pipe(gcs_file.createWriteStream(options))
                .on('error', reject)
                .on('finish', () => {
                resolve(file);
            });
        });
    }
    read(file_id) {
        return this.bucket.file(file_id).createReadStream();
    }
    /**
     * Get the file metatata from the object in GCS, then upload a new version
     * passing through the metadata to the new version.
     */
    write(readable, id, offset) {
        // GCS Doesn't persist metadata within versions,
        // get that metadata first
        return this.getUpload(id).then((upload) => {
            return new Promise((resolve, reject) => {
                const file = this.bucket.file(id);
                const destination = upload.offset === 0 ? file : this.bucket.file(`${id}_patch`);
                const options = {
                    offset,
                    metadata: {
                        metadata: {
                            tus_version: server_1.TUS_RESUMABLE,
                            size: upload.size,
                            sizeIsDeferred: `${upload.sizeIsDeferred}`,
                            offset,
                            metadata: JSON.stringify(upload.metadata),
                        },
                    },
                };
                const write_stream = destination.createWriteStream(options);
                if (!write_stream || readable.destroyed) {
                    reject(server_1.ERRORS.FILE_WRITE_ERROR);
                    return;
                }
                let bytes_received = upload.offset;
                readable.on('data', (buffer) => {
                    bytes_received += buffer.length;
                });
                node_stream_1.default.pipeline(readable, write_stream, async (e) => {
                    if (e) {
                        log(e);
                        try {
                            await destination.delete({ ignoreNotFound: true });
                        }
                        finally {
                            reject(server_1.ERRORS.FILE_WRITE_ERROR);
                        }
                    }
                    else {
                        log(`${bytes_received} bytes written`);
                        try {
                            if (file !== destination) {
                                await this.bucket.combine([file, destination], file);
                                await Promise.all([
                                    file.setMetadata(options.metadata),
                                    destination.delete({ ignoreNotFound: true }),
                                ]);
                            }
                            resolve(bytes_received);
                        }
                        catch (error) {
                            log(error);
                            reject(server_1.ERRORS.FILE_WRITE_ERROR);
                        }
                    }
                });
            });
        });
    }
    getUpload(id) {
        return new Promise((resolve, reject) => {
            if (!id) {
                reject(server_1.ERRORS.FILE_NOT_FOUND);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.bucket.file(id).getMetadata((error, metadata) => {
                if (error && error.code === 404) {
                    return reject(server_1.ERRORS.FILE_NOT_FOUND);
                }
                if (error) {
                    log('[GCSDataStore] getFileMetadata', error);
                    return reject(error);
                }
                const { size, metadata: meta } = metadata.metadata;
                return resolve(new server_2.Upload({
                    id,
                    size: size ? Number.parseInt(size, 10) : size,
                    offset: Number.parseInt(metadata.size, 10),
                    metadata: meta ? JSON.parse(meta) : undefined,
                }));
            });
        });
    }
    async declareUploadLength(id, upload_length) {
        const upload = await this.getUpload(id);
        upload.size = upload_length;
        await this.bucket.file(id).setMetadata({ metadata: upload });
    }
}
exports.GCSStore = GCSStore;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
// TODO: use /promises versions
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_stream_1 = __importDefault(require("node:stream"));
const debug_1 = __importDefault(require("debug"));
const configstore_1 = __importDefault(require("configstore"));
const server_1 = require("@tus/server");
const package_json_1 = __importDefault(require("./package.json"));
const MASK = '0777';
const IGNORED_MKDIR_ERROR = 'EEXIST';
const FILE_DOESNT_EXIST = 'ENOENT';
const log = (0, debug_1.default)('tus-node-server:stores:filestore');
class FileStore extends server_1.DataStore {
    constructor({ directory, configstore, expirationPeriodInMilliseconds }) {
        super();
        this.directory = directory;
        this.configstore = configstore ?? new configstore_1.default(`${package_json_1.default.name}-${package_json_1.default.version}`);
        this.expirationPeriodInMilliseconds = expirationPeriodInMilliseconds ?? 0;
        this.extensions = [
            'creation',
            'creation-with-upload',
            'creation-defer-length',
            'termination',
            'expiration',
        ];
        // TODO: this async call can not happen in the constructor
        this.checkOrCreateDirectory();
    }
    /**
     *  Ensure the directory exists.
     */
    checkOrCreateDirectory() {
        node_fs_1.default.mkdir(this.directory, MASK, (error) => {
            if (error && error.code !== IGNORED_MKDIR_ERROR) {
                throw error;
            }
        });
    }
    /**
     * Create an empty file.
     */
    create(file) {
        return new Promise((resolve, reject) => {
            node_fs_1.default.open(node_path_1.default.join(this.directory, file.id), 'w', (err, fd) => {
                if (err) {
                    log('[FileStore] create: Error', err);
                    return reject(err);
                }
                this.configstore.set(file.id, file);
                return node_fs_1.default.close(fd, (exception) => {
                    if (exception) {
                        log('[FileStore] create: Error', exception);
                        return reject(exception);
                    }
                    return resolve(file);
                });
            });
        });
    }
    read(file_id) {
        return node_fs_1.default.createReadStream(node_path_1.default.join(this.directory, file_id));
    }
    remove(file_id) {
        return new Promise((resolve, reject) => {
            node_fs_1.default.unlink(`${this.directory}/${file_id}`, (err) => {
                if (err) {
                    log('[FileStore] delete: Error', err);
                    reject(server_1.ERRORS.FILE_NOT_FOUND);
                    return;
                }
                try {
                    resolve(this.configstore.delete(file_id));
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    write(readable, file_id, offset) {
        const file_path = node_path_1.default.join(this.directory, file_id);
        const writeable = node_fs_1.default.createWriteStream(file_path, {
            flags: 'r+',
            start: offset,
        });
        let bytes_received = 0;
        const transform = new node_stream_1.default.Transform({
            transform(chunk, _, callback) {
                bytes_received += chunk.length;
                callback(null, chunk);
            },
        });
        return new Promise((resolve, reject) => {
            node_stream_1.default.pipeline(readable, transform, writeable, (err) => {
                if (err) {
                    log('[FileStore] write: Error', err);
                    return reject(server_1.ERRORS.FILE_WRITE_ERROR);
                }
                log(`[FileStore] write: ${bytes_received} bytes written to ${file_path}`);
                offset += bytes_received;
                log(`[FileStore] write: File is now ${offset} bytes`);
                return resolve(offset);
            });
        });
    }
    async getUpload(id) {
        const file = this.configstore.get(id);
        if (!file) {
            throw server_1.ERRORS.FILE_NOT_FOUND;
        }
        return new Promise((resolve, reject) => {
            const file_path = `${this.directory}/${id}`;
            node_fs_1.default.stat(file_path, (error, stats) => {
                if (error && error.code === FILE_DOESNT_EXIST && file) {
                    log(`[FileStore] getUpload: No file found at ${file_path} but db record exists`, file);
                    return reject(server_1.ERRORS.FILE_NO_LONGER_EXISTS);
                }
                if (error && error.code === FILE_DOESNT_EXIST) {
                    log(`[FileStore] getUpload: No file found at ${file_path}`);
                    return reject(server_1.ERRORS.FILE_NOT_FOUND);
                }
                if (error) {
                    return reject(error);
                }
                if (stats.isDirectory()) {
                    log(`[FileStore] getUpload: ${file_path} is a directory`);
                    return reject(server_1.ERRORS.FILE_NOT_FOUND);
                }
                return resolve(new server_1.Upload({
                    id,
                    size: file.size,
                    offset: stats.size,
                    metadata: file.metadata,
                    creation_date: file.creation_date,
                }));
            });
        });
    }
    async declareUploadLength(id, upload_length) {
        const file = this.configstore.get(id);
        if (!file) {
            throw server_1.ERRORS.FILE_NOT_FOUND;
        }
        file.size = upload_length;
        this.configstore.set(id, file);
    }
    async deleteExpired() {
        const now = new Date();
        const toDelete = [];
        const uploadInfos = this.configstore.all;
        for (const file_id of Object.keys(uploadInfos)) {
            try {
                const info = uploadInfos[file_id];
                if (info &&
                    'creation_date' in info &&
                    this.getExpiration() > 0 &&
                    info.size !== info.offset &&
                    info.creation_date) {
                    const creation = new Date(info.creation_date);
                    const expires = new Date(creation.getTime() + this.getExpiration());
                    if (now > expires) {
                        toDelete.push(this.remove(file_id));
                    }
                }
            }
            catch (error) {
                if (error !== server_1.ERRORS.FILE_NO_LONGER_EXISTS) {
                    throw error;
                }
            }
        }
        return Promise.all(toDelete).then(() => toDelete.length);
    }
    getExpiration() {
        return this.expirationPeriodInMilliseconds;
    }
}
exports.FileStore = FileStore;

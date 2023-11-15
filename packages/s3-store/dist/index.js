"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Store = void 0;
const node_os_1 = __importDefault(require("node:os"));
const node_fs_1 = __importStar(require("node:fs"));
const node_stream_1 = __importStar(require("node:stream"));
const client_s3_1 = require("@aws-sdk/client-s3");
const debug_1 = __importDefault(require("debug"));
const server_1 = require("@tus/server");
const server_2 = require("@tus/server");
const log = (0, debug_1.default)('tus-node-server:stores:s3store');
function calcOffsetFromParts(parts) {
    // @ts-expect-error not undefined
    return parts && parts.length > 0 ? parts.reduce((a, b) => a + b.Size, 0) : 0;
}
// Implementation (based on https://github.com/tus/tusd/blob/master/s3store/s3store.go)
//
// Once a new tus upload is initiated, multiple objects in S3 are created:
//
// First of all, a new info object is stored which contains (as Metadata) a JSON-encoded
// blob of general information about the upload including its size and meta data.
// This kind of objects have the suffix ".info" in their key.
//
// In addition a new multipart upload
// (http://docs.aws.amazon.com/AmazonS3/latest/dev/uploadobjusingmpu.html) is
// created. Whenever a new chunk is uploaded to tus-node-server using a PATCH request, a
// new part is pushed to the multipart upload on S3.
//
// If meta data is associated with the upload during creation, it will be added
// to the multipart upload and after finishing it, the meta data will be passed
// to the final object. However, the metadata which will be attached to the
// final object can only contain ASCII characters and every non-ASCII character
// will be replaced by a question mark (for example, "Menü" will be "Men?").
// However, this does not apply for the metadata returned by the `_getMetadata`
// function since it relies on the info object for reading the metadata.
// Therefore, HEAD responses will always contain the unchanged metadata, Base64-
// encoded, even if it contains non-ASCII characters.
//
// Once the upload is finished, the multipart upload is completed, resulting in
// the entire file being stored in the bucket. The info object, containing
// meta data is not deleted.
//
// Considerations
//
// In order to support tus' principle of resumable upload, S3's Multipart-Uploads
// are internally used.
// For each incoming PATCH request (a call to `write`), a new part is uploaded
// to S3.
class S3Store extends server_1.DataStore {
    constructor(options) {
        super();
        this.cache = new Map();
        this.expirationPeriodInMilliseconds = 0;
        this.maxMultipartParts = 10000;
        this.minPartSize = 5242880; // 5MiB
        this.maxUploadSize = 5497558138880; // 5TiB
        const { partSize, s3ClientConfig } = options;
        const { bucket, ...restS3ClientConfig } = s3ClientConfig;
        this.extensions = [
            'creation',
            'creation-with-upload',
            'creation-defer-length',
            'termination',
            'expiration',
        ];
        this.bucket = bucket;
        this.preferredPartSize = partSize || 8 * 1024 * 1024;
        this.expirationPeriodInMilliseconds = options.expirationPeriodInMilliseconds ?? 0;
        this.client = new client_s3_1.S3(restS3ClientConfig);
    }
    /**
     * Saves upload metadata to a `${file_id}.info` file on S3.
     * Please note that the file is empty and the metadata is saved
     * on the S3 object's `Metadata` field, so that only a `headObject`
     * is necessary to retrieve the data.
     */
    async saveMetadata(upload, uploadId) {
        log(`[${upload.id}] saving metadata`);
        await this.client.putObject({
            Bucket: this.bucket,
            Key: `${upload.id}.info`,
            Body: JSON.stringify(upload),
            Metadata: {
                'upload-id': uploadId,
                'tus-version': server_2.TUS_RESUMABLE,
                'created-at': upload.creation_date || new Date().toISOString(),
            },
        });
        log(`[${upload.id}] metadata file saved`);
    }
    /**
     * Retrieves upload metadata previously saved in `${file_id}.info`.
     * There's a small and simple caching mechanism to avoid multiple
     * HTTP calls to S3.
     */
    async getMetadata(id) {
        const cached = this.cache.get(id);
        if (cached?.file) {
            return cached;
        }
        const { Metadata, Body } = await this.client.getObject({
            Bucket: this.bucket,
            Key: `${id}.info`,
        });
        const file = JSON.parse((await Body?.transformToString()));
        this.cache.set(id, {
            'tus-version': Metadata?.['tus-version'],
            'upload-id': Metadata?.['upload-id'],
            'created-at': Metadata?.['created-at'],
            file: new server_1.Upload({
                id,
                size: file.size ? Number.parseInt(file.size, 10) : undefined,
                offset: Number.parseInt(file.offset, 10),
                metadata: file.metadata,
                creation_date: Metadata?.['created-at'],
            }),
        });
        return this.cache.get(id);
    }
    partKey(id, isIncomplete = false) {
        if (isIncomplete) {
            id += '.part';
        }
        // TODO: introduce ObjectPrefixing for parts and incomplete parts.
        // ObjectPrefix is prepended to the name of each S3 object that is created
        // to store uploaded files. It can be used to create a pseudo-directory
        // structure in the bucket, e.g. "path/to/my/uploads".
        return id;
    }
    async uploadPart(metadata, readStream, partNumber) {
        const data = await this.client.uploadPart({
            Bucket: this.bucket,
            Key: metadata.file.id,
            UploadId: metadata['upload-id'],
            PartNumber: partNumber,
            Body: readStream,
        });
        log(`[${metadata.file.id}] finished uploading part #${partNumber}`);
        return data.ETag;
    }
    async uploadIncompletePart(id, readStream, expires) {
        const data = await this.client.putObject({
            Bucket: this.bucket,
            Key: this.partKey(id, true),
            Body: readStream,
            Expires: expires,
        });
        log(`[${id}] finished uploading incomplete part`);
        return data.ETag;
    }
    async getIncompletePart(id) {
        try {
            const data = await this.client.getObject({
                Bucket: this.bucket,
                Key: this.partKey(id, true),
            });
            return data.Body;
        }
        catch (error) {
            if (error instanceof client_s3_1.NoSuchKey) {
                return undefined;
            }
            throw error;
        }
    }
    async getIncompletePartSize(id) {
        try {
            const data = await this.client.headObject({
                Bucket: this.bucket,
                Key: this.partKey(id, true),
            });
            return data.ContentLength;
        }
        catch (error) {
            if (error instanceof client_s3_1.NotFound) {
                return undefined;
            }
            throw error;
        }
    }
    async deleteIncompletePart(id) {
        await this.client.deleteObject({
            Bucket: this.bucket,
            Key: this.partKey(id, true),
        });
    }
    async prependIncompletePart(newChunkPath, previousIncompletePart) {
        const tempPath = `${newChunkPath}-prepend`;
        try {
            let incompletePartSize = 0;
            const byteCounterTransform = new node_stream_1.default.Transform({
                transform(chunk, _, callback) {
                    incompletePartSize += chunk.length;
                    callback(null, chunk);
                },
            });
            // write to temporary file, truncating if needed
            await node_stream_1.promises.pipeline(previousIncompletePart, byteCounterTransform, node_fs_1.default.createWriteStream(tempPath));
            // append to temporary file
            await node_stream_1.promises.pipeline(node_fs_1.default.createReadStream(newChunkPath), node_fs_1.default.createWriteStream(tempPath, { flags: 'a' }));
            // overwrite existing file
            await node_fs_1.promises.rename(tempPath, newChunkPath);
            return incompletePartSize;
        }
        catch (err) {
            node_fs_1.promises.rm(tempPath).catch(() => {
                /* ignore */
            });
            throw err;
        }
    }
    /**
     * Uploads a stream to s3 using multiple parts
     */
    async processUpload(metadata, readStream, currentPartNumber, offset) {
        const size = metadata.file.size;
        const promises = [];
        let pendingChunkFilepath = null;
        let bytesUploaded = 0;
        let currentChunkNumber = 0;
        const splitterStream = new server_1.StreamSplitter({
            chunkSize: this.calcOptimalPartSize(size),
            directory: node_os_1.default.tmpdir(),
        })
            .on('chunkStarted', (filepath) => {
            pendingChunkFilepath = filepath;
        })
            .on('chunkFinished', ({ path, size: partSize }) => {
            pendingChunkFilepath = null;
            const partNumber = currentPartNumber++;
            const chunkNumber = currentChunkNumber++;
            offset += partSize;
            const isFirstChunk = chunkNumber === 0;
            const isFinalPart = size === offset;
            // eslint-disable-next-line no-async-promise-executor
            const deferred = new Promise(async (resolve, reject) => {
                try {
                    let incompletePartSize = 0;
                    // Only the first chunk of each PATCH request can prepend
                    // an incomplete part (last chunk) from the previous request.
                    if (isFirstChunk) {
                        // If we received a chunk under the minimum part size in a previous iteration,
                        // we used a regular S3 upload to save it in the bucket. We try to get the incomplete part here.
                        const incompletePart = await this.getIncompletePart(metadata.file.id);
                        if (incompletePart) {
                            // We found an incomplete part, prepend it to the chunk on disk we were about to upload,
                            // and delete the incomplete part from the bucket. This can be done in parallel.
                            incompletePartSize = await this.prependIncompletePart(path, incompletePart);
                            await this.deleteIncompletePart(metadata.file.id);
                        }
                    }
                    const readable = node_fs_1.default.createReadStream(path);
                    readable.on('error', reject);
                    if (partSize + incompletePartSize >= this.minPartSize || isFinalPart) {
                        await this.uploadPart(metadata, readable, partNumber);
                    }
                    else {
                        const expirationDate = this.getExpiration() > 0 && metadata.file.creation_date
                            ? this.getExpirationDate(metadata.file.creation_date)
                            : undefined;
                        await this.uploadIncompletePart(metadata.file.id, readable, expirationDate);
                    }
                    bytesUploaded += partSize;
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
                finally {
                    node_fs_1.promises.rm(path).catch(() => {
                        /* ignore */
                    });
                }
            });
            promises.push(deferred);
        });
        try {
            await node_stream_1.promises.pipeline(readStream, splitterStream);
        }
        catch (error) {
            if (pendingChunkFilepath !== null) {
                try {
                    await node_fs_1.promises.rm(pendingChunkFilepath);
                }
                catch {
                    log(`[${metadata.file.id}] failed to remove chunk ${pendingChunkFilepath}`);
                }
            }
            promises.push(Promise.reject(error));
        }
        finally {
            await Promise.all(promises);
        }
        return bytesUploaded;
    }
    /**
     * Completes a multipart upload on S3.
     * This is where S3 concatenates all the uploaded parts.
     */
    async finishMultipartUpload(metadata, parts) {
        const response = await this.client.completeMultipartUpload({
            Bucket: this.bucket,
            Key: metadata.file.id,
            UploadId: metadata['upload-id'],
            MultipartUpload: {
                Parts: parts.map((part) => {
                    return {
                        ETag: part.ETag,
                        PartNumber: part.PartNumber,
                    };
                }),
            },
        });
        return response.Location;
    }
    /**
     * Gets the number of complete parts/chunks already uploaded to S3.
     * Retrieves only consecutive parts.
     */
    async retrieveParts(id, partNumberMarker) {
        const params = {
            Bucket: this.bucket,
            Key: id,
            UploadId: this.cache.get(id)?.['upload-id'],
            PartNumberMarker: partNumberMarker,
        };
        const data = await this.client.listParts(params);
        let parts = data.Parts ?? [];
        if (data.IsTruncated) {
            const rest = await this.retrieveParts(id, data.NextPartNumberMarker);
            parts = [...parts, ...rest];
        }
        if (!partNumberMarker) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            parts.sort((a, b) => a.PartNumber - b.PartNumber);
        }
        return parts;
    }
    /**
     * Removes cached data for a given file.
     */
    clearCache(id) {
        log(`[${id}] removing cached data`);
        this.cache.delete(id);
    }
    calcOptimalPartSize(size) {
        // When upload size is not know we assume largest possible value (`maxUploadSize`)
        if (size === undefined) {
            size = this.maxUploadSize;
        }
        let optimalPartSize;
        // When upload is smaller or equal to PreferredPartSize, we upload in just one part.
        if (size <= this.preferredPartSize) {
            optimalPartSize = size;
        }
        // Does the upload fit in MaxMultipartParts parts or less with PreferredPartSize.
        else if (size <= this.preferredPartSize * this.maxMultipartParts) {
            optimalPartSize = this.preferredPartSize;
            // The upload is too big for the preferred size.
            // We devide the size with the max amount of parts and round it up.
        }
        else {
            optimalPartSize = Math.ceil(size / this.maxMultipartParts);
        }
        return optimalPartSize;
    }
    /**
     * Creates a multipart upload on S3 attaching any metadata to it.
     * Also, a `${file_id}.info` file is created which holds some information
     * about the upload itself like: `upload-id`, `upload-length`, etc.
     */
    async create(upload) {
        log(`[${upload.id}] initializing multipart upload`);
        const request = {
            Bucket: this.bucket,
            Key: upload.id,
            Metadata: { 'tus-version': server_2.TUS_RESUMABLE },
        };
        if (upload.metadata?.contentType) {
            request.ContentType = upload.metadata.contentType;
        }
        const res = await this.client.createMultipartUpload(request);
        await this.saveMetadata(upload, res.UploadId);
        log(`[${upload.id}] multipart upload created (${res.UploadId})`);
        return upload;
    }
    async read(id) {
        const data = await this.client.getObject({
            Bucket: this.bucket,
            Key: id,
        });
        return data.Body;
    }
    /**
     * Write to the file, starting at the provided offset
     */
    async write(readable, id, offset) {
        // Metadata request needs to happen first
        const metadata = await this.getMetadata(id);
        const parts = await this.retrieveParts(id);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const partNumber = parts.length > 0 ? parts[parts.length - 1].PartNumber : 0;
        const nextPartNumber = partNumber + 1;
        const bytesUploaded = await this.processUpload(metadata, readable, nextPartNumber, offset);
        const newOffset = offset + bytesUploaded;
        if (metadata.file.size === newOffset) {
            try {
                const parts = await this.retrieveParts(id);
                await this.finishMultipartUpload(metadata, parts);
                this.clearCache(id);
            }
            catch (error) {
                log(`[${id}] failed to finish upload`, error);
                throw error;
            }
        }
        return newOffset;
    }
    async getUpload(id) {
        let metadata;
        try {
            metadata = await this.getMetadata(id);
        }
        catch (error) {
            log('getUpload: No file found.', error);
            throw server_2.ERRORS.FILE_NOT_FOUND;
        }
        let offset = 0;
        try {
            const parts = await this.retrieveParts(id);
            offset = calcOffsetFromParts(parts);
        }
        catch (error) {
            // Check if the error is caused by the upload not being found. This happens
            // when the multipart upload has already been completed or aborted. Since
            // we already found the info object, we know that the upload has been
            // completed and therefore can ensure the the offset is the size.
            // AWS S3 returns NoSuchUpload, but other implementations, such as DigitalOcean
            // Spaces, can also return NoSuchKey.
            if (error.Code === 'NoSuchUpload' || error.Code === 'NoSuchKey') {
                return new server_1.Upload({
                    id,
                    ...this.cache.get(id)?.file,
                    offset: metadata.file.size,
                    size: metadata.file.size,
                    metadata: metadata.file.metadata,
                });
            }
            log(error);
            throw error;
        }
        const incompletePartSize = await this.getIncompletePartSize(id);
        return new server_1.Upload({
            id,
            ...this.cache.get(id)?.file,
            offset: offset + (incompletePartSize ?? 0),
            size: metadata.file.size,
        });
    }
    async declareUploadLength(file_id, upload_length) {
        const { file, 'upload-id': uploadId } = await this.getMetadata(file_id);
        if (!file) {
            throw server_2.ERRORS.FILE_NOT_FOUND;
        }
        file.size = upload_length;
        return this.saveMetadata(file, uploadId);
    }
    async remove(id) {
        try {
            const { 'upload-id': uploadId } = await this.getMetadata(id);
            if (uploadId) {
                await this.client.abortMultipartUpload({
                    Bucket: this.bucket,
                    Key: id,
                    UploadId: uploadId,
                });
            }
        }
        catch (error) {
            if (error?.code && ['NotFound', 'NoSuchKey', 'NoSuchUpload'].includes(error.Code)) {
                log('remove: No file found.', error);
                throw server_2.ERRORS.FILE_NOT_FOUND;
            }
            throw error;
        }
        await this.client.deleteObjects({
            Bucket: this.bucket,
            Delete: {
                Objects: [{ Key: id }, { Key: `${id}.info` }],
            },
        });
        this.clearCache(id);
    }
    getExpirationDate(created_at) {
        const date = new Date(created_at);
        return new Date(date.getTime() + this.getExpiration());
    }
    getExpiration() {
        return this.expirationPeriodInMilliseconds;
    }
}
exports.S3Store = S3Store;

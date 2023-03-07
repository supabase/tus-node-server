"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamSplitter = void 0;
/* global BufferEncoding */
const node_crypto_1 = __importDefault(require("node:crypto"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_stream_1 = __importDefault(require("node:stream"));
function randomString(size) {
    return node_crypto_1.default.randomBytes(size).toString('base64url').slice(0, size);
}
class StreamSplitter extends node_stream_1.default.Writable {
    constructor({ chunkSize, directory }, options) {
        super(options);
        this.chunkSize = chunkSize;
        this.currentChunkPath = null;
        this.currentChunkSize = 0;
        this.fileHandle = null;
        this.directory = directory;
        this.filenameTemplate = randomString(10);
        this.part = 0;
        this.on('error', this._finishChunk.bind(this));
    }
    async _write(chunk, _, callback) {
        try {
            // In order to start writing a chunk, we must first create
            // a file system reference for it
            if (this.fileHandle === null) {
                await this._newChunk();
            }
            const overflow = this.currentChunkSize + chunk.length - this.chunkSize;
            // The current chunk will be more than our defined part size if we would
            // write all of it to disk.
            if (overflow > 0) {
                // Only write to disk the up to our defined part size.
                await this._writeChunk(chunk.slice(0, chunk.length - overflow));
                await this._finishChunk();
                // We still have some overflow left, so we write it to a new chunk.
                await this._newChunk();
                await this._writeChunk(chunk.slice(chunk.length - overflow, chunk.length));
                callback(null);
                return;
            }
            // The chunk is smaller than our defined part size so we can just write it to disk.
            await this._writeChunk(chunk);
            callback(null);
        }
        catch (error) {
            callback(error);
        }
    }
    async _final(callback) {
        if (this.fileHandle === null) {
            callback(null);
            return;
        }
        try {
            await this._finishChunk();
            callback(null);
        }
        catch (error) {
            callback(error);
        }
    }
    async _writeChunk(chunk) {
        await promises_1.default.appendFile(this.fileHandle, chunk);
        this.currentChunkSize += chunk.length;
    }
    async _finishChunk() {
        if (this.fileHandle === null) {
            return;
        }
        await this.fileHandle.close();
        this.emit('chunkFinished', {
            path: this.currentChunkPath,
            size: this.currentChunkSize,
        });
        this.currentChunkPath = null;
        this.fileHandle = null;
        this.currentChunkSize = 0;
        this.part += 1;
    }
    async _newChunk() {
        this.currentChunkPath = node_path_1.default.join(this.directory, `${this.filenameTemplate}-${this.part}`);
        const fileHandle = await promises_1.default.open(this.currentChunkPath, 'w');
        this.emit('chunkStarted', this.currentChunkPath);
        this.currentChunkSize = 0;
        this.fileHandle = fileHandle;
    }
}
exports.StreamSplitter = StreamSplitter;

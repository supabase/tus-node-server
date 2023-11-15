"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileConfigstore = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const p_queue_1 = __importDefault(require("p-queue"));
/**
 * FileConfigstore writes the `Upload` JSON metadata to disk next the uploaded file itself.
 * It uses a queue which only processes one operation at a time to prevent unsafe concurrent access.
 */
class FileConfigstore {
    constructor(path) {
        this.directory = path;
        this.queue = new p_queue_1.default({ concurrency: 1 });
    }
    async get(key) {
        try {
            const buffer = await this.queue.add(() => promises_1.default.readFile(this.resolve(key), 'utf8'));
            return JSON.parse(buffer);
        }
        catch {
            return undefined;
        }
    }
    async set(key, value) {
        await this.queue.add(() => promises_1.default.writeFile(this.resolve(key), JSON.stringify(value)));
    }
    async delete(key) {
        await this.queue.add(() => promises_1.default.rm(this.resolve(key)));
    }
    async list() {
        return this.queue.add(async () => {
            const files = await promises_1.default.readdir(this.directory);
            const sorted = files.sort((a, b) => a.localeCompare(b));
            const name = (file) => node_path_1.default.basename(file, '.json');
            // To only return tus file IDs we check if the file has a corresponding JSON info file
            return sorted.filter((file, idx) => idx < sorted.length - 1 && name(file) === name(sorted[idx + 1]));
        });
    }
    resolve(key) {
        return node_path_1.default.resolve(this.directory, `${key}.json`);
    }
}
exports.FileConfigstore = FileConfigstore;

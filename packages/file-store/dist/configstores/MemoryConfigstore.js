"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryConfigstore = void 0;
const server_1 = require("@tus/server");
/**
 * Memory based configstore.
 * Used mostly for unit tests.
 *
 * @author Mitja Puzigaća <mitjap@gmail.com>
 */
class MemoryConfigstore {
    constructor() {
        this.data = new Map();
    }
    async get(key) {
        return this.deserializeValue(this.data.get(key));
    }
    async set(key, value) {
        this.data.set(key, this.serializeValue(value));
    }
    async delete(key) {
        this.data.delete(key);
    }
    async list() {
        return [...this.data.keys()];
    }
    serializeValue(value) {
        return JSON.stringify(value);
    }
    deserializeValue(buffer) {
        return buffer ? new server_1.Upload(JSON.parse(buffer)) : undefined;
    }
}
exports.MemoryConfigstore = MemoryConfigstore;

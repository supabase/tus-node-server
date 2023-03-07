"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryConfigstore = void 0;
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
    get(key) {
        return this.data.get(key);
    }
    set(key, value) {
        this.data.set(key, value);
    }
    async delete(key) {
        return this.data.delete(key);
    }
    get all() {
        return Object.fromEntries(this.data.entries());
    }
}
exports.MemoryConfigstore = MemoryConfigstore;

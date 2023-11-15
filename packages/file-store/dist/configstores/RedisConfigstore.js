"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConfigstore = void 0;
/**
 * Redis based configstore.
 *
 * @author Mitja Puzigaća <mitjap@gmail.com>
 */
class RedisConfigstore {
    constructor(redis, prefix = '') {
        this.redis = redis;
        this.prefix = prefix;
        this.redis = redis;
        this.prefix = prefix;
    }
    async get(key) {
        return this.deserializeValue(await this.redis.get(this.prefix + key));
    }
    async set(key, value) {
        await this.redis.set(this.prefix + key, this.serializeValue(value));
    }
    async delete(key) {
        await this.redis.del(this.prefix + key);
    }
    async list() {
        return this.redis.keys(this.prefix + '*');
    }
    serializeValue(value) {
        return JSON.stringify(value);
    }
    deserializeValue(buffer) {
        return buffer ? JSON.parse(buffer) : undefined;
    }
}
exports.RedisConfigstore = RedisConfigstore;

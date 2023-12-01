"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryLocker = void 0;
const constants_1 = require("../constants");
class Lock {
}
class MemoryLocker {
    constructor(options) {
        this.locks = new Map();
        this.timeout = options?.acquireLockTimeout ?? 1000 * 30;
    }
    async lock(id, requestRelease) {
        const abortController = new AbortController();
        const lock = await Promise.race([
            this.waitTimeout(abortController.signal),
            this.acquireLock(id, abortController.signal),
        ]);
        abortController.abort();
        if (!lock) {
            throw constants_1.ERRORS.ERR_LOCK_TIMEOUT;
        }
        lock.requestRelease = requestRelease;
    }
    async acquireLock(id, signal) {
        if (signal.aborted) {
            return;
        }
        const lock = this.locks.get(id);
        if (!lock) {
            const lock = new Lock();
            this.locks.set(id, lock);
            return lock;
        }
        await lock.requestRelease?.();
        const potentialNewLock = this.locks.get(id);
        if (!potentialNewLock) {
            const lock = new Lock();
            this.locks.set(id, lock);
            return lock;
        }
        return await new Promise((resolve, reject) => {
            setImmediate(() => {
                this.acquireLock(id, signal).then(resolve).catch(reject);
            });
        });
    }
    async unlock(id) {
        const lock = this.locks.get(id);
        if (!lock) {
            throw new Error('Releasing an unlocked lock!');
        }
        this.locks.delete(id);
    }
    waitTimeout(signal) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve();
            }, this.timeout);
            const abortListener = () => {
                clearTimeout(timeout);
                signal.removeEventListener('abort', abortListener);
                resolve();
            };
            signal.addEventListener('abort', abortListener);
        });
    }
}
exports.MemoryLocker = MemoryLocker;

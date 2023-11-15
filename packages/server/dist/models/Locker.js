"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryLocker = void 0;
class Lock {
    constructor() {
        this.locked = false;
        this.pendingLocks = new Array();
    }
}
class MemoryLocker {
    constructor() {
        this.locks = new Map();
    }
    getLock(id) {
        let lock = this.locks.get(id);
        if (lock === undefined) {
            lock = new Lock();
            this.locks.set(id, lock);
        }
        return lock;
    }
    async lock(id) {
        const lock = this.getLock(id);
        if (lock.locked) {
            await new Promise((resolve) => {
                lock.pendingLocks.push(resolve);
            });
        }
        lock.locked = true;
    }
    async unlock(id) {
        const lock = this.getLock(id);
        if (!lock.locked) {
            throw new Error('Releasing an unlocked lock!');
        }
        lock.locked = false;
        // notify next pending lock
        const callback = lock.pendingLocks.shift();
        if (callback === undefined) {
            this.locks.delete(id);
        }
        else {
            callback();
        }
    }
}
exports.MemoryLocker = MemoryLocker;

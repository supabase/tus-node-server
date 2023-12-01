/// <reference types="node" />
export type RequestRelease = () => Promise<void> | void;
export interface Locker {
    lock(id: string, cancelReq: RequestRelease): Promise<void>;
    unlock(id: string): Promise<void>;
}
export interface MemoryLockerOptions {
    acquireLockTimeout: number;
}
declare class Lock {
    requestRelease?: RequestRelease;
}
export declare class MemoryLocker implements Locker {
    private locks;
    protected timeout: number;
    constructor(options?: MemoryLockerOptions);
    lock(id: string, requestRelease: RequestRelease): Promise<void>;
    protected acquireLock(id: string, signal: AbortSignal): Promise<Lock | void>;
    unlock(id: string): Promise<void>;
    protected waitTimeout(signal: AbortSignal): Promise<void>;
}
export {};

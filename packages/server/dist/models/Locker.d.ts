export interface Locker {
    lock(id: string): Promise<void>;
    unlock(id: string): Promise<void>;
}
export declare class MemoryLocker implements Locker {
    private locks;
    private getLock;
    lock(id: string): Promise<void>;
    unlock(id: string): Promise<void>;
}

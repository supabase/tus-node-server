import type { Upload } from '../models';
/**
 * Memory based configstore.
 * Used mostly for unit tests.
 *
 * @author Mitja Puzigaća <mitjap@gmail.com>
 */
export declare class MemoryConfigstore {
    data: Map<string, Upload>;
    get(key: string): Upload | undefined;
    set(key: string, value: Upload): void;
    delete(key: string): Promise<boolean>;
    get all(): Record<string, Upload>;
}

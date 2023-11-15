import { Upload } from '@tus/server';
import { Configstore } from './Types';
/**
 * Memory based configstore.
 * Used mostly for unit tests.
 *
 * @author Mitja Puzigaća <mitjap@gmail.com>
 */
export declare class MemoryConfigstore implements Configstore {
    data: Map<string, string>;
    get(key: string): Promise<Upload | undefined>;
    set(key: string, value: Upload): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Array<string>>;
    private serializeValue;
    private deserializeValue;
}

import { Upload } from '@tus/server';
import PQueue from 'p-queue';
import { Configstore } from './Types';
/**
 * FileConfigstore writes the `Upload` JSON metadata to disk next the uploaded file itself.
 * It uses a queue which only processes one operation at a time to prevent unsafe concurrent access.
 */
export declare class FileConfigstore implements Configstore {
    directory: string;
    queue: PQueue;
    constructor(path: string);
    get(key: string): Promise<Upload | undefined>;
    set(key: string, value: Upload): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Array<string>>;
    private resolve;
}

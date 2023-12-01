import { RedisClientType } from '@redis/client';
import { Upload } from '@tus/server';
import { Configstore } from './Types';
/**
 * Redis based configstore.
 *
 * @author Mitja Puzigaća <mitjap@gmail.com>
 */
export declare class RedisConfigstore implements Configstore {
    private redis;
    private prefix;
    constructor(redis: RedisClientType, prefix?: string);
    get(key: string): Promise<Upload | undefined>;
    set(key: string, value: Upload): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Array<string>>;
    private serializeValue;
    private deserializeValue;
}

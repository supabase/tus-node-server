/// <reference types="node" />
/// <reference types="node" />
import { Bucket } from '@google-cloud/storage';
import stream from 'node:stream';
import http from 'node:http';
import { Upload, DataStore } from '@tus/server';
type Options = {
    bucket: Bucket;
};
export declare class GCSStore extends DataStore {
    bucket: Bucket;
    constructor(options: Options);
    create(file: Upload): Promise<Upload>;
    read(file_id: string): stream.Readable;
    /**
     * Get the file metatata from the object in GCS, then upload a new version
     * passing through the metadata to the new version.
     */
    write(readable: http.IncomingMessage | stream.Readable, id: string, offset: number): Promise<number>;
    getUpload(id: string): Promise<Upload>;
    declareUploadLength(id: string, upload_length: number): Promise<void>;
}
export {};

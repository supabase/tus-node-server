/// <reference types="node" />
/// <reference types="node" />
import { Storage, Bucket } from '@google-cloud/storage';
import stream from 'node:stream';
import http from 'node:http';
import { Upload, DataStore } from '@tus/server';
type Options = {
    bucket: string;
    projectId: string;
    keyFilename: string;
};
export declare class GCSStore extends DataStore {
    bucket: Bucket;
    bucket_name: string;
    gcs: Storage;
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

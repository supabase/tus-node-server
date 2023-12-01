/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import fs from 'node:fs';
import stream from 'node:stream';
import http from 'node:http';
import { S3ClientConfig } from '@aws-sdk/client-s3';
import { DataStore, Upload } from '@tus/server';
type Options = {
    partSize?: number;
    expirationPeriodInMilliseconds?: number;
    s3ClientConfig: S3ClientConfig & {
        bucket: string;
    };
};
export declare class S3Store extends DataStore {
    private bucket;
    private cache;
    private client;
    private preferredPartSize;
    private expirationPeriodInMilliseconds;
    maxMultipartParts: 10000;
    minPartSize: 5242880;
    maxUploadSize: 5497558138880;
    constructor(options: Options);
    /**
     * Saves upload metadata to a `${file_id}.info` file on S3.
     * Please note that the file is empty and the metadata is saved
     * on the S3 object's `Metadata` field, so that only a `headObject`
     * is necessary to retrieve the data.
     */
    private saveMetadata;
    private completeMetadata;
    /**
     * Retrieves upload metadata previously saved in `${file_id}.info`.
     * There's a small and simple caching mechanism to avoid multiple
     * HTTP calls to S3.
     */
    private getMetadata;
    private infoKey;
    private partKey;
    private uploadPart;
    private uploadIncompletePart;
    private getIncompletePart;
    private getIncompletePartSize;
    private deleteIncompletePart;
    private prependIncompletePart;
    /**
     * Uploads a stream to s3 using multiple parts
     */
    private processUpload;
    /**
     * Completes a multipart upload on S3.
     * This is where S3 concatenates all the uploaded parts.
     */
    private finishMultipartUpload;
    /**
     * Gets the number of complete parts/chunks already uploaded to S3.
     * Retrieves only consecutive parts.
     */
    private retrieveParts;
    /**
     * Removes cached data for a given file.
     */
    private clearCache;
    private calcOptimalPartSize;
    /**
     * Creates a multipart upload on S3 attaching any metadata to it.
     * Also, a `${file_id}.info` file is created which holds some information
     * about the upload itself like: `upload-id`, `upload-length`, etc.
     */
    create(upload: Upload): Promise<Upload>;
    read(id: string): Promise<stream.Readable>;
    /**
     * Write to the file, starting at the provided offset
     */
    write(readable: http.IncomingMessage | fs.ReadStream, id: string, offset: number): Promise<number>;
    getUpload(id: string): Promise<Upload>;
    declareUploadLength(file_id: string, upload_length: number): Promise<void>;
    remove(id: string): Promise<void>;
    protected getExpirationDate(created_at: string): Date;
    getExpiration(): number;
    deleteExpired(): Promise<number>;
}
export {};

/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import fs from 'node:fs';
import type { Readable } from 'node:stream';
import http from 'node:http';
import aws from 'aws-sdk';
import { DataStore, Upload } from '@tus/server';
type Options = {
    partSize?: number;
    s3ClientConfig: aws.S3.Types.ClientConfiguration & {
        bucket: string;
    };
    expirationPeriodInMilliseconds?: number;
    client?: aws.S3;
    cache?: Map<string, MetadataValue>;
};
type MetadataValue = {
    file: Upload;
    upload_id: string;
    tus_version: string;
};
export declare class S3Store extends DataStore {
    protected bucket: string;
    protected cache: Map<string, MetadataValue>;
    protected client: aws.S3;
    private preferredPartSize;
    maxMultipartParts: 10000;
    minPartSize: 5242880;
    private expirationPeriodInMilliseconds;
    constructor(options: Options);
    /**
     * Saves upload metadata to a `${file_id}.info` file on S3.
     * Please note that the file is empty and the metadata is saved
     * on the S3 object's `Metadata` field, so that only a `headObject`
     * is necessary to retrieve the data.
     */
    protected saveMetadata(upload: Upload, upload_id: string): Promise<void>;
    /**
     * Retrieves upload metadata previously saved in `${file_id}.info`.
     * There's a small and simple caching mechanism to avoid multiple
     * HTTP calls to S3.
     */
    protected getMetadata(id: string): Promise<MetadataValue>;
    private partKey;
    protected uploadPart(metadata: MetadataValue, readStream: fs.ReadStream | Readable, partNumber: number): Promise<string>;
    protected uploadIncompletePart(id: string, readStream: fs.ReadStream | Readable): Promise<string>;
    private getIncompletePart;
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
     * about the upload itself like: `upload_id`, `upload_length`, etc.
     */
    create(upload: Upload): Promise<Upload>;
    /**
     * Write to the file, starting at the provided offset
     */
    write(readable: http.IncomingMessage | fs.ReadStream, id: string, offset: number): Promise<number>;
    getUpload(id: string): Promise<Upload>;
    declareUploadLength(file_id: string, upload_length: number): Promise<void>;
    remove(id: string): Promise<void>;
    getExpiration(): number;
}
export {};

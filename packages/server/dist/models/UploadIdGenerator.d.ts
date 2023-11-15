/// <reference types="node" />
import http from 'node:http';
export interface UploadIdGenerator {
    generateUrl(req: http.IncomingMessage, id: string): string;
    getFileIdFromRequest(req: http.IncomingMessage): string | false;
}
export interface DefaultUploadIdGeneratorOptions {
    path: string;
    relativeLocation?: boolean;
    respectForwardedHeaders?: boolean;
}
export declare class DefaultUploadIdGenerator implements UploadIdGenerator {
    private readonly options;
    constructor(options: DefaultUploadIdGeneratorOptions);
    generateUrl(req: http.IncomingMessage, id: string): string;
    getFileIdFromRequest(req: http.IncomingMessage): string | false;
}

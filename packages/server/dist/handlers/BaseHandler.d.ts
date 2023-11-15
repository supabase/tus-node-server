/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from 'node:events';
import type { ServerOptions } from '../types';
import type { DataStore, UploadIdGenerator } from '../models';
import type http from 'node:http';
import { Upload } from '../models';
export declare class BaseHandler extends EventEmitter {
    options: ServerOptions;
    store: DataStore;
    uploadIdGenerator: UploadIdGenerator;
    constructor(store: DataStore, options: ServerOptions);
    write(res: http.ServerResponse, status: number, headers?: {}, body?: string): http.ServerResponse<http.IncomingMessage>;
    generateUrl(req: http.IncomingMessage, id: string): string;
    getFileIdFromRequest(req: http.IncomingMessage): string | false;
    getLocker(req: http.IncomingMessage): import("../models").Locker | undefined;
    lock<T>(req: http.IncomingMessage, id: string, fn: () => Promise<T>): Promise<T>;
    getConfiguredMaxSize(req: http.IncomingMessage, id: string): number | Promise<number>;
    getBodyMaxSize(req: http.IncomingMessage, info: Upload, configuredMaxSize?: number): Promise<number>;
}

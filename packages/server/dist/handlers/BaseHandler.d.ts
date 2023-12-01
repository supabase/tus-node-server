/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from 'node:events';
import type { ServerOptions } from '../types';
import type { DataStore } from '../models';
import type http from 'node:http';
import { Upload } from '../models';
export interface CancellationContext {
    signal: AbortSignal;
    abort: () => void;
    cancel: () => void;
}
export declare class BaseHandler extends EventEmitter {
    options: ServerOptions;
    store: DataStore;
    constructor(store: DataStore, options: ServerOptions);
    write(res: http.ServerResponse, status: number, headers?: {}, body?: string): http.ServerResponse<http.IncomingMessage>;
    generateUrl(req: http.IncomingMessage, id: string): string;
    getFileIdFromRequest(req: http.IncomingMessage): string | void;
    protected extractHostAndProto(req: http.IncomingMessage): {
        host: string;
        proto: string;
    };
    protected getLocker(req: http.IncomingMessage): import("../models").Locker | undefined;
    protected acquireLock(req: http.IncomingMessage, id: string, context: CancellationContext): Promise<() => Promise<void> | undefined>;
    protected writeToStore(req: http.IncomingMessage, id: string, offset: number, maxFileSize: number, context: CancellationContext): Promise<number>;
    getConfiguredMaxSize(req: http.IncomingMessage, id: string): number | Promise<number>;
    getBodyMaxSize(req: http.IncomingMessage, info: Upload, configuredMaxSize?: number): Promise<number>;
}

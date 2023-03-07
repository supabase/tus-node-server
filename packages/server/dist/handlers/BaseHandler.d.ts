/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from 'node:events';
import type { ServerOptions } from '../types';
import type { DataStore } from '../models';
import type http from 'node:http';
export declare class BaseHandler extends EventEmitter {
    options: ServerOptions;
    store: DataStore;
    constructor(store: DataStore, options: ServerOptions);
    write(res: http.ServerResponse, status: number, headers?: {}, body?: string): http.ServerResponse<http.IncomingMessage>;
    generateUrl(req: http.IncomingMessage, id: string): string;
    getFileIdFromRequest(req: http.IncomingMessage): string | false;
}

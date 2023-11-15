/// <reference types="node" />
import { BaseHandler } from './BaseHandler';
import type http from 'node:http';
import type { ServerOptions } from '../types';
import type { DataStore } from '../models';
export declare class PostHandler extends BaseHandler {
    options: Required<Pick<ServerOptions, 'namingFunction'>> & Omit<ServerOptions, 'namingFunction'>;
    constructor(store: DataStore, options: ServerOptions);
    /**
     * Create a file in the DataStore.
     */
    send(req: http.IncomingMessage, res: http.ServerResponse): Promise<http.ServerResponse<http.IncomingMessage>>;
}

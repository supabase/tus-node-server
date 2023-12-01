/// <reference types="node" />
/// <reference types="node" />
import stream from 'node:stream';
import { BaseHandler } from './BaseHandler';
import type http from 'node:http';
import type { RouteHandler } from '../types';
export declare class GetHandler extends BaseHandler {
    paths: Map<string, RouteHandler>;
    registerPath(path: string, handler: RouteHandler): void;
    /**
     * Read data from the DataStore and send the stream.
     */
    send(req: http.IncomingMessage, res: http.ServerResponse): Promise<stream.Writable | void>;
}

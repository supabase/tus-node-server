/// <reference types="node" />
import { BaseHandler } from './BaseHandler';
import type http from 'node:http';
export declare class PatchHandler extends BaseHandler {
    /**
     * Write data to the DataStore and return the new offset.
     */
    send(req: http.IncomingMessage, res: http.ServerResponse): Promise<http.ServerResponse<http.IncomingMessage>>;
}

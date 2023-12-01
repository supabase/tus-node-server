/// <reference types="node" />
import { BaseHandler, CancellationContext } from './BaseHandler';
import type http from 'node:http';
export declare class PatchHandler extends BaseHandler {
    /**
     * Write data to the DataStore and return the new offset.
     */
    send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext): Promise<http.ServerResponse<http.IncomingMessage>>;
}

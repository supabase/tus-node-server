/// <reference types="node" />
import { BaseHandler, CancellationContext } from './BaseHandler';
import type http from 'node:http';
export declare class DeleteHandler extends BaseHandler {
    send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext): Promise<http.ServerResponse<http.IncomingMessage>>;
}

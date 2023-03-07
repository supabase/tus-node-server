/// <reference types="node" />
import { BaseHandler } from './BaseHandler';
import type http from 'node:http';
export declare class DeleteHandler extends BaseHandler {
    send(req: http.IncomingMessage, res: http.ServerResponse): Promise<http.ServerResponse<http.IncomingMessage>>;
}

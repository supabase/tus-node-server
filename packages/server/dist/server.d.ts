/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import http from 'node:http';
import { EventEmitter } from 'node:events';
import { GetHandler } from './handlers/GetHandler';
import { HeadHandler } from './handlers/HeadHandler';
import { OptionsHandler } from './handlers/OptionsHandler';
import { PatchHandler } from './handlers/PatchHandler';
import { PostHandler } from './handlers/PostHandler';
import { DeleteHandler } from './handlers/DeleteHandler';
import { EVENTS } from './constants';
import type stream from 'node:stream';
import type { ServerOptions, RouteHandler } from './types';
import type { DataStore, Upload } from './models';
type Handlers = {
    GET: InstanceType<typeof GetHandler>;
    HEAD: InstanceType<typeof HeadHandler>;
    OPTIONS: InstanceType<typeof OptionsHandler>;
    PATCH: InstanceType<typeof PatchHandler>;
    POST: InstanceType<typeof PostHandler>;
    DELETE: InstanceType<typeof DeleteHandler>;
};
interface TusEvents {
    [EVENTS.POST_CREATE]: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload, url: string) => void;
    [EVENTS.POST_RECEIVE]: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => void;
    [EVENTS.POST_FINISH]: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => void;
    [EVENTS.POST_TERMINATE]: (req: http.IncomingMessage, res: http.ServerResponse, id: string) => void;
}
type on = EventEmitter['on'];
type emit = EventEmitter['emit'];
export declare interface Server {
    on<Event extends keyof TusEvents>(event: Event, listener: TusEvents[Event]): this;
    on(eventName: Parameters<on>[0], listener: Parameters<on>[1]): this;
    emit<Event extends keyof TusEvents>(event: Event, listener: TusEvents[Event]): ReturnType<emit>;
    emit(eventName: Parameters<emit>[0], listener: Parameters<emit>[1]): ReturnType<emit>;
}
export declare class Server extends EventEmitter {
    datastore: DataStore;
    handlers: Handlers;
    options: ServerOptions;
    constructor(options: ServerOptions & {
        datastore: DataStore;
    });
    get(path: string, handler: RouteHandler): void;
    /**
     * Main server requestListener, invoked on every 'request' event.
     */
    handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<http.ServerResponse | stream.Writable | void>;
    listen(...args: any[]): http.Server;
    cleanUpExpiredUploads(): Promise<number>;
}
export {};

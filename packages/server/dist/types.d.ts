/// <reference types="node" />
import type http from 'node:http';
import type { Locker, Upload } from './models';
export type ServerOptions = {
    path: string;
    maxSize?: number | ((req: http.IncomingMessage, uploadId: string) => Promise<number> | number);
    relativeLocation?: boolean;
    respectForwardedHeaders?: boolean;
    allowedHeaders?: string[];
    generateUrl?: (req: http.IncomingMessage, options: {
        proto: string;
        host: string;
        baseUrl: string;
        path: string;
        id: string;
    }) => string;
    getFileIdFromRequest?: (req: http.IncomingMessage) => string | void;
    namingFunction?: (req: http.IncomingMessage) => string;
    locker?: Locker | ((req: http.IncomingMessage) => Locker);
    onUploadCreate?: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => Promise<http.ServerResponse>;
    onUploadFinish?: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => Promise<http.ServerResponse>;
    onIncomingRequest?: (req: http.IncomingMessage, res: http.ServerResponse, uploadId: string) => Promise<void>;
    onResponseError?: (req: http.IncomingMessage, res: http.ServerResponse, err: Error | {
        status_code: number;
        body: string;
    }) => Promise<{
        status_code: number;
        body: string;
    } | void> | {
        status_code: number;
        body: string;
    } | void;
};
export type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

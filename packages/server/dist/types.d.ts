/// <reference types="node" />
import type http from 'node:http';
import type { Locker, Upload, UploadIdGenerator } from './models';
export type ServerOptions = {
    path: string;
    maxSize?: number | ((req: http.IncomingMessage, uploadId: string) => Promise<number> | number);
    relativeLocation?: boolean;
    respectForwardedHeaders?: boolean;
    uploadIdGenerator?: UploadIdGenerator;
    namingFunction?: (req: http.IncomingMessage) => string;
    locker?: Locker | ((req: http.IncomingMessage) => Locker);
    onUploadCreate?: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => Promise<http.ServerResponse>;
    onUploadFinish?: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => Promise<http.ServerResponse>;
    onIncomingRequest?: (req: http.IncomingMessage, res: http.ServerResponse, uploadId: string) => Promise<void>;
    onResponseError?: (req: http.IncomingMessage, res: http.ServerResponse, err: {
        status_code: number;
        body: string;
    }, write: (error: {
        status_code: number;
        body: string;
    }) => http.ServerResponse) => Promise<http.ServerResponse> | http.ServerResponse;
};
export type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

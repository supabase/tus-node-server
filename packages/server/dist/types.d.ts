/// <reference types="node" />
import type http from 'node:http';
import type { Upload } from './models';
export type ServerOptions = {
    path: string;
    relativeLocation?: boolean;
    respectForwardedHeaders?: boolean;
    namingFunction?: (req: http.IncomingMessage) => string;
    onUploadCreate?: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => Promise<http.ServerResponse>;
    onUploadFinish?: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => Promise<http.ServerResponse>;
};
export type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

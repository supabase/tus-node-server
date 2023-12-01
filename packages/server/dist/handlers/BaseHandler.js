"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHandler = void 0;
const node_events_1 = __importDefault(require("node:events"));
const node_stream_1 = __importDefault(require("node:stream"));
const promises_1 = __importDefault(require("node:stream/promises"));
const constants_1 = require("../constants");
const StreamLimiter_1 = require("../models/StreamLimiter");
const reExtractFileID = /([^/]+)\/?$/;
const reForwardedHost = /host="?([^";]+)/;
const reForwardedProto = /proto=(https?)/;
class BaseHandler extends node_events_1.default {
    constructor(store, options) {
        super();
        if (!store) {
            throw new Error('Store must be defined');
        }
        this.store = store;
        this.options = options;
    }
    write(res, status, headers = {}, body = '') {
        if (status !== 204) {
            // @ts-expect-error not explicitly typed but possible
            headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
        }
        res.writeHead(status, headers);
        res.write(body);
        return res.end();
    }
    generateUrl(req, id) {
        // @ts-expect-error
        const baseUrl = req.baseUrl ?? '';
        const path = this.options.path === '/' ? '' : this.options.path;
        if (this.options.generateUrl) {
            // user-defined generateUrl function
            const { proto, host } = this.extractHostAndProto(req);
            return this.options.generateUrl(req, {
                proto,
                host,
                baseUrl: baseUrl,
                path: path,
                id,
            });
        }
        // Default implementation
        if (this.options.relativeLocation) {
            return `${baseUrl}${path}/${id}`;
        }
        const { proto, host } = this.extractHostAndProto(req);
        return `${proto}://${host}${baseUrl}${path}/${id}`;
    }
    getFileIdFromRequest(req) {
        if (this.options.getFileIdFromRequest) {
            return this.options.getFileIdFromRequest(req);
        }
        const match = reExtractFileID.exec(req.url);
        if (!match || this.options.path.includes(match[1])) {
            return;
        }
        return decodeURIComponent(match[1]);
    }
    extractHostAndProto(req) {
        let proto;
        let host;
        if (this.options.respectForwardedHeaders) {
            const forwarded = req.headers.forwarded;
            if (forwarded) {
                host ?? (host = reForwardedHost.exec(forwarded)?.[1]);
                proto ?? (proto = reForwardedProto.exec(forwarded)?.[1]);
            }
            const forwardHost = req.headers['x-forwarded-host'];
            const forwardProto = req.headers['x-forwarded-proto'];
            // @ts-expect-error we can pass undefined
            if (['http', 'https'].includes(forwardProto)) {
                proto ?? (proto = forwardProto);
            }
            host ?? (host = forwardHost);
        }
        host ?? (host = req.headers.host);
        proto ?? (proto = 'http');
        return { host: host, proto };
    }
    getLocker(req) {
        if (typeof this.options.locker === 'function') {
            return this.options.locker(req);
        }
        return this.options.locker;
    }
    async acquireLock(req, id, context) {
        const locker = this.getLocker(req);
        await locker?.lock(id, () => {
            context.cancel();
        });
        return () => locker?.unlock(id);
    }
    writeToStore(req, id, offset, maxFileSize, context) {
        return new Promise(async (resolve, reject) => {
            if (context.signal.aborted) {
                reject(constants_1.ERRORS.ABORTED);
                return;
            }
            const proxy = new node_stream_1.default.PassThrough();
            node_stream_1.default.addAbortSignal(context.signal, proxy);
            proxy.on('error', (err) => {
                req.unpipe(proxy);
                if (err.name === 'AbortError') {
                    reject(constants_1.ERRORS.ABORTED);
                }
                else {
                    reject(err);
                }
            });
            req.on('error', (err) => {
                if (!proxy.closed) {
                    proxy.destroy(err);
                }
            });
            promises_1.default
                .pipeline(req.pipe(proxy), new StreamLimiter_1.StreamLimiter(maxFileSize), async (stream) => {
                return this.store.write(stream, id, offset);
            })
                .then(resolve)
                .catch(reject);
        });
    }
    getConfiguredMaxSize(req, id) {
        if (typeof this.options.maxSize === 'function') {
            return this.options.maxSize(req, id);
        }
        return this.options.maxSize ?? 0;
    }
    async getBodyMaxSize(req, info, configuredMaxSize) {
        configuredMaxSize =
            configuredMaxSize ?? (await this.getConfiguredMaxSize(req, info.id));
        const length = parseInt(req.headers['content-length'] || '0', 10);
        const offset = info.offset;
        // Test if this upload fits into the file's size
        if (!info.sizeIsDeferred && offset + length > (info.size || 0)) {
            throw constants_1.ERRORS.ERR_SIZE_EXCEEDED;
        }
        let maxSize = (info.size || 0) - offset;
        // If the upload's length is deferred and the PATCH request does not contain the Content-Length
        // header (which is allowed if 'Transfer-Encoding: chunked' is used), we still need to set limits for
        // the body size.
        if (info.sizeIsDeferred) {
            if (configuredMaxSize > 0) {
                // Ensure that the upload does not exceed the maximum upload size
                maxSize = configuredMaxSize - offset;
            }
            else {
                // If no upload limit is given, we allow arbitrary sizes
                maxSize = Number.MAX_SAFE_INTEGER;
            }
        }
        if (length > 0) {
            maxSize = length;
        }
        // limit the request body to the maxSize if provided
        if (configuredMaxSize > 0 && maxSize > configuredMaxSize) {
            maxSize = configuredMaxSize;
        }
        return maxSize;
    }
}
exports.BaseHandler = BaseHandler;

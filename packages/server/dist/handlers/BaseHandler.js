"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHandler = void 0;
const node_events_1 = __importDefault(require("node:events"));
const constants_1 = require("../constants");
const models_1 = require("../models");
class BaseHandler extends node_events_1.default {
    constructor(store, options) {
        super();
        if (!store) {
            throw new Error('Store must be defined');
        }
        this.store = store;
        this.options = options;
        this.uploadIdGenerator =
            options.uploadIdGenerator ??
                new models_1.DefaultUploadIdGenerator({
                    path: options.path,
                    relativeLocation: options.relativeLocation,
                    respectForwardedHeaders: options.respectForwardedHeaders,
                });
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
        return this.uploadIdGenerator.generateUrl(req, id);
    }
    getFileIdFromRequest(req) {
        return this.uploadIdGenerator.getFileIdFromRequest(req);
    }
    getLocker(req) {
        if (typeof this.options.locker === 'function') {
            return this.options.locker(req);
        }
        return this.options.locker;
    }
    async lock(req, id, fn) {
        const locker = this.getLocker(req);
        try {
            await locker?.lock(id);
            return await fn();
        }
        finally {
            await locker?.unlock(id);
        }
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

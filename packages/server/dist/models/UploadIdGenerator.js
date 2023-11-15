"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultUploadIdGenerator = void 0;
const reExtractFileID = /([^/]+)\/?$/;
const reForwardedHost = /host="?([^";]+)/;
const reForwardedProto = /proto=(https?)/;
class DefaultUploadIdGenerator {
    constructor(options) {
        this.options = options;
    }
    generateUrl(req, id) {
        id = encodeURIComponent(id);
        const forwarded = req.headers.forwarded;
        const path = this.options.path === '/' ? '' : this.options.path;
        // @ts-expect-error baseUrl type doesn't exist?
        const baseUrl = req.baseUrl ?? '';
        let proto;
        let host;
        if (this.options.relativeLocation) {
            return `${baseUrl}${path}/${id}`;
        }
        if (this.options.respectForwardedHeaders) {
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
        return `${proto}://${host}${baseUrl}${path}/${id}`;
    }
    getFileIdFromRequest(req) {
        const match = reExtractFileID.exec(req.url);
        if (!match || this.options.path.includes(match[1])) {
            return false;
        }
        return decodeURIComponent(match[1]);
    }
}
exports.DefaultUploadIdGenerator = DefaultUploadIdGenerator;

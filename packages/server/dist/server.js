"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const node_http_1 = __importDefault(require("node:http"));
const node_events_1 = require("node:events");
const debug_1 = __importDefault(require("debug"));
const GetHandler_1 = require("./handlers/GetHandler");
const HeadHandler_1 = require("./handlers/HeadHandler");
const OptionsHandler_1 = require("./handlers/OptionsHandler");
const PatchHandler_1 = require("./handlers/PatchHandler");
const PostHandler_1 = require("./handlers/PostHandler");
const DeleteHandler_1 = require("./handlers/DeleteHandler");
const HeaderValidator_1 = require("./validators/HeaderValidator");
const constants_1 = require("./constants");
const log = (0, debug_1.default)('tus-node-server');
// eslint-disable-next-line no-redeclare
class Server extends node_events_1.EventEmitter {
    constructor(options) {
        super();
        if (!options) {
            throw new Error("'options' must be defined");
        }
        if (!options.path) {
            throw new Error("'path' is not defined; must have a path");
        }
        if (!options.datastore) {
            throw new Error("'datastore' is not defined; must have a datastore");
        }
        const { datastore, ...rest } = options;
        this.options = rest;
        this.datastore = datastore;
        this.handlers = {
            // GET handlers should be written in the implementations
            GET: new GetHandler_1.GetHandler(this.datastore, this.options),
            // These methods are handled under the tus protocol
            HEAD: new HeadHandler_1.HeadHandler(this.datastore, this.options),
            OPTIONS: new OptionsHandler_1.OptionsHandler(this.datastore, this.options),
            PATCH: new PatchHandler_1.PatchHandler(this.datastore, this.options),
            POST: new PostHandler_1.PostHandler(this.datastore, this.options),
            DELETE: new DeleteHandler_1.DeleteHandler(this.datastore, this.options),
        };
        // Any handlers assigned to this object with the method as the key
        // will be used to repond to those requests. They get set/re-set
        // when a datastore is assigned to the server.
        // Remove any event listeners from each handler as they are removed
        // from the server. This must come before adding a 'newListener' listener,
        // to not add a 'removeListener' event listener to all request handlers.
        this.on('removeListener', (event, listener) => {
            this.datastore.removeListener(event, listener);
            for (const method of constants_1.REQUEST_METHODS) {
                this.handlers[method].removeListener(event, listener);
            }
        });
        // As event listeners are added to the server, make sure they are
        // bubbled up from request handlers to fire on the server level.
        this.on('newListener', (event, listener) => {
            this.datastore.on(event, listener);
            for (const method of constants_1.REQUEST_METHODS) {
                this.handlers[method].on(event, listener);
            }
        });
    }
    get(path, handler) {
        this.handlers.GET.registerPath(path, handler);
    }
    /**
     * Main server requestListener, invoked on every 'request' event.
     */
    async handle(req, res
    // TODO: this return type does not make sense
    ) {
        log(`[TusServer] handle: ${req.method} ${req.url}`);
        // Allow overriding the HTTP method. The reason for this is
        // that some libraries/environments to not support PATCH and
        // DELETE requests, e.g. Flash in a browser and parts of Java
        if (req.headers['x-http-method-override']) {
            req.method = req.headers['x-http-method-override'].toUpperCase();
        }
        if (req.method === 'GET') {
            const handler = this.handlers.GET;
            return handler.send(req, res).catch((error) => {
                log(`[${handler.constructor.name}]`, error);
                const status_code = error.status_code || constants_1.ERRORS.UNKNOWN_ERROR.status_code;
                const body = error.body || `${constants_1.ERRORS.UNKNOWN_ERROR.body}${error.message || ''}\n`;
                return handler.write(res, status_code, {}, body);
            });
        }
        // The Tus-Resumable header MUST be included in every request and
        // response except for OPTIONS requests. The value MUST be the version
        // of the protocol used by the Client or the Server.
        res.setHeader('Tus-Resumable', constants_1.TUS_RESUMABLE);
        if (req.method !== 'OPTIONS' && req.headers['tus-resumable'] === undefined) {
            res.writeHead(412, 'Precondition Failed');
            return res.end('Tus-Resumable Required\n');
        }
        // Validate all required headers to adhere to the tus protocol
        const invalid_headers = [];
        for (const header_name in req.headers) {
            if (req.method === 'OPTIONS') {
                continue;
            }
            // Content type is only checked for PATCH requests. For all other
            // request methods it will be ignored and treated as no content type
            // was set because some HTTP clients may enforce a default value for
            // this header.
            // See https://github.com/tus/tus-node-server/pull/116
            if (header_name.toLowerCase() === 'content-type' && req.method !== 'PATCH') {
                continue;
            }
            if (!(0, HeaderValidator_1.validateHeader)(header_name, req.headers[header_name])) {
                log(`Invalid ${header_name} header: ${req.headers[header_name]}`);
                invalid_headers.push(header_name);
            }
        }
        if (invalid_headers.length > 0) {
            // The request was not configured to the tus protocol
            res.writeHead(400, 'Bad Request');
            return res.end(`Invalid ${invalid_headers.join(' ')}\n`);
        }
        // Enable CORS
        res.setHeader('Access-Control-Expose-Headers', constants_1.EXPOSED_HEADERS);
        if (req.headers.origin) {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        }
        // Invoke the handler for the method requested
        const handler = this.handlers[req.method];
        if (handler) {
            return handler.send(req, res).catch((error) => {
                log(`[${handler.constructor.name}]`, error);
                const status_code = error.status_code || constants_1.ERRORS.UNKNOWN_ERROR.status_code;
                const body = error.body || `${constants_1.ERRORS.UNKNOWN_ERROR.body}${error.message || ''}\n`;
                return handler.write(res, status_code, {}, body);
            });
        }
        // 404 Anything else
        res.writeHead(404, {});
        res.write('Not found\n');
        return res.end();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listen(...args) {
        return node_http_1.default.createServer(this.handle.bind(this)).listen(...args);
    }
    cleanUpExpiredUploads() {
        if (!this.datastore.hasExtension('expiration')) {
            throw constants_1.ERRORS.UNSUPPORTED_EXPIRATION_EXTENSION;
        }
        return this.datastore.deleteExpired();
    }
}
exports.Server = Server;

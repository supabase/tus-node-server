"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHandler = void 0;
const node_stream_1 = __importDefault(require("node:stream"));
const BaseHandler_1 = require("./BaseHandler");
const constants_1 = require("../constants");
class GetHandler extends BaseHandler_1.BaseHandler {
    constructor() {
        super(...arguments);
        this.paths = new Map();
    }
    registerPath(path, handler) {
        this.paths.set(path, handler);
    }
    /**
     * Read data from the DataStore and send the stream.
     */
    async send(req, res
    // TODO: always return void or a stream?
    ) {
        if (this.paths.has(req.url)) {
            const handler = this.paths.get(req.url);
            return handler(req, res);
        }
        if (!('read' in this.store)) {
            throw constants_1.ERRORS.FILE_NOT_FOUND;
        }
        const id = this.getFileIdFromRequest(req);
        if (id === false) {
            throw constants_1.ERRORS.FILE_NOT_FOUND;
        }
        const stats = await this.store.getUpload(id);
        if (!stats || stats.offset !== stats.size) {
            throw constants_1.ERRORS.FILE_NOT_FOUND;
        }
        // @ts-expect-error exists if supported
        const file_stream = this.store.read(id);
        const headers = { 'Content-Length': stats.offset };
        res.writeHead(200, headers);
        return node_stream_1.default.pipeline(file_stream, res, () => {
            // We have no need to handle streaming errors
        });
    }
}
exports.GetHandler = GetHandler;

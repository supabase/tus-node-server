"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHandler = void 0;
const debug_1 = __importDefault(require("debug"));
const BaseHandler_1 = require("./BaseHandler");
const models_1 = require("../models");
const HeaderValidator_1 = require("../validators/HeaderValidator");
const constants_1 = require("../constants");
const log = (0, debug_1.default)('tus-node-server:handlers:post');
class PostHandler extends BaseHandler_1.BaseHandler {
    constructor(store, options) {
        if (options.namingFunction && typeof options.namingFunction !== 'function') {
            throw new Error("'namingFunction' must be a function");
        }
        if (!options.namingFunction) {
            options.namingFunction = models_1.Uid.rand;
        }
        super(store, options);
    }
    /**
     * Create a file in the DataStore.
     */
    async send(req, res) {
        if ('upload-concat' in req.headers && !this.store.hasExtension('concatentation')) {
            throw constants_1.ERRORS.UNSUPPORTED_CONCATENATION_EXTENSION;
        }
        const upload_length = req.headers['upload-length'];
        const upload_defer_length = req.headers['upload-defer-length'];
        const upload_metadata = req.headers['upload-metadata'];
        if (upload_defer_length !== undefined && // Throw error if extension is not supported
            !this.store.hasExtension('creation-defer-length')) {
            throw constants_1.ERRORS.UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION;
        }
        if ((upload_length === undefined) === (upload_defer_length === undefined)) {
            throw constants_1.ERRORS.INVALID_LENGTH;
        }
        let id;
        try {
            id = this.options.namingFunction(req);
        }
        catch (error) {
            log('create: check your `namingFunction`. Error', error);
            throw constants_1.ERRORS.FILE_WRITE_ERROR;
        }
        let metadata;
        if ('upload-metadata' in req.headers) {
            try {
                metadata = models_1.Metadata.parse(upload_metadata);
            }
            catch {
                throw constants_1.ERRORS.INVALID_METADATA;
            }
        }
        const upload = new models_1.Upload({
            id,
            size: upload_length ? Number.parseInt(upload_length, 10) : undefined,
            offset: 0,
            metadata,
        });
        if (this.options.onUploadCreate) {
            try {
                res = await this.options.onUploadCreate(req, res, upload);
            }
            catch (error) {
                log(`onUploadCreate error: ${error.body}`);
                throw error;
            }
        }
        await this.store.create(upload);
        const url = this.generateUrl(req, upload.id);
        this.emit(constants_1.EVENTS.POST_CREATE, req, res, upload, url);
        let newOffset;
        let isFinal = false;
        const headers = {};
        // The request MIGHT include a Content-Type header when using creation-with-upload extension
        if ((0, HeaderValidator_1.validateHeader)('content-type', req.headers['content-type'])) {
            newOffset = await this.store.write(req, upload.id, 0);
            headers['Upload-Offset'] = newOffset.toString();
            isFinal = newOffset === Number.parseInt(upload_length, 10);
            upload.offset = newOffset;
            if (isFinal && this.options.onUploadFinish) {
                try {
                    res = await this.options.onUploadFinish(req, res, upload);
                }
                catch (error) {
                    log(`onUploadFinish: ${error.body}`);
                    throw error;
                }
            }
        }
        // The Upload-Expires response header indicates the time after which the unfinished upload expires.
        // If expiration is known at creation time, Upload-Expires header MUST be included in the response
        if (this.store.hasExtension('expiration') &&
            this.store.getExpiration() > 0 &&
            upload.creation_date) {
            const created = await this.store.getUpload(upload.id);
            if (created.offset !== Number.parseInt(upload_length, 10)) {
                const creation = new Date(upload.creation_date);
                // Value MUST be in RFC 7231 datetime format
                headers['Upload-Expires'] = new Date(creation.getTime() + this.store.getExpiration()).toUTCString();
            }
        }
        const writtenRes = this.write(res, 201, { Location: url, ...headers });
        if (isFinal) {
            this.emit(constants_1.EVENTS.POST_FINISH, req, writtenRes, upload);
        }
        return writtenRes;
    }
}
exports.PostHandler = PostHandler;

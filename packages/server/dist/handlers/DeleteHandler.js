"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteHandler = void 0;
const BaseHandler_1 = require("./BaseHandler");
const constants_1 = require("../constants");
class DeleteHandler extends BaseHandler_1.BaseHandler {
    async send(req, res, context) {
        const id = this.getFileIdFromRequest(req);
        if (!id) {
            throw constants_1.ERRORS.FILE_NOT_FOUND;
        }
        if (this.options.onIncomingRequest) {
            await this.options.onIncomingRequest(req, res, id);
        }
        const unlock = await this.acquireLock(req, id, context);
        try {
            const upload = await this.store.getUpload(id);
            const isCompleted = upload.size === upload.offset;
            if (!isCompleted) {
                throw constants_1.ERRORS.TERMINATION_ERROR;
            }
            await this.store.remove(id);
        }
        finally {
            await unlock();
        }
        const writtenRes = this.write(res, 204, {});
        this.emit(constants_1.EVENTS.POST_TERMINATE, req, writtenRes, id);
        return writtenRes;
    }
}
exports.DeleteHandler = DeleteHandler;

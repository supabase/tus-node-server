"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteHandler = void 0;
const BaseHandler_1 = require("./BaseHandler");
const constants_1 = require("../constants");
class DeleteHandler extends BaseHandler_1.BaseHandler {
    async send(req, res) {
        const id = this.getFileIdFromRequest(req);
        if (id === false) {
            throw constants_1.ERRORS.FILE_NOT_FOUND;
        }
        await this.store.remove(id);
        const writtenRes = this.write(res, 204, {});
        this.emit(constants_1.EVENTS.POST_TERMINATE, req, writtenRes, id);
        return writtenRes;
    }
}
exports.DeleteHandler = DeleteHandler;

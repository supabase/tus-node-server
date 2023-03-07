"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsHandler = void 0;
const BaseHandler_1 = require("./BaseHandler");
const constants_1 = require("../constants");
// A successful response indicated by the 204 No Content status MUST contain
// the Tus-Version header. It MAY include the Tus-Extension and Tus-Max-Size headers.
class OptionsHandler extends BaseHandler_1.BaseHandler {
    async send(_, res) {
        res.setHeader('Access-Control-Allow-Methods', constants_1.ALLOWED_METHODS);
        res.setHeader('Access-Control-Allow-Headers', constants_1.ALLOWED_HEADERS);
        res.setHeader('Access-Control-Max-Age', constants_1.MAX_AGE);
        if (this.store.extensions.length > 0) {
            res.setHeader('Tus-Extension', this.store.extensions.join(','));
        }
        return this.write(res, 204);
    }
}
exports.OptionsHandler = OptionsHandler;

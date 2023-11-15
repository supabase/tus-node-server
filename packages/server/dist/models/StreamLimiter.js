"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamLimiter = void 0;
const stream_1 = require("stream");
const constants_1 = require("../constants");
class MaxFileExceededError extends Error {
    constructor(message) {
        super(message);
        this.status_code = constants_1.ERRORS.ERR_MAX_SIZE_EXCEEDED.status_code;
        this.body = message;
    }
}
class StreamLimiter extends stream_1.Transform {
    constructor(maxSize) {
        super();
        this.currentSize = 0;
        this.maxSize = maxSize;
    }
    _transform(chunk, encoding, callback) {
        this.currentSize += chunk.length;
        if (this.currentSize > this.maxSize) {
            callback(new MaxFileExceededError(constants_1.ERRORS.ERR_MAX_SIZE_EXCEEDED.body));
        }
        else {
            this.push(chunk);
            callback();
        }
    }
}
exports.StreamLimiter = StreamLimiter;

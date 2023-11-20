"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamLimiter = exports.MaxFileExceededError = void 0;
const stream_1 = require("stream");
const constants_1 = require("../constants");
class MaxFileExceededError extends Error {
    constructor() {
        super(constants_1.ERRORS.ERR_MAX_SIZE_EXCEEDED.body);
        this.status_code = constants_1.ERRORS.ERR_MAX_SIZE_EXCEEDED.status_code;
        this.body = constants_1.ERRORS.ERR_MAX_SIZE_EXCEEDED.body;
        Object.setPrototypeOf(this, MaxFileExceededError.prototype);
    }
}
exports.MaxFileExceededError = MaxFileExceededError;
class StreamLimiter extends stream_1.Transform {
    constructor(maxSize) {
        super();
        this.currentSize = 0;
        this.maxSize = maxSize;
    }
    _transform(chunk, encoding, callback) {
        this.currentSize += chunk.length;
        if (this.currentSize > this.maxSize) {
            callback(new MaxFileExceededError());
        }
        else {
            this.push(chunk);
            callback();
        }
    }
}
exports.StreamLimiter = StreamLimiter;

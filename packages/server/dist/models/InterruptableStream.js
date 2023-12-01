"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterruptableStream = void 0;
const stream_1 = require("stream");
class InterruptableStream extends stream_1.Transform {
    _transform(chunk, encoding, callback) {
        this.push(chunk, encoding);
        callback();
    }
}
exports.InterruptableStream = InterruptableStream;

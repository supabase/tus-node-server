/// <reference types="node" />
/// <reference types="node" />
import { Transform, TransformCallback } from 'stream';
export declare class InterruptableStream extends Transform {
    _transform(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback): void;
}

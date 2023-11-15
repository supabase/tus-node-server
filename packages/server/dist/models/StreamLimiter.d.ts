/// <reference types="node" />
/// <reference types="node" />
import { Transform, TransformCallback } from 'stream';
export declare class StreamLimiter extends Transform {
    private maxSize;
    private currentSize;
    constructor(maxSize: number);
    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void;
}

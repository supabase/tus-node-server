import {Transform, TransformCallback} from 'stream'
import {ERRORS} from '../constants'

class MaxFileExceededError extends Error {
  status_code: number
  body: string

  constructor(message: string) {
    super(message)
    this.status_code = ERRORS.ERR_MAX_SIZE_EXCEEDED.status_code
    this.body = message
  }
}

export class StreamLimiter extends Transform {
  private maxSize: number
  private currentSize = 0

  constructor(maxSize: number) {
    super()
    this.maxSize = maxSize
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    this.currentSize += chunk.length
    if (this.currentSize > this.maxSize) {
      callback(new MaxFileExceededError(ERRORS.ERR_MAX_SIZE_EXCEEDED.body))
    } else {
      this.push(chunk)
      callback()
    }
  }
}

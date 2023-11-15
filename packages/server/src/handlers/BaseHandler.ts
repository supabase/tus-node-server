import EventEmitter from 'node:events'

import type {ServerOptions} from '../types'
import type {DataStore, UploadIdGenerator} from '../models'
import type http from 'node:http'
import {Upload} from '../models'
import {ERRORS} from '../constants'

import {DefaultUploadIdGenerator} from '../models'

export class BaseHandler extends EventEmitter {
  options: ServerOptions
  store: DataStore
  uploadIdGenerator: UploadIdGenerator

  constructor(store: DataStore, options: ServerOptions) {
    super()
    if (!store) {
      throw new Error('Store must be defined')
    }

    this.store = store
    this.options = options
    this.uploadIdGenerator =
      options.uploadIdGenerator ??
      new DefaultUploadIdGenerator({
        path: options.path,
        relativeLocation: options.relativeLocation,
        respectForwardedHeaders: options.respectForwardedHeaders,
      })
  }

  write(res: http.ServerResponse, status: number, headers = {}, body = '') {
    if (status !== 204) {
      // @ts-expect-error not explicitly typed but possible
      headers['Content-Length'] = Buffer.byteLength(body, 'utf8')
    }
    res.writeHead(status, headers)
    res.write(body)
    return res.end()
  }

  generateUrl(req: http.IncomingMessage, id: string) {
    return this.uploadIdGenerator.generateUrl(req, id)
  }

  getFileIdFromRequest(req: http.IncomingMessage) {
    return this.uploadIdGenerator.getFileIdFromRequest(req)
  }

  getLocker(req: http.IncomingMessage) {
    if (typeof this.options.locker === 'function') {
      return this.options.locker(req)
    }
    return this.options.locker
  }

  async lock<T>(req: http.IncomingMessage, id: string, fn: () => Promise<T>) {
    const locker = this.getLocker(req)

    try {
      await locker?.lock(id)
      return await fn()
    } finally {
      await locker?.unlock(id)
    }
  }

  getConfiguredMaxSize(req: http.IncomingMessage, id: string) {
    if (typeof this.options.maxSize === 'function') {
      return this.options.maxSize(req, id)
    }
    return this.options.maxSize ?? 0
  }

  async getBodyMaxSize(
    req: http.IncomingMessage,
    info: Upload,
    configuredMaxSize?: number
  ) {
    configuredMaxSize =
      configuredMaxSize ?? (await this.getConfiguredMaxSize(req, info.id))

    const length = parseInt(req.headers['content-length'] || '0', 10)
    const offset = info.offset

    // Test if this upload fits into the file's size
    if (!info.sizeIsDeferred && offset + length > (info.size || 0)) {
      throw ERRORS.ERR_SIZE_EXCEEDED
    }

    let maxSize = (info.size || 0) - offset
    // If the upload's length is deferred and the PATCH request does not contain the Content-Length
    // header (which is allowed if 'Transfer-Encoding: chunked' is used), we still need to set limits for
    // the body size.
    if (info.sizeIsDeferred) {
      if (configuredMaxSize > 0) {
        // Ensure that the upload does not exceed the maximum upload size
        maxSize = configuredMaxSize - offset
      } else {
        // If no upload limit is given, we allow arbitrary sizes
        maxSize = Number.MAX_SAFE_INTEGER
      }
    }

    if (length > 0) {
      maxSize = length
    }

    // limit the request body to the maxSize if provided
    if (configuredMaxSize > 0 && maxSize > configuredMaxSize) {
      maxSize = configuredMaxSize
    }

    return maxSize
  }
}

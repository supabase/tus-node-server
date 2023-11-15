import {MemoryLocker} from '../src/models/Locker'
import * as assert from 'assert'

describe('MemoryLocker', () => {
  it('will hold the lock for subsequent calls until released', async () => {
    const locker = new MemoryLocker()
    const lockId = 'upload-id-1'

    const date = new Date()
    await locker.lock(lockId)
    setTimeout(() => {
      locker.unlock(lockId)
    }, 300)
    await locker.lock(lockId) // will wait until the other lock is released
    await locker.unlock(lockId)
    const endDate = new Date().valueOf() - date.valueOf()
    assert.equal(endDate >= 300, true)
  })

  it('locking a locked lock should not resolve', async () => {
    const locker = new MemoryLocker()
    const lockId = 'upload-id-1'

    await locker.lock(lockId)

    const p1 = locker.lock(lockId)
    const p2 = new Promise((resolve) => setTimeout(resolve, 500, 'timeout'))

    assert.strictEqual(await Promise.race([p1, p2]), 'timeout')
  })

  it('unlocking a lock should resolve only one pending lock', (done) => {
    const locker = new MemoryLocker()
    const lockId = 'upload-id-1'

    ;(async () => {
      await locker.lock(lockId)
      locker.lock(lockId).then(done)
      locker.lock(lockId).then(() => {
        done(new Error())
      })
      locker.lock(lockId).then(() => {
        done(new Error())
      })
      locker.lock(lockId).then(() => {
        done(new Error())
      })
      await locker.unlock(lockId)
    })()
  })

  it('unlocking a lock should first resolve unlock promise and then pending lock promise', async () => {
    const locker = new MemoryLocker()
    const lockId = 'upload-id-1'

    await locker.lock(lockId)

    const resolveOrder = new Array<number>()
    const p1 = locker.lock(lockId).then(() => {
      resolveOrder.push(2)
    })
    const p2 = locker.unlock(lockId).then(() => {
      resolveOrder.push(1)
    })

    await Promise.all([p1, p2])
    assert.deepStrictEqual(resolveOrder, [1, 2])
  })
})

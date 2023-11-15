export interface Locker {
  lock(id: string): Promise<void>
  unlock(id: string): Promise<void>
}

class Lock {
  public locked = false
  public pendingLocks = new Array<() => void>()
}

export class MemoryLocker implements Locker {
  private locks = new Map<string, Lock>()

  private getLock(id: string): Lock {
    let lock = this.locks.get(id)
    if (lock === undefined) {
      lock = new Lock()
      this.locks.set(id, lock)
    }
    return lock
  }

  async lock(id: string): Promise<void> {
    const lock = this.getLock(id)

    if (lock.locked) {
      await new Promise<void>((resolve) => {
        lock.pendingLocks.push(resolve)
      })
    }

    lock.locked = true
  }

  async unlock(id: string): Promise<void> {
    const lock = this.getLock(id)
    if (!lock.locked) {
      throw new Error('Releasing an unlocked lock!')
    }

    lock.locked = false

    // notify next pending lock
    const callback = lock.pendingLocks.shift()
    if (callback === undefined) {
      this.locks.delete(id)
    } else {
      callback()
    }
  }
}

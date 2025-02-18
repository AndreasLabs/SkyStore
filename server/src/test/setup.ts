import { beforeEach, afterEach } from 'bun:test'
import IoRedis from 'ioredis-mock'

declare module 'elysia' {
  interface ElysiaState {
    store: {
      redis: typeof IoRedis
    }
  }
}

export const setupTestEnv = () => {
  let redisMock: typeof IoRedis

  beforeEach(() => {
    redisMock = new IoRedis()
    return { redisMock }
  })

  afterEach(async () => {
    await redisMock.flushall()
  })
} 
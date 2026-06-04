import { vi } from 'vitest'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault('Asia/Shanghai')

// 全局 mock：避免 Node 环境加载 Cloudflare Workers 专用模块
vi.mock('@/common/redis', () => ({
  RedisInstance: {
    getInstance: vi.fn(() => ({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      disconnect: vi.fn(),
    })),
    destroyed: vi.fn(),
  },
  RequestCashedStatus: { NOT_CASHED: 0, CASHED: 1 },
  getRedis: vi.fn(),
}))

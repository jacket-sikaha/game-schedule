import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getWutheringWavesEvent, getPunishingEvent } from '../kuro-game/util'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// 构造 minimal Env
function mockEnv(): Env {
  return {
    VITE_KURO_WIKI_GAME_API: 'https://api.kurobbs.com/wiki/core/homepage/getPage',
    VITE_KURO_WIKI_CATALOGUE_API: 'https://api.kurobbs.com/wiki/core/catalogue/item/getPage',
  } as any
}

// 构造活动数据
function makeActivity(overrides: Record<string, any> = {}) {
  return {
    linkConfig: { linkUrl: 'https://example.com', linkType: 1, entryId: '100' },
    contentUrl: 'https://cdn.example.com/banner.png',
    contentUrlRealName: 'banner.png',
    active: true,
    countDown: {
      dateRange: ['2025-06-01 10:00:00', '2025-06-15 10:00:00'],
      repeat: { endDate: '', isNeverEnd: false, repeatInterval: 0, dataRanges: [] },
      precision: 'minute' as const,
      type: 'no-repeat' as const,
    },
    title: '测试活动',
    ...overrides,
  }
}

describe('kuro-game/util', () => {
  afterEach(() => mockFetch.mockReset())

  // ═══════════════ getWutheringWavesEvent ═══════════════
  describe('getWutheringWavesEvent', () => {
    it('正常解析鸣潮版本活动', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200,
          msg: 'success',
          data: {
            id: 1,
            contentJson: {
              feedback: [], background: null, mainModules: [], shortcuts: null,
              banner: [], announcement: [],
              sideModules: [{
                id: 'activity',
                title: '版本活动',
                content: [
                  makeActivity({ title: '鸣潮1.1版本活动', linkConfig: { linkUrl: 'https://example.com', linkType: 1, entryId: '1' } }),
                  makeActivity({ title: '鸣潮签到活动', linkConfig: { linkUrl: 'https://example.com/2', linkType: 1, entryId: '2', catalogueId: 123 } }),
                ],
                more: { linkConfig: { linkUrl: '', linkType: 0 } },
              }],
            },
          },
        }),
      })

      const result = await getWutheringWavesEvent(mockEnv() as any)

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('鸣潮1.1版本活动')
      expect(result[0].start_time).toBe('2025-06-01 10:00:00')
      expect(result[0].end_time).toBe('2025-06-15 10:00:00')
      expect(result[0].banner).toBe('https://cdn.example.com/banner.png')
      expect(result[1].title).toBe('鸣潮签到活动')
    })

    it('没有版本活动模块时返回空数组', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200, msg: 'success',
          data: {
            id: 1,
            contentJson: {
              feedback: [], background: null, mainModules: [], shortcuts: null,
              banner: [], announcement: [],
              sideModules: [{ id: 'other', title: '其他', content: [], more: { linkConfig: { linkUrl: '', linkType: 0 } } }],
            },
          },
        }),
      })

      const result = await getWutheringWavesEvent(mockEnv() as any)
      expect(result).toEqual([])
    })

    it('过滤掉没有 countDown 的活动', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200, msg: 'success',
          data: {
            id: 1,
            contentJson: {
              feedback: [], background: null, mainModules: [], shortcuts: null,
              banner: [], announcement: [],
              sideModules: [{
                id: 'activity', title: '版本活动',
                content: [
                  makeActivity({ title: '限时活动', countDown: { ...makeActivity().countDown } }),
                  { ...makeActivity({ title: '常驻活动', linkConfig: { linkUrl: '', linkType: 0, entryId: '2' } }), countDown: undefined },
                ],
                more: { linkConfig: { linkUrl: '', linkType: 0 } },
              }],
            },
          },
        }),
      })

      const result = await getWutheringWavesEvent(mockEnv() as any)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('限时活动')
    })
  })

  // ═══════════════ getPunishingEvent ═══════════════
  describe('getPunishingEvent', () => {
    it('正常解析战双活动', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200, msg: 'success',
          data: {
            id: 1,
            contentJson: {
              feedback: [], background: null, mainModules: [], shortcuts: null,
              banner: [], announcement: [],
              sideModules: [{
                id: 'hot', title: '热门活动',
                content: [
                  makeActivity({ title: '战双夏日活动' }),
                  makeActivity({ title: '战双签到' }),
                ],
                more: { linkConfig: { linkUrl: '', linkType: 0 } },
              }],
            },
          },
        }),
      })

      const result = await getPunishingEvent('https://api.kurobbs.com/test')

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('战双夏日活动')
      expect(result[0].start_time).toBe('2025-06-01 10:00:00')
      expect(result[0].end_time).toBe('2025-06-15 10:00:00')
      expect(result[0].banner).toBe('https://cdn.example.com/banner.png')
      expect(result[1].title).toBe('战双签到')
    })

    it('没有热门活动模块时返回空数组', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200, msg: 'success',
          data: {
            id: 1,
            contentJson: {
              feedback: [], background: null, mainModules: [], shortcuts: null,
              banner: [], announcement: [],
              sideModules: [{ id: 'other', title: '其他', content: [], more: { linkConfig: { linkUrl: '', linkType: 0 } } }],
            },
          },
        }),
      })

      const result = await getPunishingEvent('https://api.kurobbs.com/test')
      expect(result).toEqual([])
    })
  })
})
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPunishingEvent, getWutheringWavesEvent } from '../kuro-game/util'
import { stableId } from '../common'

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

    it('id 为确定性 hash：与 stableId(gameKey, entryId, title) 一致', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200,
          msg: 'success',
          data: {
            id: 1,
            contentJson: {
              sideModules: [{
                id: 'activity',
                title: '版本活动',
                content: [
                  makeActivity({ title: '鸣潮1.1版本活动', linkConfig: { linkUrl: 'https://example.com', linkType: 1, entryId: '1554468927538642944' } }),
                ],
                more: { linkConfig: { linkUrl: '', linkType: 0 } },
              }],
            },
          },
        }),
      })

      const result = await getWutheringWavesEvent(mockEnv() as any)

      expect(result[0].id).toBe(stableId('mc', '1554468927538642944', '鸣潮1.1版本活动'))
    })

    it('entryId 缺失时 id 稳定，不依赖当前时间戳', async () => {
      const payload = {
        code: 200,
        msg: 'success',
        data: {
          id: 1,
          contentJson: {
            sideModules: [{
              id: 'activity',
              title: '版本活动',
              content: [
                makeActivity({ title: '无入口活动', linkConfig: { linkUrl: 'https://example.com', linkType: 1, entryId: undefined } }),
              ],
              more: { linkConfig: { linkUrl: '', linkType: 0 } },
            }],
          },
        },
      }
      mockFetch.mockResolvedValue({ json: () => Promise.resolve(payload) })

      const [r1, r2] = await Promise.all([
        getWutheringWavesEvent(mockEnv() as any),
        getWutheringWavesEvent(mockEnv() as any),
      ])

      expect(r1[0].id).toBe(r2[0].id)
      expect(r1[0].id).toMatch(/^mc_[0-9a-f]{8}$/)
    })

    it('同 entryId 不同标题的活动 id 不同（打散上游重复 id）', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 200,
          msg: 'success',
          data: {
            id: 1,
            contentJson: {
              sideModules: [{
                id: 'activity',
                title: '版本活动',
                content: [
                  // 实测样例：上游两条活动共用 entryId 1554479052247040000
                  makeActivity({ title: '回音盈域', linkConfig: { linkUrl: 'https://example.com', linkType: 1, entryId: '1554479052247040000' } }),
                  makeActivity({ title: '声弦涤荡', linkConfig: { linkUrl: 'https://example.com/2', linkType: 1, entryId: '1554479052247040000' } }),
                ],
                more: { linkConfig: { linkUrl: '', linkType: 0 } },
              }],
            },
          },
        }),
      })

      const result = await getWutheringWavesEvent(mockEnv() as any)

      expect(result).toHaveLength(2)
      expect(result[0].id).not.toBe(result[1].id)
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

    it('entryId 缺失时 id 稳定且互不相同，不依赖数组下标', async () => {
      const payload = {
        code: 200,
        msg: 'success',
        data: {
          id: 1,
          contentJson: {
            sideModules: [{
              id: 'hot',
              title: '热门活动',
              content: [
                makeActivity({ title: '【远信回响】主线版本', linkConfig: { linkUrl: '', linkType: 0, entryId: undefined } }),
                makeActivity({ title: '【远信回响】空滞轮旋之梦', linkConfig: { linkUrl: '', linkType: 0, entryId: undefined } }),
              ],
              more: { linkConfig: { linkUrl: '', linkType: 0 } },
            }],
          },
        },
      }
      mockFetch.mockResolvedValue({ json: () => Promise.resolve(payload) })

      const [r1, r2] = await Promise.all([
        getPunishingEvent('https://api.kurobbs.com/test'),
        getPunishingEvent('https://api.kurobbs.com/test'),
      ])

      // 两次抓取 id 完全一致（不随下标/时间变化）
      expect(r1.map((a: any) => a.id)).toEqual(r2.map((a) => a.id))
      // 两条缺失 entryId 的活动 id 互不相同
      expect(r1[0].id).not.toBe(r1[1].id)
      expect(r1[0].id).toMatch(/^pns_[0-9a-f]{8}$/)
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
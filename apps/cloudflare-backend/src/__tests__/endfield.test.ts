import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import { getActivities, parseActivities } from '../endfield'

describe('endfield', () => {
  describe('parseActivities', () => {
    it('解析单个活动卡片', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000" data-type="event" href="/zh-Hans/activities/event-1">
          <img src="https://end.wiki/images/banner.png" alt="活动标题" />
          <span class="activity-card-name">限时活动</span>
        </a>
      `
      const result = parseActivities(html)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('限时活动')
      expect(result[0].banner).toBe('https://end.wiki/images/banner.png')
      expect(result[0].linkUrl).toContain('/zh-Hans/activities/event-1')
      expect(result[0].type).toBe('event')
    })

    it('data-open 为空的卡片被跳过', () => {
      const html = `
        <a class="activity-card" data-open="" data-close="" href="/zh-Hans/activities/empty">
          <span class="activity-card-name">无时间活动</span>
        </a>
      `
      expect(parseActivities(html)).toHaveLength(0)
    })

    it('data-close 为空时自动设为5年后', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="">
          <span class="activity-card-name">常驻活动</span>
        </a>
      `
      const result = parseActivities(html)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('常驻活动')
      // end_time 应该是5年后
      expect(result[0].end_time).toBeDefined()
    })

    it('无 activity-card-name 时回退到 img alt', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000">
          <img src="banner.png" alt="alt标题" />
        </a>
      `
      const result = parseActivities(html)
      expect(result[0].title).toBe('alt标题')
    })

    it('多个活动卡片', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000">
          <span class="activity-card-name">活动A</span>
        </a>
        <a class="activity-card" data-open="1717800000000" data-close="1718400000000">
          <span class="activity-card-name">活动B</span>
        </a>
      `
      expect(parseActivities(html)).toHaveLength(2)
    })

    it('同一 HTML 两次解析得到相同 id（确定性，不使用随机数）', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000" href="/zh-Hans/activities/event-1">
          <span class="activity-card-name">限时活动</span>
        </a>
      `
      const r1 = parseActivities(html)
      const r2 = parseActivities(html)

      expect(r1[0].id).toBe(r2[0].id)
      expect(r1[0].id).toMatch(/^endfield_[0-9a-f]{8}$/)
    })

    it('href 为空时 linkUrl 也为空', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000" href="">
          <span class="activity-card-name">活动C</span>
        </a>
      `
      expect(parseActivities(html)[0].linkUrl).toBe('')
    })

    it('相对路径 href 自动补全为完整 URL', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000" href="/zh-Hans/activities/test">
          <span class="activity-card-name">活动D</span>
        </a>
      `
      expect(parseActivities(html)[0].linkUrl).toBe('https://end.wiki/zh-Hans/activities/test')
    })
  })

  // ═══════════════ getActivities（异步，mock fetch）═══════════════
  //
  // fz.wiki 上游在两次改版中变更过子节点结构，这里把两种结构都固化成回归测试：
  //   旧格式: { type: 'endfieldCardActivityIndex__activities', attrs: { name, timeRanges, ... } }
  //   新格式: { type: 'wikiCardItem', attrs: { itemType: 'endfieldCardActivityIndex__activities',
  //                                            data: { name, timeRanges, calendarRange, ... } } }
  // 上游 schema 再次漂移时会直接失败，而不是线上静默返回空数组。
  describe('getActivities', () => {
    const ACTIVITY_ITEM_TYPE = 'endfieldCardActivityIndex__activities'

    // 冻结系统时间：过滤逻辑依赖「当前时间」，固定后才能稳定断言。
    // 选定的日期都远离边界，即使存在 ±14 小时时区偏移也不影响结论。
    const FIXED_NOW = new Date('2026-09-24T00:00:00Z')

    beforeEach(() => {
      // 只虚拟化 Date，不动任何 timer/microtask，避免影响 Promise 异步链路
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(FIXED_NOW)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    })

    /** 活动数据默认值（对应新格式 attrs.data 的形态） */
    const makeActivity = (over: Record<string, any> = {}) => ({
      name: '挽弓试炼',
      tags: ['挑战活动'],
      sortId: 6101,
      children: [],
      linkTitle: '活动/挽弓试炼·10月15日',
      tabImgUrl: 'https://assets.fz.wiki/example/banner.png',
      activityId: 'activity_timeunlimited_typhoea_archery',
      timeRanges: [{ open: '2026/10/15 6:00:00', close: '' }],
      tabImgColor: '#fff600',
      calendarTag: '挑战活动',
      calendarRange: { open: '2026/10/15 6:00:00', close: '' },
      calendarTitle: '挽弓试炼',
      calendarCategory: '活动',
      ...over,
    })

    /** 新格式子节点：type=wikiCardItem，类型标识在 attrs.itemType，数据在 attrs.data */
    const newStyleNode = (data: Record<string, any>) => ({
      type: 'wikiCardItem',
      attrs: {
        id: data.activityId ?? 'node',
        itemType: ACTIVITY_ITEM_TYPE,
        generatedBy: 'endfield-workflow',
        data,
      },
    })

    /** 旧格式子节点：type 即活动类型，数据平铺在 attrs */
    const legacyStyleNode = (data: Record<string, any>) => ({
      type: ACTIVITY_ITEM_TYPE,
      attrs: { generatedBy: 'endfield-workflow', ...data },
    })

    /** 构造完整的 by-title 接口返回体 */
    const buildPayload = (children: any[]) => ({
      article: { id: '3004f17f', title: '活动' },
      revision: {
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'endfieldCardActivityIndex',
              attrs: { id: 'section/endfieldCardActivityIndex#0', note: '', generatedBy: 'endfield-workflow' },
              content: children,
            },
            { type: 'paragraph', attrs: { id: 'category' }, content: [] },
          ],
        },
        contentText: 'Category:活动',
      },
    })

    /** 把 payload 挂到全局 fetch 上 */
    const stubFetchJson = (payload: unknown) => {
      const fn = vi.fn(async () => ({ ok: true, status: 200, json: async () => payload }) as unknown as Response)
      vi.stubGlobal('fetch', fn)
      return fn
    }

    // ── 结构解析：新格式（当前线上格式）──
    it('解析新格式（wikiCardItem + attrs.data）', async () => {
      stubFetchJson(buildPayload([newStyleNode(makeActivity())]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('activity_timeunlimited_typhoea_archery')
      expect(result[0].title).toBe('挽弓试炼')
      expect(result[0].start_time).toBe('2026-10-15 06:00')
      expect(result[0].banner).toBe('https://assets.fz.wiki/example/banner.png')
      expect(result[0].type).toBe('挑战活动')
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    // ── 结构解析：旧格式（向后兼容，回归保护）──
    it('解析旧格式（type 即活动类型 + 平铺 attrs）', async () => {
      const legacy = makeActivity({
        name: '理智补给',
        tags: ['限时活动'],
        activityId: 'activity_stamina_refund_1d5d2',
        linkTitle: '活动/理智补给·10月8日',
        timeRanges: [{ open: '2026/10/8 4:00:00', close: '2026/10/15 4:00:00' }],
      })
      // 旧格式没有 calendarRange / calendarTitle，验证回退到 timeRanges[0] 与 name
      delete (legacy as any).calendarRange
      delete (legacy as any).calendarTitle
      stubFetchJson(buildPayload([legacyStyleNode(legacy)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('activity_stamina_refund_1d5d2')
      expect(result[0].title).toBe('理智补给')
      expect(result[0].start_time).toBe('2026-10-08 04:00')
      expect(result[0].end_time).toBe('2026-10-15 04:00')
    })

    it('新旧格式混排时两类节点都能解析', async () => {
      const legacy = makeActivity({ activityId: 'legacy_one', name: '旧活动' })
      delete (legacy as any).calendarRange
      const fresh = makeActivity({ activityId: 'fresh_one', name: '新活动' })
      stubFetchJson(buildPayload([legacyStyleNode(legacy), newStyleNode(fresh)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result.map((a) => a.id)).toEqual(['legacy_one', 'fresh_one'])
    })

    // ── 字段优先级 ──
    it('calendarRange 优先于 timeRanges', async () => {
      // timeRanges 已结束（会被过滤），calendarRange 仍在进行中
      // → 结果保留即证明使用的是 calendarRange
      const activity = makeActivity({
        timeRanges: [{ open: '2026/1/1 4:00:00', close: '2026/1/10 4:00:00' }],
        calendarRange: { open: '2026/9/20 4:00:00', close: '2026/12/31 4:00:00' },
      })
      stubFetchJson(buildPayload([newStyleNode(activity)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result).toHaveLength(1)
      expect(result[0].start_time).toBe('2026-09-20 04:00')
      expect(result[0].end_time).toBe('2026-12-31 04:00')
    })

    it('calendarTitle 优先于 name，缺失时回退到 name', async () => {
      const withCalendarTitle = makeActivity({ name: '陵水渡秋签到', calendarTitle: '陵水渡秋' })
      const withoutCalendarTitle = makeActivity({ name: '跑者运动会', activityId: 'a2' })
      delete (withoutCalendarTitle as any).calendarTitle
      stubFetchJson(buildPayload([newStyleNode(withCalendarTitle), newStyleNode(withoutCalendarTitle)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result[0].title).toBe('陵水渡秋')
      expect(result[1].title).toBe('跑者运动会')
    })

    // ── linkUrl 编码 ──
    it('linkUrl 按路径分段编码，不把分隔符编成 %2F', async () => {
      stubFetchJson(buildPayload([newStyleNode(makeActivity())]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result[0].linkUrl).toBe(
        `https://fz.wiki/wiki/${encodeURIComponent('活动')}/${encodeURIComponent('挽弓试炼·10月15日')}`
      )
      expect(result[0].linkUrl).not.toContain('%2F')
      expect(result[0].linkUrl).toContain('/wiki/')
    })

    it('linkTitle 缺失时 linkUrl 退化为站点根路径', async () => {
      const activity = makeActivity()
      delete (activity as any).linkTitle
      stubFetchJson(buildPayload([newStyleNode(activity)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result[0].linkUrl).toBe('https://fz.wiki/wiki/')
    })

    // ── type 字段回退链 ──
    it('tags 为空时 type 回退到 calendarTag', async () => {
      const activity = makeActivity({ tags: [], calendarTag: '玩法' })
      stubFetchJson(buildPayload([newStyleNode(activity)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result[0].type).toBe('玩法')
    })

    it('tags 与 calendarTag 都为空时 type 为空字符串', async () => {
      const activity = makeActivity({ tags: [], calendarTag: '' })
      stubFetchJson(buildPayload([newStyleNode(activity)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result[0].type).toBe('')
    })

    // ── 时间过滤 ──
    it('过滤已结束的活动', async () => {
      const ended = makeActivity({
        name: '已结束活动',
        activityId: 'ended',
        timeRanges: [{ open: '2026/1/1 4:00:00', close: '2026/1/10 4:00:00' }],
        calendarRange: { open: '2026/1/1 4:00:00', close: '2026/1/10 4:00:00' },
      })
      const upcoming = makeActivity({ name: '未来活动', activityId: 'upcoming' })
      stubFetchJson(buildPayload([newStyleNode(ended), newStyleNode(upcoming)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result.map((a) => a.id)).toEqual(['upcoming'])
    })

    it('无关闭时间的常驻活动把 end_time 设为 5 年后', async () => {
      const activity = makeActivity({
        timeRanges: [{ open: '2026/1/19 4:00:00', close: '' }],
        calendarRange: { open: '2026/1/19 4:00:00', close: '' },
      })
      stubFetchJson(buildPayload([newStyleNode(activity)]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result).toHaveLength(1)
      expect(result[0].start_time).toBe('2026-01-19 04:00')
      // 冻结时间为 2026-09-24，+5 年；只断言年份，避免受时区偏移影响
      expect(dayjs(result[0].end_time).year()).toBe(2031)
      expect(dayjs(result[0].end_time).isAfter(dayjs('2026-09-24'))).toBe(true)
    })

    it('既无 calendarRange 也无 timeRanges 的活动被过滤', async () => {
      const noRange = makeActivity({ activityId: 'no_range', timeRanges: [] })
      delete (noRange as any).calendarRange
      stubFetchJson(buildPayload([newStyleNode(noRange)]))

      expect(await getActivities('https://api.fz.wiki/example')).toEqual([])
    })

    it('open 为空字符串的活动被过滤', async () => {
      const emptyOpen = makeActivity({
        activityId: 'empty_open',
        timeRanges: [{ open: '', close: '' }],
        calendarRange: { open: '', close: '' },
      })
      stubFetchJson(buildPayload([newStyleNode(emptyOpen)]))

      expect(await getActivities('https://api.fz.wiki/example')).toEqual([])
    })

    it('时间格式无法解析的活动被过滤', async () => {
      const badFormat = makeActivity({
        activityId: 'bad_format',
        timeRanges: [{ open: '2026-10-15 06:00', close: '' }],
        calendarRange: { open: '2026-10-15 06:00', close: '' },
      })
      stubFetchJson(buildPayload([newStyleNode(badFormat)]))

      expect(await getActivities('https://api.fz.wiki/example')).toEqual([])
    })

    // ── 结构漂移 / 边界 ──
    it('缺少 name 的节点被忽略', async () => {
      const nameless = newStyleNode({ activityId: 'nameless', timeRanges: [] })
      const valid = newStyleNode(makeActivity({ activityId: 'valid' }))
      stubFetchJson(buildPayload([nameless, valid]))

      const result = await getActivities('https://api.fz.wiki/example')

      expect(result.map((a) => a.id)).toEqual(['valid'])
    })

    it('没有 endfieldCardActivityIndex 节点时返回空数组', async () => {
      stubFetchJson({ revision: { contentJson: { content: [{ type: 'paragraph' }] } } })

      expect(await getActivities('https://api.fz.wiki/example')).toEqual([])
    })

    it('节点存在但子节点类型不匹配时返回空数组（schema 漂移）', async () => {
      // 模拟上游把 itemType 改名，导致所有子节点都匹配不上
      const drifted = {
        type: 'wikiCardItem',
        attrs: { itemType: 'someOtherItemType', data: makeActivity() },
      }
      stubFetchJson(buildPayload([drifted]))

      expect(await getActivities('https://api.fz.wiki/example')).toEqual([])
    })

    it('content 为空数组时返回空数组', async () => {
      stubFetchJson(buildPayload([]))

      expect(await getActivities('https://api.fz.wiki/example')).toEqual([])
    })

    it('revision 字段缺失时返回空数组', async () => {
      stubFetchJson({ article: { id: 'x' } })

      expect(await getActivities('https://api.fz.wiki/example')).toEqual([])
    })

    // ── 网络异常 ──
    it('HTTP 非 2xx 时返回空数组且不抛异常', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response))

      await expect(getActivities('https://api.fz.wiki/example')).resolves.toEqual([])
    })

    it('fetch 抛异常时返回空数组且不抛异常', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => {
        throw new Error('network down')
      }))

      await expect(getActivities('https://api.fz.wiki/example')).resolves.toEqual([])
    })

    it('json 解析失败时返回空数组且不抛异常', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('invalid json')
        },
      }) as unknown as Response))

      await expect(getActivities('https://api.fz.wiki/example')).resolves.toEqual([])
    })
  })
})

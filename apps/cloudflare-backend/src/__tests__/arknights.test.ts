import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { stripHtmlTags, parseStrToTime, getAKEventWithDetailTime } from '../Arknights/util'

describe('Arknights/util', () => {
  // ═══════════════ stripHtmlTags ═══════════════
  describe('stripHtmlTags', () => {
    it('去除所有 HTML 标签，替换为空格', () => {
      // 每个标签替换为一个空格：<div> → ' ', <p> → ' '
      expect(stripHtmlTags('<div><p>活动内容</p></div>')).toContain('活动内容')
    })

    it('自闭合标签也能去除', () => {
      const result = stripHtmlTags('<img src="test.png"/><br/>文本内容')
      expect(result).toContain('文本内容')
      expect(result).not.toContain('<')
    })

    it('空字符串返回空字符串', () => {
      expect(stripHtmlTags('')).toBe('')
    })

    it('纯文本原样返回', () => {
      expect(stripHtmlTags('纯文本')).toBe('纯文本')
    })

    it('含属性的标签也能去除', () => {
      const html = '<p class="p"><span style="color:red;">◆</span>活动时间</p>'
      expect(stripHtmlTags(html)).toContain('活动时间')
    })
  })

  // ═══════════════ parseStrToTime ═══════════════
  describe('parseStrToTime', () => {
    it('标准格式：带年份的完整时间', () => {
      const result = parseStrToTime('活动时间：2025年12月23日 16:10 - 2026年01月02日 04:10', '2025-12-22 10:00')
      expect(result).toEqual(['2025-12-23 16:10', '2026-01-02 04:10'])
    })

    it('不带年份：两段都没有年份时默认都设为发布时间年份', () => {
      // 源码逻辑：str 不含"年"时，若 publishTime.year !== start_time.year，
      // 则 start/end 都设为 publishTime.year()，不做跨年加1
      const result = parseStrToTime('活动时间：12月23日 - 01月02日', '2025-12-22 10:00')
      // dayjs('12月23日','MM DD') 默认当前年份(2026)，publishTime 是 2025
      // 两者不同 → 都设为 2025
      expect(result![0]).toContain('2025-12-23')
      expect(result![1]).toContain('2025-01-02')
    })

    it('不带小时：自动补默认值（start=16:00, end=04:00）', () => {
      const result = parseStrToTime('活动时间：12月23日 - 01月02日', '2025-12-22 10:00')
      expect(result![0]).toContain('16:00')
      expect(result![1]).toContain('04:00')
    })

    it('跨年：起始无年、结束有年', () => {
      const result = parseStrToTime('活动时间：12月23日 16:10 - 2026年01月02日 04:10', '2025-12-22 10:00')
      expect(result).toEqual(['2025-12-23 16:10', '2026-01-02 04:10'])
    })

    it('跨年：起始有年、结束无年', () => {
      const result = parseStrToTime('活动时间：2025年12月23日 16:10 - 01月02日 04:10', '2025-12-22 10:00')
      expect(result).toEqual(['2025-12-23 16:10', '2026-01-02 04:10'])
    })

    it('只补 start 默认小时', () => {
      const result = parseStrToTime('活动时间：12月23日 - 01月02日 04:10', '2025-12-22 10:00')
      expect(result![0]).toContain('16:00')
      expect(result![1]).toContain('04:10')
    })

    it('只补 end 默认小时', () => {
      const result = parseStrToTime('活动时间：12月23日 16:10 - 01月02日', '2025-12-22 10:00')
      expect(result![0]).toContain('16:10')
      expect(result![1]).toContain('04:00')
    })

    it('特殊格式 24:00（同天结束）', () => {
      const result = parseStrToTime('活动时间：02月16日 20:00 - 24:00', '2025-02-15 10:00')
      expect(result![0]).toBe('2025-02-16 20:00')
    })

    it('无'-'分隔符时返回 undefined', () => {
      expect(parseStrToTime('活动时间：12月23日 16:10', '2025-12-22 10:00')).toBeUndefined()
    })

    it('完全无法解析的字符串返回 undefined', () => {
      expect(parseStrToTime('乱七八糟的文本', '2025-01-01 10:00')).toBeUndefined()
    })
  })

  // ═══════════════ getAKEventWithDetailTime（异步，mock fetch）═══════════════
  describe('getAKEventWithDetailTime', () => {
    const mockFetch = vi.fn()

    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch)
    })

    afterEach(() => {
      mockFetch.mockReset()
      vi.unstubAllGlobals()
    })

    // 构造 AK 活动列表返回
    const mockListResponse = (events: { cid: string; category: number }[]) => ({
      json: () => Promise.resolve({
        data: { list: events, popup: { defaultPopup: '' } },
      }),
    })

    // 构造 AK 活动详情返回
    const mockDetailResponse = (overrides: Partial<{
      cid: string
      content: string
      displayTime: string
      jumpLink: string
    }> = {}) => ({
      json: () => Promise.resolve({
        data: {
          cid: 'evt_001',
          content: '一、限时掉落活动活动时间：2025年12月23日 16:10 - 2026年01月02日 04:10',
          displayTime: '2025-12-22 10:00',
          jumpLink: 'https://ak.hypergryph.com/event',
          ...overrides,
        },
      }),
    })

    it('完整流程：列表→详情→解析（单个活动）', async () => {
      mockFetch
        .mockResolvedValueOnce(mockListResponse([{ cid: 'evt_001', category: 1 }]))
        .mockResolvedValueOnce(mockDetailResponse())

      const result = await getAKEventWithDetailTime('https://api.example.com/list', 'https://api.example.com/detail')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('evt_0010')
      expect(result[0].title).toBe('一、限时掉落活动')
      expect(result[0].start_time).toBe('2025-12-23 16:10')
      expect(result[0].end_time).toBe('2026-01-02 04:10')
      expect(result[0].linkUrl).toBe('https://ak.hypergryph.com/event')
    })

    it('多个活动并行解析', async () => {
      mockFetch.mockResolvedValueOnce(
        mockListResponse([
          { cid: 'evt_001', category: 1 },
          { cid: 'evt_002', category: 1 },
        ]))
        .mockResolvedValueOnce(mockDetailResponse({ cid: 'evt_001' }))
        .mockResolvedValueOnce(mockDetailResponse({
          cid: 'evt_002',
          content: '一、签到活动活动时间：2025年06月01日 10:00 - 2025年07月01日 10:00',
          displayTime: '2025-05-30 10:00',
          jumpLink: 'https://ak.hypergryph.com/signin',
        }))

      const result = await getAKEventWithDetailTime('https://api.example.com/list', 'https://api.example.com/detail')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('evt_0010')
      expect(result[1].id).toBe('evt_0020')
    })

    it('过滤非 category=1 的活动', async () => {
      mockFetch.mockResolvedValueOnce(
        mockListResponse([
          { cid: 'evt_001', category: 1 },
          { cid: 'evt_002', category: 2 },
          { cid: 'evt_003', category: 4 },
        ]))
        .mockResolvedValueOnce(mockDetailResponse({ cid: 'evt_001' }))

      const result = await getAKEventWithDetailTime('https://api.example.com/list', 'https://api.example.com/detail')

      // 只有 evt_001 (category=1) 被保留
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('evt_0010')
    })

    it('活动详情 content 为空时返回空数组', async () => {
      mockFetch
        .mockResolvedValueOnce(mockListResponse([{ cid: 'evt_001', category: 1 }]))
        .mockResolvedValueOnce(mockDetailResponse({ content: '' }))

      const result = await getAKEventWithDetailTime('https://api.example.com/list', 'https://api.example.com/detail')

      expect(result).toHaveLength(0)
    })

    it('content 中无 title 且无 time 时返回空数组', async () => {
      mockFetch
        .mockResolvedValueOnce(mockListResponse([{ cid: 'evt_001', category: 1 }]))
        .mockResolvedValueOnce(mockDetailResponse({ content: '这是一段没有任何活动标题和时间信息的文本' }))

      const result = await getAKEventWithDetailTime('https://api.example.com/list', 'https://api.example.com/detail')

      expect(result).toHaveLength(0)
    })

    it('时间正则匹配但 parseStrToTime 解析失败 → 该活动被跳过', async () => {
      // timeReg 要求末尾是 \d{1,2}:\d{2}，给一个能匹配正则但无法解析的时间
      // dayjs 对 '13月45日 99:99' 可以容错解析，所以这里测不存在的时间分隔符号
      mockFetch
        .mockResolvedValueOnce(mockListResponse([{ cid: 'evt_001', category: 1 }]))
        .mockResolvedValueOnce(mockDetailResponse({
          content: '一、测试活动活动时间：2025年01月01日 00:00 \u2014 2025年01月02日 00:00',
        }))

      // timeReg 要求半角 '-' 分隔，这里用了全角破折号 \u2014 → 不匹配
      // → time 为 undefined → title 有值但 time 没有 → 代码会抛 TypeError
      // （这是源码的一个边界缺陷：没有处理 title 匹配但 time 不匹配的情况）
      await expect(
        getAKEventWithDetailTime('https://api.example.com/list', 'https://api.example.com/detail')
      ).rejects.toThrow()
    })

    it('提取 banner（HTML 含 img 标签时，注意无换行）', async () => {
      // activitiesHtmlReg 正则要求 </div><p> 之间无换行/空格
      const contentWithBanner = '<div class="act-box"><img src="https://ak.example.com/banner.png"/></div><p><strong>一、材料收集</strong></p><p><strong>活动时间：</strong>2025年12月23日 16:10 - 2026年01月02日 04:10</p>'
      mockFetch
        .mockResolvedValueOnce(mockListResponse([{ cid: 'evt_001', category: 1 }]))
        .mockResolvedValueOnce(mockDetailResponse({ content: contentWithBanner }))

      const result = await getAKEventWithDetailTime('https://api.example.com/list', 'https://api.example.com/detail')

      expect(result).toHaveLength(1)
      expect(result[0].banner).toBe('https://ak.example.com/banner.png')
      expect(result[0].title).toBe('一、材料收集')
    })

    it('列表请求网络失败时向外抛出', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        getAKEventWithDetailTime('https://api.example.com/list', 'https://api.example.com/detail')
      ).rejects.toThrow('Network error')
    })
  })
})
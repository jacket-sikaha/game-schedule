import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getImgBanner, html2Str, getFGOEventWithDetailTime } from '../fgo/util'

// 注意 getFGOEventWithDetailTime 内部会调用 fetch，这里我们 mock 全局 fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('fgo/util', () => {
  afterEach(() => {
    mockFetch.mockReset()
  })

  // ═══════════════ getImgBanner ═══════════════
  describe('getImgBanner', () => {
    it('提取 img 标签的 src 属性', () => {
      expect(getImgBanner('<p><img src="//example.com/banner.png" alt="banner" /></p>'))
        .toBe('//example.com/banner.png')
    })

    it('没有 img 标签时返回 undefined', () => {
      expect(getImgBanner('<p>普通文本</p>')).toBeUndefined()
    })

    it('空字符串返回 undefined', () => {
      expect(getImgBanner('')).toBeUndefined()
    })

    it('多个 img 标签时只取第一个', () => {
      const html = '<img src="first.png" /><img src="second.png" />'
      expect(getImgBanner(html)).toBe('first.png')
    })

    it('自闭合 img 标签也能正常提取', () => {
      expect(getImgBanner('<img src="//cdn.example.com/icon.webp"/>'))
        .toBe('//cdn.example.com/icon.webp')
    })

    it('img 标签属性顺序不影响提取', () => {
      const html = '<img class="banner" id="img1" src="https://cdn.example.com/banner.jpg" width="800" />'
      expect(getImgBanner(html)).toBe('https://cdn.example.com/banner.jpg')
    })

    it('FGO 真实 HTML 格式也能提取', () => {
      const html = `<p class="p"><img src="//i0.hdslb.com/bfs/game/e0dece0d.png" alt="" /></p><p class="p"><span>活动时间</span></p>`
      expect(getImgBanner(html)).toBe('//i0.hdslb.com/bfs/game/e0dece0d.png')
    })
  })

  // ═══════════════ html2Str ═══════════════
  describe('html2Str', () => {
    it('去除 HTML 标签，提取纯文本', () => {
      expect(html2Str('<p>Hello <b>World</b></p>')).toBe('Hello World')
    })

    it('嵌套标签也能正确提取', () => {
      const html = '<div><p>活动时间：<span>2024年7月25日</span>~<span>8月11日</span></p></div>'
      const text = html2Str(html)
      expect(text).toContain('活动时间')
      expect(text).toContain('2024年7月25日')
      expect(text).toContain('8月11日')
    })

    it('空字符串返回空字符串', () => {
      expect(html2Str('')).toBe('')
    })

    it('FGO 公告格式 HTML 能完整提取', () => {
      const html = `<p class="p"><span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span></p><p class="p">2024年7月25日（周四）维护后~8月11日（周日）13:59为止</p>`
      const text = html2Str(html)
      expect(text).toContain('活动时间')
      expect(text).toContain('7月25日')
      expect(text).toContain('13:59')
    })

    it('纯文本不变', () => {
      expect(html2Str('纯文本内容')).toBe('纯文本内容')
    })
  })

  // ═══════════════ getFGOEventWithDetailTime ═══════════════
  describe('getFGOEventWithDetailTime', () => {
    it('完整流程：列表→详情→解析时间（mock fetch）', async () => {
      // 第一次 fetch：活动列表
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          data: [
            {
              id: 12345,
              title: 'FGO限时活动 迦勒底夏日大作战',
              content: '<p class="p"><img src="//i0.hdslb.com/bfs/game/banner.png" alt="" /></p><p class="p"><span>◆</span>活动时间<span>◆</span></p><p class="p">2024年7月25日（周四）维护后~8月11日（周日）13:59为止</p>',
            },
          ],
        }),
      })

      // 第二次 fetch：活动详情（POST）
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          data: {
            id: 12345,
            title: 'FGO限时活动 迦勒底夏日大作战',
            content: '<p class="p"><img src="//i0.hdslb.com/bfs/game/banner.png" alt="" /></p><p class="p"><span>◆</span>活动时间<span>◆</span></p><p class="p">2024年7月25日（周四）维护后~8月11日（周日）13:59为止</p>',
          },
        }),
      })

      const result = await getFGOEventWithDetailTime('https://cron.example.com/api/fgo')

      expect(result).toHaveLength(1)
      expect(result[0]).toBeDefined()
      expect(result[0]!.id).toBe(12345)
      expect(result[0]!.start_time).toBe('2024-07-25 04:00')
      expect(result[0]!.end_time).toBe('2024-08-11 13:59')
      expect(result[0]!.banner).toBe('//i0.hdslb.com/bfs/game/banner.png')
    })

    it('过滤掉"维护公告"类活动', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          data: [
            { id: 1, title: '维护公告：服务器升级', content: '' },
            { id: 2, title: '概率公示：卡池详情', content: '' },
          ],
        }),
      })

      const result = await getFGOEventWithDetailTime('https://cron.example.com/api/fgo')
      expect(result).toHaveLength(0) // 全部被过滤
    })

    it('网络请求失败时返回空数组', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await getFGOEventWithDetailTime('https://cron.example.com/api/fgo')
      expect(result).toEqual([])
    })

    it('详情请求返回无有效时间时跳过该活动', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          data: [
            { id: 999, title: '无时间活动', content: '<p>没有时间信息的活动</p>' },
          ],
        }),
      })

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          data: {
            id: 999,
            title: '无时间活动',
            content: '<p>没有时间信息的活动</p>',
          },
        }),
      })

      const result = await getFGOEventWithDetailTime('https://cron.example.com/api/fgo')
      expect(result).toHaveLength(0) // 无有效时间 → 被过滤
    })
  })
})
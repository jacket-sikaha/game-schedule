import { describe, it, expect } from 'vitest'
import { stripHtmlTags, parseStrToTime } from '../Arknights/util'

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
})
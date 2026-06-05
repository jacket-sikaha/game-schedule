import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { TIME_FORMAT, getShanghaiDate } from '../common'

describe('common', () => {
  describe('TIME_FORMAT', () => {
    it('应该导出正确的日期格式', () => {
      expect(TIME_FORMAT).toBe('YYYY-MM-DD HH:mm')
    })
  })

  describe('getShanghaiDate', () => {
    it('UTC 时间正确转换为上海时间（+8 小时）', () => {
      // 用 ISO 8601 标准格式，避免本地时区干扰
      const result = getShanghaiDate('2025-01-15T00:00:00Z')
      expect(result.format(TIME_FORMAT)).toBe('2025-01-15 08:00')
    })

    it('不传参数时应该返回当前时间', () => {
      const result = getShanghaiDate()
      const now = new Date()
      expect(result.year()).toBe(now.getFullYear())
      expect(result.month()).toBe(now.getMonth())
      expect(result.date()).toBe(now.getDate())
    })

    it('无时间的日期字符串也能正常格式化', () => {
      // dayjs('2025-06-01') 行为受宿主时区影响，只断言格式正确
      const date = getShanghaiDate('2025-06-01')
      expect(date.format(TIME_FORMAT)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })
  })
})
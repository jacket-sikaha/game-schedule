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
    it('应该返回 Asia/Shanghai 时区的 dayjs 对象', () => {
      const result = getShanghaiDate('2025-01-15 08:00:00')
      expect(result.format(TIME_FORMAT)).toBe('2025-01-15 08:00')
    })

    it('不传参数时应该返回当前时间', () => {
      const result = getShanghaiDate()
      const now = new Date()
      expect(result.year()).toBe(now.getFullYear())
      expect(result.month()).toBe(now.getMonth())
      expect(result.date()).toBe(now.getDate())
    })

    it('应该能处理不带时间的日期字符串', () => {
      const date = getShanghaiDate('2025-06-01')
      expect(date.format(TIME_FORMAT)).toBe('2025-06-01 00:00')
    })
  })
})
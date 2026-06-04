import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { matchTime } from '../snowbreak/util'

describe('snowbreak/util', () => {
  describe('matchTime', () => {
    it('基本日期范围提取', () => {
      const result = matchTime('活动时间：05月23日 维护后 - 06月06日 10:00', new Date('2025-05-22').getTime())
      expect(result).toBeDefined()
      expect(result!).toHaveLength(1)
      expect(result![0].start_time).toBeDefined()
      expect(result![0].end_time).toBeDefined()
    })

    it('起始时间没有小时时自动补 04:00', () => {
      const result = matchTime('活动时间：05月23日 - 06月06日 10:00', new Date('2025-05-22').getTime())
      expect(result![0].start_time).toContain('04:00')
    })

    it('结束时间无小时时不匹配', () => {
      const result = matchTime('活动时间：05月23日 10:00 - 06月06日', new Date('2025-05-22').getTime())
      expect(result).toBeUndefined()
    })

    it('跨年：12月→1月', () => {
      const result = matchTime('活动时间：12月23日 10:00 - 01月06日 10:00', new Date('2025-12-22').getTime())
      const start = dayjs(result![0].start_time)
      const end = dayjs(result![0].end_time)
      expect(end.year()).toBe(start.year() + 1)
    })

    it('同年', () => {
      const result = matchTime('活动时间：06月01日 10:00 - 06月15日 10:00', new Date('2025-05-30').getTime())
      expect(dayjs(result![0].start_time).year()).toBe(2025)
      expect(dayjs(result![0].end_time).year()).toBe(2025)
    })

    it('发布时间距活动2个月以上→加1年', () => {
      const result = matchTime('活动时间：01月15日 10:00 - 01月20日 10:00', new Date('2025-12-01').getTime())
      expect(dayjs(result![0].start_time).year()).toBe(2026)
    })

    it('无匹配返回 undefined', () => {
      expect(matchTime('没有活动时间', new Date().getTime())).toBeUndefined()
    })

    it('只有一个日期不匹配', () => {
      expect(matchTime('活动时间：05月23日 10:00', new Date('2025-05-22').getTime())).toBeUndefined()
    })

    it('Snowbreak 真实格式（单数字月日）', () => {
      const result = matchTime('活动时间：5月23日 10:00 - 6月6日 10:00', new Date('2025-05-22').getTime())
      expect(result![0].start_time).toBe('2025-05-23 10:00')
      expect(result![0].end_time).toBe('2025-06-06 10:00')
    })
  })
})
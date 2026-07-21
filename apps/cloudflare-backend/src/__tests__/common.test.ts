import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest'
import { TIME_FORMAT, getShanghaiDate } from '../common'
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin
import customParseFormat from 'dayjs/plugin/customParseFormat'; // ES 2015

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Shanghai');

describe('common', () => {
  describe('TIME_FORMAT', () => {
    it('应该导出正确的日期格式', () => {
      expect(TIME_FORMAT).toBe('YYYY-MM-DD HH:mm')
    })
  })

  describe('getShanghaiDate', () => {
    beforeAll(() => {
      vi.useFakeTimers();
      // 固定 UTC 时间为 2026-07-16 00:00:00
      vi.setSystemTime(new Date('2026-07-16T00:00:00Z'));
    });

    afterAll(() => {
      vi.useRealTimers();
    });


    it('UTC 时间正确转换为上海时间（+8 小时）', () => {
      // 用 ISO 8601 标准格式，避免本地时区干扰
      const result = getShanghaiDate('2025-01-15T00:00:00Z')
      expect(result.format(TIME_FORMAT)).toBe('2025-01-15 08:00')
    })

    it('不传参数时应该返回当前时间', () => {
      const result = getShanghaiDate();
      // 固定时间下，上海时间 = UTC+8 => 2026-07-16 08:00:00
      expect(result.year()).toBe(2026);
      expect(result.month()).toBe(6);  // dayjs 月份从 0 开始，7 月 => 6
      expect(result.date()).toBe(16);
    });


    it('无时间的日期字符串也能正常格式化', () => {
      // dayjs('2025-06-01') 行为受宿主时区影响，只断言格式正确
      const date = getShanghaiDate('2025-06-01')
      expect(date.format(TIME_FORMAT)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })
  })
}) 
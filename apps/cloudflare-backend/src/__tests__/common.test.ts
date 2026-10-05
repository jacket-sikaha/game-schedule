import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest'
import { stableId, TIME_FORMAT, getShanghaiDate } from '../common'
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

  describe('stableId', () => {
    it('相同输入生成相同 id（确定性）', () => {
      expect(stableId('mc', '1554468927538642944', '团团勇者大乱斗'))
        .toBe(stableId('mc', '1554468927538642944', '团团勇者大乱斗'))
    })

    it('输出格式为 gameKey_hex 前缀，避免 UID 里出现中文/非法字符', () => {
      expect(stableId('pns', '123', '测试活动')).toMatch(/^pns_[0-9a-f]{8}$/)
    })

    it('不同游戏的同 id 条目不冲突', () => {
      expect(stableId('mc', '1', '同款活动')).not.toBe(stableId('pns', '1', '同款活动'))
    })

    it('同 entryId 不同标题生成不同 id（鸣潮重复 id 实测场景）', () => {
      // 实测样例：上游两条活动共用 entryId 1554479052247040000
      expect(stableId('mc', '1554479052247040000', '回音盈域'))
        .not.toBe(stableId('mc', '1554479052247040000', '声弦涤荡'))
    })

    it('entryId 缺失时结果稳定且互不相同（战双缺 entryId 实测场景）', () => {
      expect(stableId('pns', undefined, '【远信回响】主线版本'))
        .toBe(stableId('pns', undefined, '【远信回响】主线版本'))
      expect(stableId('pns', undefined, '【远信回响】主线版本'))
        .not.toBe(stableId('pns', undefined, '【远信回响】空滞轮旋之梦'))
    })

    it('数字 0 与字符串 "0" 等价（模板字符串归一化）', () => {
      expect(stableId('pns', 0, '测试标题')).toBe(stableId('pns', '0', '测试标题'))
    })

    it('标题空白符/全角空格归一化，排版差异不导致 id 漂移', () => {
      expect(stableId('mc', '1', '活动　标题 ')).toBe(stableId('mc', '1', ' 活动 标题 '))
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
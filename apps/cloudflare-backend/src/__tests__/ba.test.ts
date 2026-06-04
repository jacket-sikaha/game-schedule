import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { matchTime, handleBAData } from '../ba/util'
import type { BAData } from '../ba/DataType'

// 构造测试数据
const makeItem = (overrides: Partial<BAData['data']['rows'][0]> = {}): BAData['data']['rows'][0] => ({
  id: 1,
  title: '测试活动',
  banner: 'https://example.com/banner.png',
  content: '活动时间：05月23日 维护后 ~ 06月06日 10:00',
  type: '1',
  publishTime: new Date('2025-05-22').getTime(),
  description: '活动描述',
  ...overrides,
})

describe('ba/util', () => {
  // ═══════════════ matchTime ═══════════════
  describe('matchTime', () => {
    it('基本日期范围提取', () => {
      const result = matchTime('活动时间：05月23日 维护后 ~ 06月06日 10:00', new Date('2025-05-22').getTime())
      expect(result).toBeDefined()
      expect(result!).toHaveLength(1)
      expect(result![0].start_time).toBeDefined()
      expect(result![0].end_time).toBeDefined()
    })

    it('起始时间没有小时时自动补 04:00', () => {
      const result = matchTime('活动时间：05月23日 ~ 06月06日 10:00', new Date('2025-05-22').getTime())
      expect(result![0].start_time).toContain('04:00')
    })

    it('结束时间没有精确小时时不匹配（正则要求 HH:mm）', () => {
      const result = matchTime('活动时间：05月23日 10:00 ~ 06月06日', new Date('2025-05-22').getTime())
      expect(result).toBeUndefined()
    })

    it('跨年：12月→1月自动加1年', () => {
      const result = matchTime('活动时间：12月23日 10:00 ~ 01月06日 10:00', new Date('2025-12-22').getTime())
      const start = dayjs(result![0].start_time)
      const end = dayjs(result![0].end_time)
      expect(end.year()).toBe(start.year() + 1)
    })

    it('同年同月不同日', () => {
      const result = matchTime('活动时间：06月01日 10:00 ~ 06月15日 10:00', new Date('2025-05-30').getTime())
      const start = dayjs(result![0].start_time)
      const end = dayjs(result![0].end_time)
      expect(start.year()).toBe(2025)
      expect(end.year()).toBe(2025)
    })

    it('发布时间距活动开始超过2个月时自动加1年', () => {
      // 活动时间是1月，但发布在12月（距离下个1月不到2个月，不会加1年）
      // 换一个：发布时间是3月，活动是1月（发布时间在活动后2个月以上）
      const result = matchTime('活动时间：01月15日 10:00 ~ 01月20日 10:00', new Date('2025-12-01').getTime())
      // publishTime 是2025-12→活动是2026-01
      const start = dayjs(result![0].start_time)
      expect(start.year()).toBe(2026)
    })

    it('无匹配的日期模式时返回 undefined', () => {
      const result = matchTime('这是一条没有活动时间的公告', new Date().getTime())
      expect(result).toBeUndefined()
    })
  })

  // ═══════════════ handleBAData ═══════════════
  describe('handleBAData', () => {
    it('正常处理 BA 数据，提取时间范围', () => {
      const data: BAData = {
        code: 200,
        msg: 'success',
        data: { rows: [makeItem()], count: 1 },
      }
      const result = handleBAData(data)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].title).toBe('测试活动')
      expect(result[0].start_time).toBeDefined()
      expect(result[0].end_time).toBeDefined()
      expect(result[0].linkUrl).toContain('bluearchive-cn.com')
    })

    it('type=2 且 content 不在 filterKeys 中时被过滤', () => {
      const data: BAData = {
        code: 200,
        msg: 'success',
        data: { rows: [makeItem({ type: '2', content: '无关内容' })], count: 1 },
      }
      expect(handleBAData(data)).toHaveLength(0)
    })

    it('type=2 且 content=活动时间(纯关键字)时——matchTime 无法匹配日期也被过滤', () => {
      // 注意：content 只有"活动时间"四字，matchTime 的正则需要日期模式，
      // 所以匹配不到 → 返回 undefined → 被最终 .filter(item => !!item) 过滤掉
      const data: BAData = {
        code: 200,
        msg: 'success',
        data: { rows: [makeItem({ type: '2', content: '活动时间' })], count: 1 },
      }
      expect(handleBAData(data)).toHaveLength(0)
    })

    it('type=2 若包含完整日期仍然会被过滤（filterKeys 检查在前）', () => {
      // filterKeys 是 ['活动时间']，content 必须等于 '活动时间' 才不会被 type 过滤
      // '活动时间：06月01日 10:00 ~ 06月15日 10:00' !== '活动时间'，所以仍然被过滤
      const data: BAData = {
        code: 200,
        msg: 'success',
        data: { rows: [makeItem({ type: '2', content: '活动时间：06月01日 10:00 ~ 06月15日 10:00' })], count: 1 },
      }
      expect(handleBAData(data)).toHaveLength(0)
    })

    it('content 无有效日期时整个条目被跳过', () => {
      const data: BAData = {
        code: 200,
        msg: 'success',
        data: { rows: [makeItem({ content: '公告内容没有日期' })], count: 1 },
      }
      expect(handleBAData(data)).toHaveLength(0)
    })

    it('多条数据混合处理', () => {
      const data: BAData = {
        code: 200,
        msg: 'success',
        data: {
          rows: [
            makeItem({ id: 1, title: '活动A' }),
            makeItem({ id: 2, type: '2', content: '无关' }),
            makeItem({ id: 3, title: '活动C' }),
          ],
          count: 3,
        },
      }
      const result = handleBAData(data)
      expect(result).toHaveLength(2)
      expect(result.map(r => r.id)).toEqual([1, 3])
    })
  })
})
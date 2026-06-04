import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { handleGamekeeEvent } from '../gamekee/util'
import type { GamekeeData } from '../gamekee/DataType'

const makeItem = (overrides: Partial<GamekeeData['data'][0]> = {}): GamekeeData['data'][0] => ({
  id: 1,
  title: '测试活动',
  link_url: 'https://example.com/event/1',
  picture: 'https://example.com/pic.jpg',
  big_picture: 'https://example.com/big_pic.jpg',
  description: '活动描述',
  begin_at: 1717084800,   // 2024-05-30 16:00:00 UTC
  end_at: 1718553600,     // 2024-06-16 16:00:00 UTC
  importance: 1,
  count_down: 1,
  creator_uid: 100,
  sort: 0,
  pub_area: 'zh-cn',
  tag: '活动',
  image_list: '',
  ...overrides,
})

describe('gamekee/util', () => {
  describe('handleGamekeeEvent', () => {
    it('将秒级时间戳转为格式化日期', () => {
      const result = handleGamekeeEvent([makeItem()])
      expect(result).toHaveLength(1)
      expect(result[0].start_time).toBe(dayjs(1717084800 * 1000).format('YYYY-MM-DD HH:mm:ss'))
      expect(result[0].end_time).toBe(dayjs(1718553600 * 1000).format('YYYY-MM-DD HH:mm:ss'))
    })

    it('优先使用 big_picture 作为 banner', () => {
      const result = handleGamekeeEvent([makeItem()])
      expect(result[0].banner).toBe('https://example.com/big_pic.jpg')
    })

    it('big_picture 为空时回退到 picture', () => {
      const result = handleGamekeeEvent([makeItem({ big_picture: '' })])
      expect(result[0].banner).toBe('https://example.com/pic.jpg')
    })

    it('big_picture 为 undefined 时回退到 picture', () => {
      const result = handleGamekeeEvent([makeItem({ big_picture: undefined as any })])
      expect(result[0].banner).toBe('https://example.com/pic.jpg')
    })

    it('保留 link_url 到 linkUrl', () => {
      expect(handleGamekeeEvent([makeItem()])[0].linkUrl).toBe('https://example.com/event/1')
    })

    it('保留原始字段（id, title, description, importance）', () => {
      const result = handleGamekeeEvent([makeItem()])[0]
      expect(result.id).toBe(1)
      expect(result.title).toBe('测试活动')
      expect(result.description).toBe('活动描述')
      expect(result.importance).toBe(1)
    })

    it('多条活动批量处理', () => {
      const data = [makeItem({ id: 1, title: '活动A' }), makeItem({ id: 2, title: '活动B' }), makeItem({ id: 3, title: '活动C' })]
      const result = handleGamekeeEvent(data)
      expect(result).toHaveLength(3)
      expect(result.map(e => e.title)).toEqual(['活动A', '活动B', '活动C'])
    })

    it('空数组返回空数组', () => {
      expect(handleGamekeeEvent([])).toEqual([])
    })

    it('零值时间戳也能处理', () => {
      const result = handleGamekeeEvent([makeItem({ begin_at: 0, end_at: 0 })])
      expect(result[0].start_time).toBe(dayjs(0).format('YYYY-MM-DD HH:mm:ss'))
      expect(result[0].end_time).toBe(dayjs(0).format('YYYY-MM-DD HH:mm:ss'))
    })
  })
})
import { describe, it, expect } from 'vitest'
import { parseActivities } from '../endfield'

describe('endfield', () => {
  describe('parseActivities', () => {
    it('解析单个活动卡片', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000" data-type="event" href="/zh-Hans/activities/event-1">
          <img src="https://end.wiki/images/banner.png" alt="活动标题" />
          <span class="activity-card-name">限时活动</span>
        </a>
      `
      const result = parseActivities(html)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('限时活动')
      expect(result[0].banner).toBe('https://end.wiki/images/banner.png')
      expect(result[0].linkUrl).toContain('/zh-Hans/activities/event-1')
      expect(result[0].type).toBe('event')
    })

    it('data-open 为空的卡片被跳过', () => {
      const html = `
        <a class="activity-card" data-open="" data-close="" href="/zh-Hans/activities/empty">
          <span class="activity-card-name">无时间活动</span>
        </a>
      `
      expect(parseActivities(html)).toHaveLength(0)
    })

    it('data-close 为空时自动设为5年后', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="">
          <span class="activity-card-name">常驻活动</span>
        </a>
      `
      const result = parseActivities(html)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('常驻活动')
      // end_time 应该是5年后
      expect(result[0].end_time).toBeDefined()
    })

    it('无 activity-card-name 时回退到 img alt', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000">
          <img src="banner.png" alt="alt标题" />
        </a>
      `
      const result = parseActivities(html)
      expect(result[0].title).toBe('alt标题')
    })

    it('多个活动卡片', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000">
          <span class="activity-card-name">活动A</span>
        </a>
        <a class="activity-card" data-open="1717800000000" data-close="1718400000000">
          <span class="activity-card-name">活动B</span>
        </a>
      `
      expect(parseActivities(html)).toHaveLength(2)
    })

    it('href 为空时 linkUrl 也为空', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000" href="">
          <span class="activity-card-name">活动C</span>
        </a>
      `
      expect(parseActivities(html)[0].linkUrl).toBe('')
    })

    it('相对路径 href 自动补全为完整 URL', () => {
      const html = `
        <a class="activity-card" data-open="1717200000000" data-close="1717800000000" href="/zh-Hans/activities/test">
          <span class="activity-card-name">活动D</span>
        </a>
      `
      expect(parseActivities(html)[0].linkUrl).toBe('https://end.wiki/zh-Hans/activities/test')
    })
  })
})
import { CalendarActivityResult, stableId, TIME_FORMAT } from '@/common';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';

const BASE_URL = 'https://end.wiki';
const BASE_URL2 = 'https://fz.wiki/wiki';

export function parseActivities(html: string): CalendarActivityResult['data'] {
    const $ = cheerio.load(html);
    const activities = $('.activity-card')
        .map((_, el) => {
            const $card = $(el);
            const open = $card.attr('data-open');
            // data-open 为空直接跳过
            if (!open) return null;
            const href = $card.attr('href') || '';
            const img = $card.find('img').attr('src') || '';
            const title =
                $card.find('.activity-card-name').text().trim() ||
                $card.find('img').attr('alt') ||
                '';
            return {
                // 上游 HTML 卡片没有稳定 id，用「开始时间戳 + 标题」确定性生成，
                // 保证同一活动每次解析得到相同 id（订阅 UID 稳定性的前置条件）
                id: stableId('endfield', open, title),
                type: $card.attr('data-type') || '',
                start_time: dayjs(Number(open)).format(TIME_FORMAT),
                end_time: $card.attr('data-close')
                    ? dayjs(Number($card.attr('data-close'))).format(TIME_FORMAT)
                    : dayjs().add(5, 'year').format(TIME_FORMAT),
                linkUrl: href
                    ? new URL(href, BASE_URL).toString()
                    : '',
                banner: img,
                title,
            };
        })
        .get()
        .filter(Boolean);
    return activities;
}

interface WikiTimeRange {
    open: string;
    close: string;
}

interface WikiActivity {
    name: string;
    tags: string[];
    sortId: number;
    linkTitle: string;
    tabImgUrl: string;
    activityId: string;
    timeRanges: WikiTimeRange[];
    tabImgColor: string;
    // Newer revisions expose a calendar-specific range alongside the activity range.
    calendarRange?: WikiTimeRange;
    calendarTag?: string;
    calendarTitle?: string;
    calendarCategory?: string;
}

function parseWikiTime(timeStr: string): dayjs.Dayjs | null {
    if (!timeStr) return null;
    // Format: "2026/7/16 7:00:00" or "2026/7/16 4:00:00"
    const match = timeStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (!match) return null;
    const [, year, month, day, hour, minute, second] = match;
    return dayjs(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
}

export const getActivities = async (url: string): Promise<CalendarActivityResult['data']> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        const json = await response.json() as any;

        // Navigate to revision.contentJson.content → find endfieldCardActivityIndex node
        const contentNodes = json?.revision?.contentJson?.content || [];
        const activityNode = contentNodes.find(
            (node: any) => node.type === 'endfieldCardActivityIndex'
        );
        if (!activityNode?.content) {
            return [];
        }

        // Child nodes appear in two shapes across upstream revisions:
        //   legacy:  { type: 'endfieldCardActivityIndex__activities', attrs: { name, timeRanges, ... } }
        //   current: { type: 'wikiCardItem', attrs: { itemType: 'endfieldCardActivityIndex__activities',
        //                                              data: { name, timeRanges, ... } } }
        // Identify activity nodes by node.type OR attrs.itemType, then unwrap attrs.data when present.
        const ACTIVITY_ITEM_TYPE = 'endfieldCardActivityIndex__activities';
        const isActivityNode = (node: any): boolean =>
            node?.type === ACTIVITY_ITEM_TYPE || node?.attrs?.itemType === ACTIVITY_ITEM_TYPE;

        const wikiActivities: WikiActivity[] = (activityNode.content as any[])
            .filter(isActivityNode)
            .map((node: any) => node?.attrs?.data ?? node?.attrs)
            .filter((act: any) => act && typeof act === 'object' && act.name);
        if (wikiActivities.length === 0) {
            return [];
        }

        return wikiActivities
            .map((act) => {
                // Prefer the calendar-specific range when the upstream provides one,
                // otherwise fall back to the first activity time range.
                const calendarRange = act.calendarRange;
                const timeRange =
                    calendarRange?.open ? calendarRange : act.timeRanges?.[0];
                if (!timeRange?.open) return null;

                const start = parseWikiTime(timeRange.open);
                const end = timeRange.close ? parseWikiTime(timeRange.close) : null;

                if (!start || end?.isBefore(dayjs())) return null;

                return {
                    id: act.activityId,
                    title: act.calendarTitle || act.name,
                    start_time: start.format(TIME_FORMAT),
                    end_time: end
                        ? end.format(TIME_FORMAT)
                        : dayjs().add(5, 'year').format(TIME_FORMAT),
                    banner: act.tabImgUrl,
                    // linkTitle looks like "活动/挽弓试炼·10月15日"; encode per segment so
                    // the path separator survives (encodeURIComponent would turn it into %2F).
                    linkUrl: `${BASE_URL2}/${String(act.linkTitle || '')
                        .split('/')
                        .map(encodeURIComponent)
                        .join('/')}`,
                    type: act.tags?.join(', ') || act.calendarTag || '',
                };
            })
            .filter(Boolean) as CalendarActivityResult['data'];
    } catch (error) {
        console.error('Failed to fetch endfield activities:', error);
        return [];
    }
};
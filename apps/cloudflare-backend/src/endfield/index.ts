import { CalendarActivityResult, TIME_FORMAT } from '@/common';
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
            return {
                id: Math.random().toString(36),
                type: $card.attr('data-type') || '',
                start_time: dayjs(Number(open)).format(TIME_FORMAT),
                end_time: $card.attr('data-close')
                    ? dayjs(Number($card.attr('data-close'))).format(TIME_FORMAT)
                    : dayjs().add(5, 'year').format(TIME_FORMAT),
                linkUrl: href
                    ? new URL(href, BASE_URL).toString()
                    : '',
                banner: img,
                title:
                    $card.find('.activity-card-name').text().trim() ||
                    $card.find('img').attr('alt') ||
                    '',
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
        if (!activityNode?.attrs?.activities) {
            return [];
        }

        const wikiActivities: WikiActivity[] = activityNode.attrs.activities;

        return wikiActivities
            .map((act) => {
                const timeRange = act.timeRanges?.[0];
                if (!timeRange?.open) return null;

                const start = parseWikiTime(timeRange.open);
                const end = timeRange.close ? parseWikiTime(timeRange.close) : null;

                if (!start || end?.isBefore(dayjs())) return null;

                return {
                    id: act.activityId,
                    title: act.name,
                    start_time: start.format(TIME_FORMAT),
                    end_time: end
                        ? end.format(TIME_FORMAT)
                        : dayjs().add(5, 'year').format(TIME_FORMAT),
                    banner: act.tabImgUrl,
                    linkUrl: `${BASE_URL2}/${encodeURIComponent(act.linkTitle)}`,
                    type: act.tags?.join(', ') || '',
                };
            })
            .filter(Boolean) as CalendarActivityResult['data'];
    } catch (error) {
        console.error('Failed to fetch endfield activities:', error);
        return [];
    }
};
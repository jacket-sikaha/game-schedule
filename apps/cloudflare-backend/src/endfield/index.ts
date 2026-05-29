import { CalendarActivityResult, TIME_FORMAT } from '@/common';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
const BASE_URL = 'https://end.wiki';

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

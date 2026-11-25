import dayjs from 'dayjs';
import { TIME_FORMAT } from '@/common';
import * as cheerio from 'cheerio';
import { UmamusumeNewsDetailResponse, UmamusumeNewsItem, UmamusumeNewsResponse } from './DataType';

const PAGE_SIZE = 20;

const eventTitleCandidate =
	/活动|赛事|招募|养成奖励|纪念|转队|开放|赠礼|赠送|发放|举办|登场|上架|演出|解锁|更新|公开|获奖|限定任务|预告|公测/;
const nonEventTitle = /概率公示|公平运营|FAQ|适龄/i;
const eventTimeLabel = /活动时间|活动期间|领取时间/g;

export const isUmamusumeEventTitleCandidate = (title: string) =>
	eventTitleCandidate.test(title) && !nonEventTitle.test(title);

const normalizeTime = (text: string) =>
	text
		.replace(/[～—~]/g, '-')
		.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/g, '$1/$2/$3')
		.replace(/(\d{1,2})月(\d{1,2})日/g, '$1/$2')
		.replace(/\s*\(周[一二三四五六日]\)\s*/g, ' ')
		.replace(/\s*（周[一二三四五六日]）\s*/g, ' ')
		.replace(/更新后/g, '12:00')
		.replace(/维护后/g, '05:00')
		.trim();

const fullTimeReg =
	/(\d{4}\/\d{1,2}\/\d{1,2})(?:\s+)?(\d{1,2}:\d{2})?(?::\d{2})?\s*-\s*(\d{4}\/\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})(?::\d{2})?/;
const noYearTimeReg =
	/(\d{1,2}\/\d{1,2})(?:\s+)?(\d{1,2}:\d{2})?\s*-\s*(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})/;

export const matchEventTime = (
	content: string,
	publishTime: string,
): [dayjs.Dayjs, dayjs.Dayjs] | null => {
	const text = cheerio
		.load(content, null, false)
		.text()
		.replace(/\s+/g, ' ')
		.trim();

	const publish = dayjs(publishTime);
	const labels = [...text.matchAll(eventTimeLabel)];

	for (const label of labels) {
		const normalized = normalizeTime(text.slice(label.index, label.index + 220));

		let m = normalized.match(fullTimeReg);
		if (m) {
			const start = dayjs(`${m[1]} ${m[2] || '05:00'}`, 'YYYY/M/D H:mm', 'zh-cn');
			const end = dayjs(`${m[3]} ${m[4]}`, 'YYYY/M/D H:mm', 'zh-cn');
			if (start.isValid() && end.isValid()) return [start, end];
		}

		m = normalized.match(noYearTimeReg);
		if (m) {
			const startTime = m[2] || '12:00';
			let start = dayjs(`${publish.year()}/${m[1]} ${startTime}`, 'YYYY/M/D H:mm', 'zh-cn');
			let end = dayjs(`${publish.year()}/${m[3]} ${m[4]}`, 'YYYY/M/D H:mm', 'zh-cn');
			if (start.isAfter(end)) end = end.add(1, 'year');
			if (start.isValid() && end.isValid()) return [start, end];
		}
	}

	return null;
};

const getBanner = (html: string): string | undefined => {
	try {
		return cheerio.load(html)('img').first().attr('src')?.replace(/^\/\//, 'https://');
	} catch {
		return undefined;
	}
};

const linkUrl = (id: number) => `https://game.bilibili.com/pd/news.html#!news/1/1/${id}`;

export const handleUmamusumeNews = (items: UmamusumeNewsItem[]) => {
	return items
		.map((item) => {
			const times = matchEventTime(item.content, item.displayTime || item.modifyTime || item.createTime || '');
			if (!times) return null;
			const [start, end] = times;
			return {
				id: item.id,
				title: item.title,
				typeId: item.typeId,
				start_time: start.format(TIME_FORMAT),
				end_time: end.format(TIME_FORMAT),
				banner: getBanner(item.content),
				publishTime: item.displayTime || item.modifyTime || item.createTime,
				linkUrl: linkUrl(item.id),
			};
		})
		.filter((item): item is NonNullable<typeof item> => item !== null);
};

const fetchDetail = async (url: string, id: number) => {
	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({ activityId: id }),
		headers: { 'Content-Type': 'application/json' },
	});
	if (!res.ok) {
		const error = new Error(
			`Umamusume detail request failed: ${res.status}`,
		) as Error & { status?: number };
		error.status = res.status;
		throw error;
	}
	const json = (await res.json()) as UmamusumeNewsDetailResponse;
	if (json.code !== 0) throw new Error(`Umamusume detail api error: ${json.code}`);
	return json.data;
};

export const getUmamusumeEventData = async (
	apiUrl: string,
	pages = 1,
) => {
	const listUrl = new URL(apiUrl);
	listUrl.searchParams.set('isNew', '1');
	listUrl.searchParams.set('pageSize', String(PAGE_SIZE));
	if (!listUrl.searchParams.has('pageNum')) listUrl.searchParams.set('pageNum', '1');

	const listItems: UmamusumeNewsItem[] = [];
	let pageNo = Number(listUrl.searchParams.get('pageNum'));

	for (let i = 0; i < pages; i++) {
		listUrl.searchParams.set('pageNum', String(pageNo));
		const res = await fetch(listUrl.toString());
		if (!res.ok) throw new Error(`Umamusume api request failed: ${res.status}`);
		const json = (await res.json()) as UmamusumeNewsResponse;
		if (json.code !== 0) throw new Error(`Umamusume api error: ${json.code}`);
		listItems.push(...json.data);
		if (json.data.length < PAGE_SIZE) break;
		pageNo++;
	}

	const candidates = listItems.filter(({ title }) => isUmamusumeEventTitleCandidate(title));
	const details = await Promise.all(candidates.map(({ id }) => fetchDetail(apiUrl, id)));
	return handleUmamusumeNews(details);
};

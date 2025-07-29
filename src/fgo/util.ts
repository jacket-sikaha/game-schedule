import dayjs from 'dayjs';
import { FGOData } from './DataType';
import * as cheerio from 'cheerio';
import { TIME_FORMAT } from '@/common';

// cf worker的node环境更特别一些，jsdom所需要的node依赖和worker不完全兼容
// cheerio
const getImgBanner = (htmlStr: string) => {
	const $ = cheerio.load(htmlStr);
	return $('img').attr('src');
};

export const html2Str = (htmlStr: string) => {
	return cheerio.load(htmlStr, null, false).text();
};
const getFGOEventList = async (eventsUrl: string) => {
	const res = await fetch(eventsUrl);
	const data = ((await res.json()) as { data: FGOData[] }).data
		.filter((obj: FGOData) => obj.title.indexOf('维护公告') === -1 && obj.title.indexOf('概率公示') === -1)
		.map((obj: FGOData) => ({
			detail: `https://api.biligame.com/news/${obj.id}.action`,
			linkUrl: `https://game.bilibili.com/fgo/news.html#!news/1/1/${obj.id}`,
		}));
	return data;
};

const getFGOEventDetail = async (url: string, linkUrl: string) => {
	try {
		const res = await fetch(url);
		const data = ((await res.json()) as { data: FGOData }).data;
		const temp = html2Str(data.content).match(/[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日.+?[～~].+?为止/gm);
		const banner = getImgBanner(data.content);
		if (!temp) return null;
		let [start_time, end_time] = temp[0].split(/[～~]/).map((time) => {
			if (!time.includes(':')) {
				time += ' 4:00';
			}
			return dayjs(time, ['YYYY M D H:mm', 'M D H:mm'], 'zh-cn');
		});
		end_time = end_time.year(start_time.year());
		if (start_time.isAfter(end_time)) {
			end_time = end_time.add(1, 'year');
		}
		return {
			...data,
			content: temp[0],
			start_time: start_time.format(TIME_FORMAT),
			end_time: end_time.format(TIME_FORMAT),
			banner,
			linkUrl,
		};
	} catch (error) {
		return null;
	}
};

const getFGOEventWithDetailTime = async (eventsUrl: string) => {
	const events = await getFGOEventList(eventsUrl);
	const tmp = await Promise.all(events.map(({ detail, linkUrl }) => getFGOEventDetail(detail, linkUrl)));
	return tmp.filter((item) => item !== null);
};

export { getFGOEventWithDetailTime, getImgBanner };

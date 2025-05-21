import { FGOData } from './DataType';
import * as cheerio from 'cheerio';

// cf worker的node环境更特别一些，jsdom所需要的node依赖和worker不完全兼容
// cheerio
const getImgBanner = (htmlStr: string) => {
	const $ = cheerio.load(htmlStr);
	return $('img').attr('src');
};

const getFGOEventList = async (eventsUrl: string) => {
	const res = await fetch(eventsUrl);
	const data = ((await res.json()) as { data: FGOData[] }).data
		.filter((obj: FGOData) => obj.title.indexOf('维护公告') === -1 && obj.title.indexOf('概率公示') === -1)
		.map((obj: FGOData) => ({
			detail: `https://api.biligame.com/news/${obj.id}.action`,
			linkUrl: `https://game.bilibili.com/fgo/news.html#!news/1/1/${obj.id}`,
		}));
	console.log('data:', data);
	return data;
};

const getFGOEventDetail = async (url: string, linkUrl: string) => {
	const res = await fetch(url);
	const data = ((await res.json()) as { data: FGOData }).data;
	const temp = data.content.match(/[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日[^\<\>]+?为止/gm);
	const banner = getImgBanner(data.content);
	let start_time;
	let end_time;
	if (!temp) {
		return { ...data, content: temp, start_time, end_time, banner, linkUrl };
	}
	const matchArr = temp[0].match(/[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日/gm);
	start_time = matchArr && matchArr[0];
	if (matchArr && matchArr?.length > 1) {
		end_time = matchArr[1];
	}
	end_time = start_time?.slice(0, 5) + temp[0].match(/[0-9]{1,2}月[0-9]{1,2}日/gm)![1];
	return { ...data, content: temp[0], start_time, end_time, banner, linkUrl };
};

const getFGOEventWithDetailTime = async (eventsUrl: string) => {
	const events = await getFGOEventList(eventsUrl);
	return await Promise.all(events.map(({ detail, linkUrl }) => getFGOEventDetail(detail, linkUrl)));
};

export { getFGOEventWithDetailTime, getImgBanner };

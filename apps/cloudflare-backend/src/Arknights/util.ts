import dayjs from 'dayjs';
import { getImgBanner } from '../fgo/util';
import { AKData, AKEventData } from './DataType';
import { TIME_FORMAT } from '@/common';

const titleReg = /[一二三四五六七八九十]{1,2}、[^一二三四五六七八九十]+?(?=活动时间：)/gm;
const timeReg = /(?<=[一二三四五六七八九十]{1,2}、[^一二三四五六七八九十]+)活动时间：.+?-.+?\d{1,2}:\d{2}/gm;
const specialReg = /\d{1,2}月\d{1,2}日.+?-.+?\d{1,2}:\d{1,2}/;
const activitiesHtmlReg =
	/<div[^<]+<img[^<]+\/><\/div><p>\s*<strong>[一二三四五六七八九十]{1,2}[^<>]+?<\/strong><\/p><p>\s*<strong>活动时间：<\/strong>[^<]+<\/p>/gm;

function stripHtmlTags(html: string) {
	return html.replace(/<[^>]*>/g, ' ');
}

const getAKPopupEvent = async (eventList: string, eventDetail: string) => {
	const res = await fetch(eventList);
	// const data = ((await res.json()) as AKData).data.popup.defaultPopup;
	// return `${eventDetail}/${data}`;
	const data = ((await res.json()) as AKData).data.list.filter(({ category }) => category === 1).map((obj) => `${eventDetail}/${obj.cid}`);
	return data;
};

const getAKEventDetail = async (url: string) => {
	const res = await fetch(url);
	const data = ((await res.json()) as { data: AKEventData }).data;
	if (!data.content) return [];
	const text = stripHtmlTags(data.content);
	const title = text.match(titleReg);
	const time = text.match(timeReg);
	const html = data.content.match(activitiesHtmlReg);
	if (url.includes('1014')) console.log({ title, time, html });

	if (!title && !time) return [];
	const event =
		title?.map((title, i) => {
			let [start_time, end_time] = parseStrToTime(time![i], data.displayTime) || [null, null];
			if (!start_time || !end_time) {
				return null;
			}
			const banner = (html && getImgBanner(html[i])) || '';
			return { id: `${data.cid}${i}`, title: title.trim(), start_time, end_time, banner, linkUrl: data.jumpLink };
		}) ?? [];
	return event?.filter((item) => item !== null);
};

const parseStrToTime = (str: string, timeCalibrationVal: string) => {
	let [start_time_str, end_time_str] = str.replace(/活动时间：/, '').split('-');
	let [start_time, end_time] = [start_time_str, end_time_str]
		.map((s) => s.trim())
		.map((item) => (item ? dayjs(item, ['YYYY MM DD HH:mm', 'MM DD HH:mm', 'MM DD'], 'zh-cn') : null));

	const publishTime = dayjs(timeCalibrationVal);
	if (!start_time || !end_time) return undefined;
	if (!start_time_str.includes('年')) {
		start_time = start_time.year(publishTime.year());
		// 对于publishTime是12月发布的，而start_time是1月，则start_time要加1年
		if (publishTime.diff(start_time, 'month') > 1) {
			start_time = start_time.add(1, 'year');
		}
	}
	if (!start_time_str.includes(':')) {
		start_time = start_time.hour(16);
	}
	if (!end_time_str.includes(':')) {
		end_time = end_time.hour(4);
	}
	if (start_time.isAfter(end_time)) {
		end_time = end_time.add(1, 'year');
	}
	return [start_time.format(TIME_FORMAT), end_time.format(TIME_FORMAT)];
};

const getAKEventWithDetailTime = async (eventList: string, eventDetail: string) => {
	const events = await getAKPopupEvent(eventList, eventDetail);
	const data = await Promise.all(events.map((e) => getAKEventDetail(e)));
	return data.flatMap((item) => item);
};

export { getAKEventWithDetailTime };

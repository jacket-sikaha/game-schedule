import dayjs from 'dayjs';
import { getImgBanner } from '../fgo/util';
import { AKData, AKEventData } from './DataType';
import { TIME_FORMAT } from '@/common';

const titleReg = /[一二三四五六七八九十]{1,2}、[^一二三四五六七八九十]+?(?=活动时间：)/gm;
const timeReg = /[一二三四五六七八九十]{1,2}、[^一二三四五六七八九十]+?活动时间：.+?-.+?\d{1,2}:\d{2}/gm;
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
	const title = text.match(titleReg)?.map((item) => item.trim());
	const time = text.match(timeReg)?.map((item) => item.replace(titleReg, ''));
	const html = data.content.match(activitiesHtmlReg);

	if (!title && !time) return [];
	const event =
		title?.map((title, i) => {
			let [start_time, end_time] = parseStrToTime(time![i], data.displayTime) || [null, null];
			if (!start_time || !end_time) {
				return null;
			}
			const tmp = html?.find((str) => str.includes(title));
			const banner = (tmp && getImgBanner(tmp)) || '';
			return { id: `${data.cid}${i}`, title, start_time, end_time, banner, linkUrl: data.jumpLink, displayTime: data.displayTime };
		}) ?? [];
	return event?.filter((item) => item !== null);
};

const parseStrToTime = (str: string, timeCalibrationVal: string) => {
	let [start_time_str, end_time_str] = str.replace(/活动时间：/, '').split('-');
	let [start_time, end_time] = [start_time_str, end_time_str]
		.map((s) => s.trim())
		// (2025 年)? 12 月 11 日 16:10 这类格式都能识别
		.map((item) => (item ? dayjs(item, ['YYYY MM DD HH:mm', 'MM DD HH:mm', 'MM DD'], 'zh-cn') : null));
	// 特殊情况，02月16日 20:00 - 24:00
	if (!/[年月日]/g.test(end_time_str)) {
		end_time = start_time ? dayjs(start_time.format('YYYY-MM-DD') + end_time_str, 'YYYY-MM-DD HH:mm', 'zh-cn') : null;
	}
	const publishTime = dayjs(timeCalibrationVal);
	if (!start_time || !end_time) return undefined;
	if (!start_time_str.includes(':')) {
		start_time = start_time.hour(16);
	}
	if (!end_time_str.includes(':')) {
		end_time = end_time.hour(4);
	}
	if (!str.includes('年')) {
		// 如果还能显示前年年尾活动，需要根据帖子发布时间调整
		if (publishTime.year() !== start_time.year()) {
			start_time = start_time.year(publishTime.year());
			end_time = end_time.year(publishTime.year());
		}
		return [start_time.format(TIME_FORMAT), end_time.format(TIME_FORMAT)];
	}
	// 对于跨年活动特殊处理
	// 大概格式：12月23日 16:10 - 2025年01月2日 4:10
	// 在本地时间25年时候， start_time 要减1年
	if (!start_time_str.includes('年') && end_time_str.includes('年')) {
		if (start_time.isAfter(end_time)) {
			start_time = start_time.add(-1, 'year');
		}
	}
	// 对于 2025年01月03日 16:10 - 01月12日 4:10 这类活动
	// 在本地时间还是24年时候，end_time 要加1年
	if (start_time_str.includes('年') && !end_time_str.includes('年')) {
		if (start_time.isAfter(end_time)) {
			end_time = end_time.add(1, 'year');
		}
	}

	return [start_time.format(TIME_FORMAT), end_time.format(TIME_FORMAT)];
};

const getAKEventWithDetailTime = async (eventList: string, eventDetail: string) => {
	const events = await getAKPopupEvent(eventList, eventDetail);
	const data = await Promise.all(events.map((e) => getAKEventDetail(e)));
	return data.flatMap((item) => item);
};

export { getAKEventWithDetailTime };

import dayjs from 'dayjs';
import { TIME_FORMAT } from '@/common';
import { SnowBreakData, SnowBreakListData } from './DataType';

const matchTime = (html: string, timeCalibrationVal: number) => {
	let reg = /\d{1,2}月\d{1,2}日.+-.*\d{1,2}月\d{1,2}日\s*\d{2}:\d{2}/gm;
	let sec_reg = /\d{1,2}月\d{1,2}日\s*(\d{1,2}:\d{1,2})?/g;
	const publishTime = dayjs(timeCalibrationVal);
	return html
		.match(reg)
		?.map((time) => time.match(sec_reg))
		.filter((item) => !!item)
		.map((arr) => {
			let [start_time, end_time] = arr.map((time) => {
				if (!time.includes(':')) {
					time += ' 04:00';
				}
				let tmp = dayjs(time, 'M D HH:mm', 'zh-cn').year(publishTime.year());
				if (publishTime.diff(tmp, 'month') > 2) {
					tmp = tmp.add(1, 'year');
				}
				return tmp;
			});
			if (start_time.isAfter(end_time)) {
				end_time = end_time.add(1, 'year');
			}
			return {
				start_time: start_time.format(TIME_FORMAT),
				end_time: end_time.format(TIME_FORMAT),
			};
		});
};

const getSnowBreakEventData = async (eventsUrl: string) => {
	const tmp = await fetch(eventsUrl);
	const list = ((await tmp.json()) as SnowBreakListData).data.list;
	const urls = list.map(({ catid, id }) => `https://www.cbjq.com/api.php?op=search_api&action=get_article_detail&catid=${catid}&id=${id}`);
	const res = await Promise.all(
		urls.map(async (url) => {
			const res = await fetch(url);
			const { data } = (await res.json()) as SnowBreakData;
			return data[0];
		})
	);
	const data = res
		.map(({ content, url, inputtime }, i) => {
			let publishTime = inputtime.length === 10 ? +inputtime * 1000 : +inputtime;
			const times = matchTime(content, publishTime);
			if (!times) return;
			return {
				...list[i],
				...times[0],
				times: times.length > 1,
				publishTime: dayjs(publishTime).format(TIME_FORMAT),
				linkUrl: url,
				banner: list[i].thumb,
			};
		})
		.filter((item) => !!item);
	return data;
};

export { getSnowBreakEventData };

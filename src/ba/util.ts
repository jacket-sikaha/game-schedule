import dayjs from 'dayjs';
import { BAData } from './DataType';
import { TIME_FORMAT } from '@/common';

const filterKeys = ['活动时间'];
export const handleBAData = (data: BAData) => {
	return data.data.rows
		.filter((item) => item.type !== '2' || filterKeys.includes(item.content))
		.map(({ id, publishTime, content, description, ...arg }) => {
			const times = matchTime(content, publishTime);
			if (!times) return;
			return {
				id,
				...arg,
				...times[0],
				publishTime: dayjs(publishTime).format(TIME_FORMAT),
				times,
				linkUrl: `https://bluearchive-cn.com/news/${id}`,
			};
		})
		.filter((item) => !!item);
};

const matchTime = (html: string, timeCalibrationVal: number) => {
	let reg = /\d{2}月\d{2}日.+~.+\d{2}月\d{2}日\s+\d{2}:\d{2}/gm;
	let sec_reg = /\d{2}月\d{2}日\s+(\d{2}:\d{2})?/g;
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
				let tmp = dayjs(time, 'MM DD HH:mm', 'zh-cn').year(publishTime.year());
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

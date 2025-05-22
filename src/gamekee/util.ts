import dayjs from 'dayjs';
import { CalendarActivityResult, GamekeeData } from './DataType';

export const getShanghaiDate = (date?: dayjs.ConfigType) => dayjs(date).tz('Asia/Shanghai');

export const handleGamekeeEvent = (data: GamekeeData['data']): CalendarActivityResult['data'] => {
	return data.map(({ picture, big_picture, link_url, begin_at, end_at, ...item }) => {
		return {
			...item,
			start_time: dayjs(begin_at * 1000).format('YYYY-MM-DD HH:mm:ss'),
			end_time: dayjs(end_at * 1000).format('YYYY-MM-DD HH:mm:ss'),
			banner: big_picture || picture,
			linkUrl: link_url,
		};
	});
};

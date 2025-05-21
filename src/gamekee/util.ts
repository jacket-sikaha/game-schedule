import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin
import { CalendarActivityResult, GamekeeData } from './DataType';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getShanghaiDate = (date?: dayjs.ConfigType) => dayjs(date).tz('Asia/Shanghai');

export const handleGamekeeEvent = (data: GamekeeData['data']): CalendarActivityResult['data'] => {
	return data.map(({ picture, link_url, begin_at, end_at, ...item }) => {
		return {
			...item,
			start_time: getShanghaiDate(begin_at * 1000).format('YYYY-MM-DD HH:mm:ss'),
			end_time: getShanghaiDate(end_at * 1000).format('YYYY-MM-DD HH:mm:ss'),
			banner: picture,
			linkUrl: link_url,
		};
	});
};

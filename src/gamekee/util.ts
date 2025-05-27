import dayjs from 'dayjs';
import { GamekeeData } from './DataType';
import { CalendarActivityResult } from '@/common';

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

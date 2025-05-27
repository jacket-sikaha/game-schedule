import dayjs from 'dayjs';

export declare interface CalendarActivityResult {
	code: number;
	msg?: string;
	data: {
		id: number | string;
		title?: string;
		start_time: string;
		end_time: string;
		banner?: string;
		content?: string;
		range?: string;
		isEnd?: boolean;
		linkUrl?: string;
		[key: string]: any;
	}[];
}

export const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

export const getShanghaiDate = (date?: dayjs.ConfigType) => dayjs(date).tz('Asia/Shanghai');

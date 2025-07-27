import { RouterType } from 'itty-router';
import { router } from './router';
import customParseFormat from 'dayjs/plugin/customParseFormat'; // ES 2015
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Shanghai');

export interface Env2 extends Env {
	router?: RouterType;
}

console.log('game-events-calendar-backend is running...');

export default router satisfies ExportedHandler<Env>;

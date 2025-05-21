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

export declare interface GamekeeData {
	code: number;
	msg: string;
	data: {
		id: number;
		title: string;
		link_url: string;
		picture: string;
		description: string;
		begin_at: number;
		end_at: number;
		importance: number;
		count_down: number;
		creator_uid: number;
		sort: number;
		pub_area: string;
		tag: string;
		image_list: string;
		big_picture: string;
	}[];
}

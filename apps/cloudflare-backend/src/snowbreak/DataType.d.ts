export declare interface SnowBreakListData {
	code: number;
	msg: string;
	data: {
		list: { id: number; catid: string; title: string; url: string; thumb: string; inputtime: string }[];
		total: number;
	};
}

export declare interface SnowBreakData {
	code: number;
	msg: string;
	data: {
		id: number;
		title: string;
		content: string;
		url: string;
		inputtime: string;
		description: string;
	}[];
}

export declare interface AKData {
	data: {
		list: AKEventData[];
		popup: {
			defaultPopup: string;
		};
	};
}
export declare interface AKEventData {
	id: number;
	cid: string;
	title: string;
	header: string;
	category: 1 | 2 | 4;
	start_time: string;
	end_time: string;
	banner?: string;
	jumpLink?: string;
	content: string;
}

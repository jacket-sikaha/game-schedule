export declare interface UmamusumeNewsItem {
	id: number;
	title: string;
	content: string;
	typeId: number;
	createTime?: string;
	modifyTime?: string;
	displayTime?: string;
}

export declare interface UmamusumeNewsResponse {
	code: number;
	totalNum: number;
	pageNo: number;
	data: UmamusumeNewsItem[];
}

export declare interface UmamusumeNewsDetailResponse {
	code: number;
	data: UmamusumeNewsItem;
}

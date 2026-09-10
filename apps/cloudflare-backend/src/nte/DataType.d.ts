// 塔吉多（Hotta Studio 官方社区）getOfficialPostList 接口返回类型
// https://bbs-api.tajiduo.com/bbs/wapi/getOfficialPostList?columnId=4&count=20&version=0&officialType=1

export interface TajiduoImage {
	height: number;
	width: number;
	url: string;
}

export interface TajiduoVod {
	cover: string;
	duration: number;
	url: string;
}

export interface TajiduoPost {
	postId: number;
	uid: number;
	type: number; // 1 = 图文，3 = 视频
	subject: string;
	content: string;
	createTime: number;
	sendTime: number;
	images: TajiduoImage[];
	vods: TajiduoVod[];
	isDelete: boolean;
}

export interface TajiduoOfficialPostListData {
	column: {
		id: number;
		columnName: string;
		communityId: number;
	};
	hasMore: boolean;
	page: number;
	posts: TajiduoPost[];
	/** 下一页游标（= 本页最后一帖的 sendTime） */
	version: number;
}

export interface TajiduoResponse {
	code: number;
	msg: string;
	ok: boolean;
	data: TajiduoOfficialPostListData;
}

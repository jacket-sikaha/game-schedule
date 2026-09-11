// 绝区零（Zenless Zone Zero）国服游戏内公告 getAnnList 接口返回类型
// https://announcement-api.mihoyo.com/common/nap_cn/announcement/api/getAnnList?game=nap&game_biz=nap_cn&lang=zh-cn&bundle_id=nap_cn&channel_id=1&level=60&platform=pc&region=prod_gf_cn&uid=10000000

export interface ZzzAnnItem {
	ann_id: number;
	/** 含 HTML 标签的标题，如 <p style="...">「全新放送」活动说明</p> */
	title: string;
	subtitle: string;
	/** 文字公告的 banner 图 */
	banner: string;
	tag_label: string; // 重要公告 / 常规公告 / 活动公告 / 福利活动 / 社群公告
	type_label: string; // 游戏公告 / 丽都资讯
	/** YYYY-MM-DD HH:mm:ss（UTC+8，响应 timezone=8） */
	start_time: string;
	end_time: string;
}

/** data.list 中的分组（type_id 3=游戏公告 4=活动公告） */
export interface ZzzAnnGroup {
	list: ZzzAnnItem[];
	type_id: number;
	type_label: string;
}

/** data.pic_list 图文条目（丽都资讯），多一个 img 字段 */
export interface ZzzAnnPicItem extends ZzzAnnItem {
	/** pic_type 1=轮播大图（无标题） 2=列表卡片 */
	pic_type: number;
	img: string;
}

export interface ZzzAnnPicTypeGroup {
	list: ZzzAnnPicItem[];
	pic_type: number;
}

export interface ZzzAnnPicList {
	type_list: ZzzAnnPicTypeGroup[];
	type_id: number;
	type_label: string;
}

export interface ZzzAnnListData {
	list: ZzzAnnGroup[];
	pic_list: ZzzAnnPicList[];
	timezone: number;
}

export interface ZzzAnnListResponse {
	retcode: number;
	message: string;
	data: ZzzAnnListData;
}

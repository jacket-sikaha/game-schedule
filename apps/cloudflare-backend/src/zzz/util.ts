import { TIME_FORMAT } from '@/common';
import dayjs from 'dayjs';
import { ZzzAnnItem, ZzzAnnListResponse, ZzzAnnPicItem } from './DataType';

// 常驻公告（防沉迷、公平运营声明、官方工具一览等）展示窗口以年计，超过该天数即视为常驻公告过滤掉
const PERMANENT_NOTICE_DAYS = 100;

/** 去掉 title 里的 HTML 标签（<p style="...">xxx</p>） */
export const stripHtml = (html: string): string =>
	html
		.replace(/<[^>]*>/g, '')
		.replace(/&amp;/g, '&')
		.trim();

/** 常驻公告判定：展示窗口超过 PERMANENT_NOTICE_DAYS */
const isPermanentNotice = (item: ZzzAnnItem): boolean => {
	const start = dayjs(item.start_time);
	const end = dayjs(item.end_time);
	if (!start.isValid() || !end.isValid()) return true;
	return end.diff(start, 'day') > PERMANENT_NOTICE_DAYS;
};

const toCalendarActivity = (item: ZzzAnnItem | ZzzAnnPicItem, banner: string) => ({
	id: item.ann_id,
	title: stripHtml(item.title || item.subtitle),
	start_time: dayjs(item.start_time).format(TIME_FORMAT),
	end_time: dayjs(item.end_time).format(TIME_FORMAT),
	banner,
	tag: item.tag_label || item.type_label,
});

/**
 * 处理绝区零公告列表：
 * - data.list：文字公告（游戏公告）
 * - data.pic_list：「丽都资讯」图文区，pic_type=2 的卡片条目（卡池/活动/剧情），pic_type=1 为无标题轮播大图，跳过
 * - 过滤常驻公告（展示窗口 > 100 天）与空标题条目
 */
export const handleZzzData = (res: ZzzAnnListResponse) => {
	const textItems = res.data.list.flatMap((group) => group.list);
	const picItems = res.data.pic_list.flatMap((picList) =>
		picList.type_list.filter((typeGroup) => typeGroup.pic_type === 2).flatMap((typeGroup) => typeGroup.list),
	);

	const seen = new Set<number>();
	return [...textItems, ...picItems]
		.filter((item) => {
			const title = stripHtml(item.title || item.subtitle);
			if (!title) return false; // 轮播大图等无标题条目
			if (seen.has(item.ann_id)) return false; // 文字区与图文区可能重复
			seen.add(item.ann_id);
			return !isPermanentNotice(item);
		})
		.map((item) => toCalendarActivity(item, item.banner || ('img' in item ? item.img : '') || ''))
		.sort((a, b) => dayjs(b.start_time).unix() - dayjs(a.start_time).unix());
};

/**
 * 拉取绝区零游戏内公告并解析为日历活动
 */
export const getZzzEventData = async (apiUrl: string) => {
	const res = await fetch(apiUrl);
	if (!res.ok) throw new Error(`ZZZ api request failed: ${res.status}`);
	const json = (await res.json()) as ZzzAnnListResponse;
	if (json.retcode !== 0) throw new Error(`ZZZ api error: ${json.message}`);
	return handleZzzData(json);
};

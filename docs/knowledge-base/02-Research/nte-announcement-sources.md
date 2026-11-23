---
title: 异环（Neverness to Everness）公告与活动数据源调研
tags:
  - research
  - nte
  - data-source
created: 2026-09-11
updated: 2026-11-21
---

# 异环（Neverness to Everness）公告/活动数据源调研

> 调研时间：2026-09。结论：**无公开 JSON 公告 API**，官网为静态 HTML；官方社区「塔吉多」为 SPA，存在后端 API（`bbs-api.tajiduo.com`，路径待抓包确认）。

## 一、官网静态页（首选，直接可抓）

### 国服 `yh.wanmei.com`（Hotta Studio / 完美世界）
| 分类 | 列表页 | 分页 |
|---|---|---|
| 综合 | `/news/index.html` | `index1.html`… |
| 新闻 | `/news/gamenews/index.html` | 同上 |
| 公告 | `/news/gamebroad/index.html` | 同上 |
| 活动 | `/news/gameevent/index.html` | `index1`~`index3.html` |

- 移动端镜像 `/m/news/...`（DOM 更精简，推荐解析）
- 文章 URL：`/news/{cat}/{yyyymmdd}/{id}.html`，id 为递增数字，可作去重键
- 列表项含：标题 / 摘要 / 日期 / 分类标签
- 公告正文时间格式：「9月3日06:00 - 11:00」，可复用 `snowbreak/util.ts` 的 `matchTime` 思路

### 国际/多语言 `nte.perfectworld.com`
- 列表 `/cn/article/news/index.html`，分页至 `index21.html`
- 分类 `gamenews` / `gamebroad`，文章 `/cn/article/news/{cat}/{yyyymmdd}/{id}.html`

### 繁中服（艾玩天地）`nte.iwplay.com.tw`
- 列表 `/news/list_1.html`…`list_N.html`，分类：最新/新聞/活動/系統
- 文章 `/news/view/{yyyymmdd}/{8位hash}.html`
- 摘要最完整（维护公告常直接含起止时间）

## 二、官方社区「塔吉多」（tajiduo.com）✅ 已实现接入
- Hotta Studio 官方社区 APP（原完美游戏社区异环板块 2026-04 迁入）
- **官方资讯 JSON API（已确认，免登录）**：
  `GET https://bbs-api.tajiduo.com/bbs/wapi/getOfficialPostList?columnId=4&count=20&version=0&officialType=1`
  - `columnId=4` = 异环版块（communityId=2，gameId=1257）的「官方资讯」栏目
  - 返回 `data.posts[]`：`postId / subject / content / images[] / vods[] / sendTime / uid`
  - 帖子链接：`https://www.tajiduo.com/bbs/index.html#/post?postId={postId}`
  - 官方账号 UID `10100006`（officialMaster=true）；栏目全为官方帖，无需再按 uid 过滤
  - 活动帖正文含 `▸活动时间：2026/09/04 5:00:00 - 2026/09/18 4:59:59`，也有简写格式 `▸活动时间：8月13日版本更新后 - 9月24日05:59`（年份按 sendTime 推断）
  - **分页（已实测）**：游标式，响应 `data.version`（= 本页最后一帖 sendTime）作为下一页 `version` 参数；`hasMore` 标记是否有更多
  - **活动时间格式（遍历 300 帖实测，共 8 种写法，`matchEventTime` 已全覆盖）**：
    1. `▸活动时间：2026/09/04 5:00:00 - 2026/09/18 4:59:59`（带秒，环线活动主力格式）
    2. `▸活动时间：2026/08/03 05:00 - 2026/08/3 05:59`（无秒，日不补零）
    3. `▸活动时间：8月13日版本更新后 - 9月24日05:59`（简写无年份，盲盒帖；也有无空格连字符变体）
    4. `▼ 活动时间` 值在下一行：`1.2版本更新后～2026年8月13日 05:59:59（UTC+8）`
    5. `活动时间：4 月 23 日～4 月 29 日 每日10:30-18:00`（带空格 + 每日时段，线下活动）
    6. `活动时间：2026年4月8日~4月20日`（年仅一次、无时刻，联动门店）
    7. `活动时间：即日起至 2026 年 4 月 22 日 23:59`（起点=发帖时间）
    8. `活动时间：2025.12.23 9:00 - 2026.1.23 11:00`（点号分隔、跨年）
  - 解析策略（**当前实现只处理自带完整年份的格式**，跨年由日期本身表达，不做年份推断）：仅识别 `活动时间` 关键词行；支持 A（带秒）/ B（无秒）/ A变体（`2026/07/23 版本更新后 - 2026/08/13 05:59:59`，起点默认 05:00）/ H（点号日期，规范化后同 A/B）；C/D/E/F/G 简写格式与 测试/展会/上架 关键词主动放弃，返回 null
  - 已知盲区：版本「活动日历」帖的时间信息在长图里（如 postId 436764），文本无法提取，需官网源或 OCR 补充
- 静态资源：`webstatic.tajiduo.com`、图床 `bbs-upload.tajiduo.com`
- 实现：`apps/cloudflare-backend/src/nte/`（DataType.d.ts + util.ts），路由 `GET /nte`，env `VITE_NTE_API`

## 三、游戏内公告 CDN（线索，未确认）
- 发现 OSS 桶 `serverlist-yh.wmupd.com`（存在，`/notice_test5/` 路径 404 NoSuchKey）
- 完美系游戏常用该域下发游戏内 notice，具体 key 需抓包客户端确认

## 四、Wiki / 第三方
- **BWIKI**：`https://wiki.biligame.com/yh/` —— MediaWiki，**有标准 API**：`/yh/api.php?action=query&...&format=json`（已实测可用）
- **GameKee**：`https://www.gamekee.com/yh/` —— 项目已有 `src/gamekee` 模块可复用其 API 模式
- 维基百科词条（仅元信息，无活动价值）

## 五、接入建议
1. 新增 `apps/cloudflare-backend/src/nte/`：`DataType.d.ts` + `util.ts`
2. 抓 `yh.wanmei.com/m/news/gameevent/` + `gamebroad/` 列表（HTMLRewriter/正则）
3. 详情页正文跑 `matchTime` 提取活动起止
4. 后续可选：抓包确认 `bbs-api.tajiduo.com` 端点后接入塔吉多官方资讯流

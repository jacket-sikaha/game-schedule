---
title: 洛克王国：世界数据源调研
tags:
  - research
  - roco-kingdom-world
  - data-source
created: 2026-11-21
updated: 2026-11-21
---

# 洛克王国：世界数据源调研

> 调研时间：2026-11-21。结论：**官网存在官方接口，但目前未发现可直接返回游戏活动日历的公开 JSON 接口**。已确认的接口主要返回新闻/图片素材，官网“活动日历”模块本身也主要由静态图片承载。

## 官方站点

- 官网：<https://rocom.qq.com/>
- 官网首页源码中的关键标识：`serviceId=467`
- “活动日历”是官网导航项，但不是普通链接；页面主体大量使用图片和轮播组件展示内容。

## 已确认接口

### 官网内容接口

```text
https://apps.game.qq.com/cmc/cross?serviceId=467&tagids=135126&typeids=1&r1=v4Data&source=web_pc
```

实测返回 JSON，免登录。字段包括：

- `sTitle`：标题
- `iNewsId` / `iId`：内容 ID
- `sCreated` / `sIdxTime`：时间
- `sIMG` / `sCoverList`：封面图
- `sTagInfoList`：标签信息

但该接口当前返回的是资质、备案和版权信息，不是游戏活动。

### 新闻搜索接口

```text
https://apps.game.qq.com/wmp/v3.1/?p0=467&p1=searchNewsKeywordsList&page=1&pagesize=20&order=sIdxTime&r0=script&r1=NewsObj8946653122686579&type=iTag&id=142376&source=web_pc
```

实测免登录返回 JSONP，当前 `id=142376` 只有一条“皮卡时装PC”记录。尝试改为 `id=142377` 时能取到时装素材列表，说明该接口按 tag 检索内容。

## 活动日历问题

官网存在“活动日历”导航，但页面结构显示：

- 主体内容是图片和轮播，不是结构化列表。
- 前端脚本没有直接暴露独立的“活动日历 JSON”请求。
- 已确认的 `apps.game.qq.com` 接口可按 tag 取素材，但未找到活动日历专用 tag 或结构化活动字段。

## 可行接入方向

### BWiki 结构化数据源（推荐调研结论）

2026-11-23 补充调研发现，`wiki.biligame.com/nrc` 是目前唯一可靠的第三方结构化来源。

MediaWiki API 免登录可用：

```text
https://wiki.biligame.com/nrc/api.php
```

关键数据模块：

| 模块 | 作用 |
|---|---|
| `Module:Notices/data/Catalog` | 公告目录、来源、标题、封面、发布时间、关联活动 |
| `Module:Notices/data/ActivityLinks` | 活动与公告页面的关联关系 |
| `Module:Notices/data/Bodies` | 公告正文内容 |
| `Module:Notices/data/Index` | 公告顺序与页面标题索引 |
| `Module:Notices/data/Config` | 分类和月份配置 |

`Catalog` 中部分公告带有 `activities` 字段，直接包含结构化活动数据：

```text
title
start
end
id
page_title
series_id
```

示例活动：

```text
豆丁鱼大量出没
start: 2026-09-04 04:00:00
end:   2026-09-07 03:59:59
```

读取示例：

```text
https://wiki.biligame.com/nrc/api.php?action=query&format=json&prop=revisions&rvprop=content&rvlimit=1&rvslots=main&titles=Module:Notices/data/Catalog
```

优点：

- 免登录、标准 JSON 响应。
- 数据来自官方公告和官方小程序，来源可靠。
- `start` / `end` 已结构化，不需要从正文里解析时间。
- 页面更新到 2026-11-17，说明站点仍在维护。

限制：

- 这是玩家维护的第三方 Wiki，不是官方 API。
- `activities` 字段只覆盖部分公告，当前能解析出约 15 条活动。
- 最新结构化活动只到 2026-11-06，11 月中旬以后的公告尚未补全 `activities`。
- 需要 Lua 表解析，比普通 JSON API 多一层转换。
- 长期稳定性取决于 BWiki 维护者。

### 其他候选

`https://www.rocomwiki.com/updates` 声称“每小时同步”，但当前公告来源、活动条目、快照数均为 0，暂不可用。

GameKee 和游侠网能找到活动页面，但未发现公开结构化 API；百度搜索结果中的 BWiki 活动页实际由上述 MediaWiki 数据模块渲染。

### 推荐策略

1. 以 BWiki `Catalog` 的 `activities` 字段作为首选数据源。
2. 对缺失 `activities` 的最新公告，按标题关键词筛出活动预告，再从 `Bodies` 或官方 `official_url` 补充解析。
3. 解析失败时降级为公告日事件。
4. 对 BWiki 的数据保留上游 `source_id` / `id`，便于追踪来源。

### 旧结论

官方站点仍无直接可用的活动日历 JSON。此前只确认官网新闻/内容接口，活动日历本体仍以静态图片为主。

## 结论

**建议接入，但以 BWiki 结构化数据为主要来源。** 官方接口不足时，BWiki 是当前最可靠的第三方方案。需要注意它覆盖不完整，不能只依赖 `activities` 字段。

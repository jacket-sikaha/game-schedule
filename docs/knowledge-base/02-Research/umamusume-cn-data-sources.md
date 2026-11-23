---
title: 闪耀！优俊少女（赛马娘国服）数据源调研
tags:
  - research
  - umamusume
  - biligame
  - data-source
created: 2026-11-21
updated: 2026-11-21
---

# 闪耀！优俊少女（赛马娘国服）数据源调研

> 调研时间：2026-11-21。结论：**存在官方免登录 JSON 接口，可获取公告/新闻/活动列表和详情；适合接入活动日历，但需要从活动正文解析起止时间。**

## 官方站点

- 官网：<https://game.bilibili.com/pd/>
- 新闻页：<https://game.bilibili.com/pd/news/>
- 官网 HTML 中的游戏 ID：`game_base_id=107117`

## 官方列表接口

```text
https://api.biligame.com/news/list.action?gameExtensionId=1006&positionId=2&pageNum=1&pageSize=20&isNew=1
```

关键参数：

| 参数 | 说明 |
|---|---|
| `gameExtensionId=1006` | 闪耀！优俊少女的官方列表 ID |
| `positionId=2` | 官网新闻组件使用的位置 ID |
| `pageNum` | 页码 |
| `pageSize` | 每页数量 |
| `isNew=1` | 最新优先 |
| `typeId` | 可选分类过滤 |

分类 `typeId`：

| typeId | 分类 |
|---|---|
| `1` | 公告 |
| `2` | 新闻 |
| `4` | 活动 |
| `5` | 攻略 |

实测返回 JSON，免登录。字段包括：

- `id`：公告 ID，稳定，可用于去重和详情请求。
- `title`：标题。
- `typeId`：分类。
- `createTime` / `modifyTime`：创建和修改时间。
- `displayTime`：部分公告有展示时间。
- `content`：列表页返回的正文片段。
- `totalNum`：总数。
- `pageNo`：页码。

### 分类示例

```text
https://api.biligame.com/news/list.action?gameExtensionId=1006&positionId=2&pageNum=1&pageSize=20&typeId=4
```

实测 `typeId=4` 只返回官方标记为“活动”的历史分类，共 13 条；当前很多限时活动发布在 `typeId=1` 公告分类下，例如“剧情活动”“招募开放”“碎片追加活动”。如果目标是活动日历，建议拉取最新公告并按标题/正文识别活动，而不是只依赖 `typeId=4`。

## 常见错误

不要使用下面这种写法：

```text
game_base_id=107117&page=1&pagesize=20&typeId=4
```

原因：

1. `page` / `pagesize` 是无效参数名，接口实际使用 `pageNum` / `pageSize`；错误参数会被忽略，返回始终是第 1 页。
2. `game_base_id` 不是列表接口要的游戏标识；正确标识是 `gameExtensionId=1006`。
3. 使用 `game_base_id` 会取到另一批旧数据，因此看起来全是 2022 年内容。

## 官方详情接口

```text
https://api.biligame.com/news/{id}.action
```

示例：

```text
https://api.biligame.com/news/18012.action
```

返回字段包括：

- `data.id`
- `data.title`
- `data.content`：完整 HTML 正文
- `data.author`
- `data.site`
- `data.typeId`
- `data.modifyTime`
- `data.displayTime`
- `gameInfo.website`
- `gameInfo.forum`

## 活动日历可行性

优点：

- 官方 JSON，免登录。
- 有稳定 `id`，可做去重键。
- 官网实际把大量当前活动发布在公告分类，列表可按时间最新优先返回。
- 列表和详情都有正文内容，可解析“活动时间”。

限制：

- 列表接口没有独立的结构化 `startTime` / `endTime` 字段。
- 活动起止时间埋在正文 HTML 里，格式不完全统一。
- 需要按“活动时间”“更新后”“04:00”等文案规则解析。

## 接入建议

1. 以 `gameExtensionId=1006&positionId=2&pageNum=1&pageSize=20&isNew=1` 拉取最新公告。
2. 用 `id` 作为稳定去重键。
3. 请求详情接口获取完整正文。
4. 从 `content` 中解析“活动时间”段落。
5. 不只依赖 `typeId=4`，结合标题和正文识别实际活动。
6. 解析失败时降级为“公告日事件”，只展示发布时间和标题，不硬猜起止时间。

## 结论

**赛马娘国服适合接入。** 官方接口稳定、免登录、分类明确；主要工程量在活动时间解析，而不是数据获取。

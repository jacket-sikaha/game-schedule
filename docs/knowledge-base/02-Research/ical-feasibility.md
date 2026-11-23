---
title: 用 Cloudflare Worker 做 iCal(.ics) 订阅的可行性分析
tags:
  - research
  - cloudflare-workers
  - ical
created: 2026-10-05
updated: 2026-11-21
---

# 用 Cloudflare Worker 做 iCal(.ics) 订阅 —— 可行性分析

> 分析对象：Game-Events-Calendar（`apps/cloudflare-backend` + `apps/web-frontend`）
> 分析时间：2026-10-05
> 结论：**可行，但不能"在请求里现抓现拼"。必须走「定时预生成 + 缓存直出」架构。**
> 本文所有平台限制均引自 Cloudflare 官方文档，客户端行为引自 Apple / Google / Microsoft 官方文档，代码结论均在本仓库实测。

---

## 0. 一句话结论

用 CF Worker 生成并托管 `.ics` 订阅源，**协议层完全没有障碍**（本项目 40 行就能手写一个合规生成器，实测已通过第三方解析器校验）；真正的限制不在"能不能生成"，而在于：

1. **Free 套餐 10ms CPU / 50 子请求的额度，扛不住"一个订阅请求 = 现抓 13 个游戏"**；
2. **本项目上游数据存在会直接破坏日历的缺陷**（UID 不稳定、id 重复、时间字段畸形、线上 9/17 路由 500）；
3. **订阅的刷新权在客户端手里**，你无法推送 → 反而说明"实时生成"没有意义。

因此推荐架构是：**Cron 定时抓取 → 落 KV/R2 → `/ics` 端点只读缓存直出**。这一条路在 Free 套餐下也能跑。

---

## 1. 平台侧：Cloudflare Workers 的硬约束（官方文档）

来源：<https://developers.cloudflare.com/workers/platform/limits/>

| 项目 | Workers Free | Workers Paid |
| --- | --- | --- |
| CPU 时间 / HTTP 请求 | **10 ms** | 5 min（默认 30 s） |
| CPU 时间 / Cron 触发 | **10 ms** | 30 s（<1h 间隔）/ 15 min（≥1h 间隔） |
| 子请求数 / 请求 | **50** | 10,000 |
| 同时出站连接数 | 6 | 6 |
| Cron Triggers / 账号 | 5 | 250 |
| 每日请求数 | 100,000 | 不限 |
| 响应体大小 | 无硬限制 | 无硬限制 |
| 内存 | 128 MB | 128 MB |

关键补充：

- **等待网络不算 CPU 时间**（官方原文：*Waiting on network requests (such as fetch() calls, KV reads, or database queries) does not count toward CPU time.*）——这对本项目是重大利好：抓取本身不烧 CPU，**解析 HTML/JSON 才烧**。
- 官方给出的参考值：平均 Worker 约 **2.2 ms** CPU/请求，"解析大 payload" 的偏重负载约 **10–20 ms**。
- Cache API（`caches.default`）**是 per-datacenter 的，不跨数据中心复制**（<https://developers.cloudflare.com/workers/runtime-apis/cache/>）。
- 新的 **Workers Cache**（区别于 Cache API）让 CF 直接回缓存、**不执行 Worker 代码**，按 `Cache-Control` 生效，且不依赖 zone 配置：<https://developers.cloudflare.com/workers/cache/>
- KV：读 10 万/日（Free）、**单 value 上限 25 MiB**、同 key 写入 1 次/秒：<https://developers.cloudflare.com/kv/platform/limits/>
- Cron Triggers：**Free 套餐可用**（5 个），但**改 cron 配置最长 15 分钟才生效**，且官方明确说是"跑在空闲机器上"：<https://developers.cloudflare.com/workers/configuration/cron-triggers/>

### 1.1 对本项目的直接换算

如果把 `/ics` 做成"请求进来 → 现场聚合 13 个游戏 → 拼 ICS 返回"，成本是：

| 成本项 | 量级 | 对照限额 |
| --- | --- | --- |
| 子请求数 | ≈ **42 + M**（M = 明日方舟分类1公告数），实测口径下 **≈52** | Free 上限 **50** → **已超** |
| 同时连接 | 各模块内部用 `Promise.all` 并发（如 cbjq 一次 16 个、fgo 一次 10 个） | 上限 **6** → 需排队 |
| CPU | JSON.parse（mihoyo 单次 ~1MB）+ cheerio 解析 HTML + 正则 | **远超 10 ms** |
| Wall time | 串行抓 13 个游戏，单请求可能 5–20 s | 日历客户端抓取超时会直接失败 |

> 子请求口径来自各模块的实际 fetch 次数：`/fgo` = 1 列表 + N 详情；`/cbjq` = 1 列表 + 16 详情；`/nte` = 最多 3 页游标；`/ak` = 1 列表 + M 详情；`/mc` = 2。

---

## 2. 协议侧：RFC 5545 与订阅型日历（实测已验证）

### 2.1 硬性规则

来源：RFC 5545 §3.1（<https://datatracker.ietf.org/doc/html/rfc5545#section-3.1>）

- 行分隔**必须是 CRLF**（CR+LF）。
- 内容行 **不应超过 75 octets**，超出须折叠：插入 CRLF + 一个空格，展开时去掉。
- 折叠点**可能落在 UTF-8 多字节序列中间**，RFC 专门提示解析器要正确还原 → 生成端必须**按字节数、按码点切分**，不能按字符数盲切。
- TEXT 值需转义 `\` `;` `,` 和换行。

### 2.2 本仓库原型实测

原型：`docs/research/prototype/`（零依赖，可 `node run.mjs` 复现）

```
══════════ 生成结果 ══════════
输入游戏组     : 6
生成 VEVENT    : 13
跳过(非法/重复): 1          ← /mc 的重复 id 被正确去重
输出字节       : 6135
生成耗时       : 4.54 ms

══════════ UID 稳定性测试 ══════════
两次生成的 UID 序列是否一致: ✅ 一致（订阅不会产生重复事件）
对照(随机 id): ❌ 两次不同 → 订阅客户端每次刷新都会复制出一批新事件

══════════ iCalendar 严格校验报告 ══════════
✅ 错误: 0 —— 通过 RFC 5545 结构性硬性检查
```

再用**独立的第三方解析器 `node-ical@0.27.3`** 解析同一份文件（等价于客户端侧的真实解析行为）：

```
解析成功       : ✅ 无异常
解出 VEVENT    : 13
含乱码(替换字符)的事件: ✅ 0 个，折行未破坏 UTF-8
UID 重复事件           : ✅ 0
时间还原       : 2026-09-29 16:00 (Shanghai) → 2026-09-29T08:00:00.000Z ✅
```

**结论：格式层完全没有问题，40 行代码就能产出客户端接受的 `.ics`，不需要引 `ical-generator` 之类的库。**

### 2.3 反面对照：随手拼字符串会怎样

同一批数据，用"LF 换行 + 不折行 + 本地时间直出 + 随机 UID"的朴素实现：

```
【朴素实现】时间解析失败: 3 条
【朴素实现】解析: ❌ 抛异常 → Invalid time value
【正确实现】时间解析失败: 0 条
【正确实现】首个事件开始: 2026-10-01T04:00:00.000Z  ← 12:00 上海 = 04:00 UTC ✅
```

朴素实现**当场就让解析器抛异常**。所以"能写"和"写对"之间确实有真实的工程量。

---

## 3. 性能侧：生成一份完整日历要烧多少 CPU（实测）

`docs/research/prototype/scale-bench.mjs`（Node 22，单线程，仅测 ICS 生成，不含抓取解析）：

| 场景 | 事件数 | 输出大小 | 平均/事件 | 生成 CPU |
| --- | --- | --- | --- | --- |
| 当前实况 | 130 | 64 KB | 496 B | **6.84 ms** |
| 一年全量 | 520 | 259 KB | 498 B | **26.2 ms** |
| 极端压力 | 2002 | 1002 KB | 501 B | **104 ms** |

**这是全局最关键的一组数字：**

- 光"生成 ICS"这一步，在**当前真实规模下就要 ~6.8 ms**，已经吃掉 Free 套餐 10 ms 预算的 **68%**——而这还没算抓取、JSON.parse 和 cheerio。
- 所以 **Free 套餐下，"请求内实时聚合生成"基本不可能**；Paid 套餐（默认 30 s CPU）则非常宽裕。
- 体积完全不是问题：一年全量才 259 KB，远低于 KV 的 25 MiB 上限，也远低于任何客户端的抓取上限。

---

## 4. 客户端侧：订阅的刷新权不在你手里

| 平台 | 刷新间隔 | 可否调整 |
| --- | --- | --- |
| Apple Calendar (iOS/iPadOS/macOS) | **默认约 1 小时** | 用户可改 5min–never（Apple 支持文档 102301） |
| Google Calendar | **12–24 小时** | ❌ 用户和发布者都无法调整 |
| Outlook / Microsoft 365 | 1–4 小时（最坏 24h） | 有限 |

来源：<https://calfeed.ai/learn/ics-refresh-rate-apple-google>（汇总自 Apple / Google / Microsoft 官方文档）

另外两个实务坑：

- **Google Calendar 的 "From URL" 只能在桌面网页版操作**，移动端 App 里没有入口（Google 官方帮助文档 37100）。→ UI 上必须给出"复制链接，到桌面版添加"的引导。
- Google 对已订阅源的抓取有**自身缓存节流**，社区普遍经验是"改了要等几小时到一天"。想强制刷新只能退订后用 `URL#1`、`URL#2` 重新添加（社区做法，非官方接口）。

**这一条恰恰是"可行性"的救点**：既然最快的客户端（Apple）也是每小时才拉一次，你**根本不需要**实时生成。把生成周期降到 1 小时一次，CPU/子请求压力瞬间消失，而且用户完全无感。

---

## 5. 项目侧：本项目上游数据里会直接破坏日历的缺陷

以下均为**线上实测**（2026-10-05 对 `https://gebc.lee-sikaha.cloudns.ch` 抓取）。

### 5.1 线上 17 条路由中 9 条返回 500

| 状态 | 路由 |
| --- | --- |
| ✅ 200 | `/ak` `/ba` `/fgo` `/fgoproxy` `/genshin` `/mc` `/nte` `/starrail` |
| ❌ 500 (CF Error 1101) | `/todos` `/pcr` `/pns` `/cbjq` `/zzz` `/endfield` `/imgfromhtml` `/ba-jp` `/nikke` |

注意 `/todos`（一行代码、不抓任何上游）和 `/imgfromhtml`（纯本地）**也 500**，说明问题不在"上游被墙"，而更像**响应管线的通用缺陷**。

一个高度吻合的嫌疑点：仓库里**未提交的本地改动**恰好把这段中间件注释掉了：

```diff
-	finally: [corsify],                        // <-- put corsify downstream
-	finally: [corsify, destroyRedisClient],    // <-- put corsify downstream
+	finally: [corsify],
+	// finally: [corsify, destroyRedisClient],
 router
-	.all('*', checkCacheResults)
+	// .all('*', checkCacheResults)
```

而 `destroyRedisClient` 会对**每个响应**执行：

```ts
const data = (await res.clone().json()) as CalendarActivityResult;
```

一旦响应不是 JSON（`/todos` 返回的是纯字符串，`StatusError` 输出的是纯文本），`.json()` 抛错 → `finally` 里抛错 → **整个请求 500**。这与"所有报错路由同时挂掉、纯文本路由也挂掉"的现象一致。（**这是推断，需用 Workers Logs 确认**；但无论成因如何，结论不变：当前"请求内实时抓取"的架构很脆。）

> 对 ICS 的含义：如果把 `/ics` 也做成实时聚合，**它会继承同一套脆弱性**——上游任一游戏改版，整个订阅源就挂，所有订阅者的日历一起变空。

### 5.2 UID 稳定性（订阅型日历的生死线）

| 位置 | 代码 | 后果 |
| --- | --- | --- |
| `src/endfield/index.ts` | `id: Math.random().toString(36)` | **每次生成 id 都变 → 客户端每次刷新复制一整套新事件** |
| `src/kuro-game/util.ts` | `id: entryId ?? dayjs().unix()` | 兜底路径每次时间戳不同 → 同样重复 |
| `src/mc`（实测） | id `1554479052247040000` 出现两次 | 同一份日历内 UID 冲突 → 两个事件被客户端合并成一个 |

原型已实测该对照：

```
两次生成的 UID 序列是否一致: ✅ 一致（用 game:id 确定性 hash）
对照(随机 id): ❌ 两次不同 → eb7086d6-15@... vs e00c3618-15@...
```

**这是接入 ICS 前必须先修的 P0 问题**，改动很小：把 id 换成"确定性 hash(游戏 + 上游 id)"即可。

### 5.3 字段质量问题

| 问题 | 实测样例 | 对 ICS 的影响 |
| --- | --- | --- |
| Banner 协议相对 URL | `/fgo`：`//i0.hdslb.com/bfs/game/....png` | 不补 `https:` → 日历里图片全裂 |
| 结束时间空/缺 | `/genshin` 存在 `banner:""`、部分条目无 `end_time` | `DTEND` 缺失 → 客户端按 0 时长或报错 |
| 结束时间远端占位 | `/ba` id 1943 → `2027-06-10`；`/genshin` → `2027-07-14`；`/starrail` → `2035-06-07` | 日历里出现横跨数年的"长条"，淹没真实活动 |
| 混入非活动条目 | 防沉迷公告、公平运营声明、问卷 | 订阅者日历被噪声刷屏 |
| 接口形状不统一 | `/genshin` `/starrail` 返回**裸对象** `{list:[...]}`，其余是 `{code,data:[...]}` | 聚合层必须写兼容分支（原型已处理） |
| 标题含需转义字符 | 全角/半角逗号、顿号、换行 | 不转义 → 标题被截断 |
| 全角/超长标题 | 原神标题可达 60+ 汉字 | 必须正确按 octets 折行 |

---

## 6. 推荐架构

```
                    ┌──────────────────────────────────────┐
   Cloudflare       │  Worker: scheduled()  Cron            │
   Cron (每小时)  ──▶│  1. 并发抓 13 个游戏（IO 不计 CPU）    │
                    │  2. 解析 → 归一化 → 生成 .ics          │
                    │  3. 写入 KV / R2（单文件 ~260 KB）     │
                    └───────────────┬──────────────────────┘
                                    │ put
                    ┌───────────────▼──────────────────────┐
   日历客户端      │  GET /ics  （读缓存直出，不抓上游）     │
   Apple/Google ──▶│  Content-Type: text/calendar;         │
                    │                charset=utf-8          │
                    │  Cache-Control: public, max-age=1800  │
                    │  ETag / Last-Modified                 │
                    └──────────────────────────────────────┘
```

要点：

1. **生成与读取彻底解耦**。Cron 负责抓（IO 不烧 CPU），`/ics` 只负责吐一个字符串。
2. **按游戏拆分缓存**，而不是一个大文件。每个游戏一个 KV key（`ics:ak`、`ics:nte`…），Cron 里逐游戏更新；某个游戏抓挂了只影响它自己，其余照常。对外提供 `/ics`（全部）和 `/ics?games=ak,nte`（自选）两种。
3. **不要用外部 Redis 做这层缓存**。现在 `src/common/redis.ts` 用 ioredis 连 Redis Labs，且**每次请求新建连接、`destroyRedisClient` 里再断开**；订阅端点会被大量客户端轮询，这条路既慢又脆。KV 是原生绑定、零网络握手。
4. **Free vs Paid 的建议**：
   - Free（10 ms CPU/次）：Cron 里跑 13 个游戏的**解析**很可能超 10 ms → 必须**把 CPU 摊薄**（每次 Cron 只处理 1–2 个游戏，用多个 Cron 触发器错峰，Free 有 5 个）；或者干脆只做"读缓存直出"，抓取放回 Github Actions（仓库已有 `.github/workflows/`）。
   - Paid（$5/月，30 s CPU）：**直接一次性跑完 13 个游戏，毫无压力**。对这个项目来说这是最省心的选择。
5. **`/ics` 必须放在能被日历客户端访问的域名上**。当前 Worker 是 `gebc.lee-sikaha.cloudns.ch`，CORS 白名单只放了 Pages 域名——但**日历客户端不使用 CORS**，只要 URL 公开可达即可。注意 Google 的抓取节点来自 Google 自己的 IP，不要做 IP 限制。
6. **不要给 `.ics` 加 Cloudflare Access / 需要认证**，否则 Google 抓不到。

### 6.1 关键实现清单

| 项 | 做法 |
| --- | --- |
| 换行 | 一律 `\r\n`，文件以 CRLF 结尾 |
| 折行 | 按 **UTF-8 字节** 折，≤75 octets，续行前置一个空格；用 `for...of` 按码点迭代避免切断多字节 |
| 转义 | `\` → `\\`（最先）、`;` → `\;`、`,` → `\,`、换行 → `\n` |
| 时间 | **统一转 UTC 输出 `YYYYMMDDTHHMMSSZ`**，规避各客户端对 `TZID` / `VTIMEZONE` 支持差异（Asia/Shanghai 现无 DST，固定 +8 即可安全换算） |
| UID | `确定性hash(游戏 + 上游id)@域名`，**绝不用随机数/时间戳** |
| DTEND | 必须 > DTSTART；缺失或非法时给兜底（如 +1h），禁止负数时长 |
| DTSTAMP | 每次生成都刷新（这不会导致重复，UID 才是去重键） |
| 图片 | `ATTACH;FMTTYPE=image/jpeg:<url>`（Apple 显示为事件图，Google 忽略但不报错）；URL 必须补全协议 |
| URL 字段 | 事件详情链接放 `URL:` |
| 刷新提示 | 加 `REFRESH-INTERVAL;VALUE=DURATION:PT6H` 与 `X-PUBLISHED-TTL:PT6H`（Apple/Outlook 参考，Google 忽略） |
| 缓存 | 响应带 `ETag` / `Last-Modified`，并设 `Cache-Control: public, max-age=1800` |
| 体积 | 一年全量 ~260 KB，无需分页 |

---

## 7. 结论与工作量评估

**可行性：可行。** 协议层零障碍（原型已通过独立解析器验证），平台层在 Paid 套餐下非常宽裕，Free 套餐需要绕一下。

| 工作项 | 难度 | 说明 |
| --- | --- | --- |
| 写 ICS 生成器（含折行/转义/UTC） | ★★☆ | 约 150 行，零依赖；原型已完成并验证 |
| 修 UID 稳定性（endfield 等） | ★☆☆ | 改 3 处，**前置必做** |
| 修重复 id（/mc） | ★☆☆ | 聚合时按 uid 去重即可 |
| 修线上 9 条 500 路由 | ★★☆ | 独立问题，但**不修则订阅源会一起挂** |
| 加 `scheduled()` + Cron | ★★☆ | 需新增 wrangler `[triggers]`，注意 15 分钟生效延迟 |
| 引入 KV 缓存层 | ★☆☆ | 绑定 + 读写，替代现有外部 Redis 依赖 |
| 前端加"订阅"入口 | ★☆☆ | 给 `webcal://` 链接 + 二维码；注明 Google 需桌面版添加 |
| 过滤非活动条目 | ★★☆ | 防沉迷/公平运营/问卷等要按关键词剔除 |

**最大的两个风险：**
1. **上游数据质量**（UID 不稳定、重复 id、占位时间、噪声条目）—— 这决定用户订阅后的实际体验，比"能不能生成"重要得多；
2. **现有实时抓取架构的脆弱性**（线上 9/17 路由 500）—— 订阅源一旦依赖它，会把这个脆弱性放大给所有订阅者。

**建议的最小可行路径：**
先修 UID 与重复 id → 加 `scheduled()` Cron 每小时跑一次 → 结果落 KV → `/ics` 读 KV 直出并带缓存头 → 前端加订阅入口。先只上 `/ics?games=ak,ba,nte,genshin`（数据质量最好的几个），验证客户端实际刷新行为后再全量铺开。

---

## 附：复现方式

相关复现脚本保存在 `../../research/prototype/`，原始调研数据保存在 `../../research/`。

```bash
cd docs/research/prototype
node run.mjs            # 用真实数据生成 out.ics + UID 稳定性测试
node validate.mjs out.ics   # RFC 5545 严格结构校验
node scale-bench.mjs    # 规模 / CPU 性能测试
# 需联网（第三方解析器验证）：
npm i node-ical --cache ./.npmcache && node parse-check.mjs out.ics
```

产物清单：

| 文件 | 说明 |
| --- | --- |
| `prototype/ics.mjs` | 零依赖 ICS 生成器（折行/转义/UTC/UID） |
| `prototype/validate.mjs` | RFC 5545 严格校验器 |
| `prototype/run.mjs` | 真实数据驱动 + UID 稳定性测试 |
| `prototype/parse-check.mjs` | 用 node-ical 做第三方解析验证 |
| `prototype/naive-vs-correct.mjs` | 朴素实现 vs 正确实现对照 |
| `prototype/scale-bench.mjs` | 规模与 CPU 基准 |
| `prototype/out.ics` | 实际生成物样例 |

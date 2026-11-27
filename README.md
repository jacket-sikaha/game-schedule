# Game Events Calendar

> 多游戏活动日历聚合器。通过 Cloudflare Worker 统一接入游戏官网、Wiki 和社区 API，将活动整理为日历视图展示。

[![demo](https://img.shields.io/badge/demo-online-4FC08D)](https://gameevent-frontend.pages.dev/)

[![DeepWiki Index](https://deepwiki.com/badge.svg)](https://deepwiki.com/jacket-sikaha/game-schedule)

---

## 项目概览

- 前端使用 React + Vite，部署在 Cloudflare Pages。
- 后端使用 Cloudflare Workers，负责 CORS、数据抓取、解析和统一输出。
- 常规游戏由 Worker 直接访问上游接口；FGO、闪耀！优俊少女通过独立的 Vercel Next.js 代理访问 Bilibili，因为部分上游会屏蔽 Cloudflare 出口 IP。
- Worker 使用 Redis 做短时响应缓存，减少重复抓取。
- FGO 和闪耀！优俊少女仍采用“列表 + 详情”的 N+1 抓取方式；上游没有一次性返回完整日程的单接口。
- 当前传输层是 HTTP/JSON，没有使用 gRPC。现有瓶颈主要是上游详情请求数量和冷缓存，而不是 Worker 与 cron 代理之间的序列化方式。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 19、TypeScript、Vite 8 |
| UI | Ant Design 6、MUI 7、TailwindCSS 3 |
| 前端数据 | react-query 3、Axios |
| 路由与日期 | react-router-dom 6、dayjs |
| Worker | Cloudflare Workers、itty-router 5 |
| Worker 缓存 | Redis / ioredis |
| 解析 | cheerio、正则与 HTML 文本提取 |
| cron 代理 | Next.js 16、Vercel Functions |
| 工程化 | pnpm 12、Turborepo、Vitest 4 |
| 部署 | GitHub Actions → Cloudflare Pages；Worker 通过 Wrangler 部署 |

## 架构概览

```text
┌──────────────────────────────────────┐
│ React + Vite SPA                     │
│ Cloudflare Pages                     │
└──────────────────┬───────────────────┘
                   │ HTTPS / JSON
┌──────────────────▼───────────────────┐
│ Cloudflare Worker                     │
│ itty-router + Redis 响应缓存          │
└──────────┬───────────────────┬────────┘
           │                   │
           │ 大部分游戏         │ FGO / 闪耀！优俊少女
           ▼                   ▼
  官方 / Wiki / 社区 API    Vercel Next.js 代理
           │                   │
           │                   ▼
           │             Bilibili API
           │             列表 + 详情接口
           ▼                   │
      统一活动数据格式 ◄────────┘
           │
           ▼
     CalendarActivity[]
```

Vercel cron 代理是独立项目，不在当前 monorepo 内。它存在的原因是 Bilibili 上游对部分 Cloudflare 出口 IP 不友好，不是为了让 Worker 多经过一层无意义的转发。

## 核心设计

### 后端：独立模块与统一输出

每个游戏对应一个独立模块。项目没有用抽象的 TypeScript interface 强制所有模块实现同一套方法，但各模块最终都会返回统一结构，由路由层包装成标准响应：

- **结构化 API 源**，如 PCR、原神、星穹铁道、绝区零、异环：直接调用官方或社区 API，完成字段映射和必要的筛选。
- **HTML/Wiki 内容源**，如蔚蓝档案、尘白禁区、Gamekee 数据源：使用 `cheerio`、HTML 文本提取和正则表达式，从公告内容中提取活动时间、Banner 和详情链接。
- **列表 + 详情源**，如明日方舟、FGO、闪耀！优俊少女：先获取公告列表，再请求候选活动详情，从正文中解析活动时间范围。
- FGO、闪耀！优俊少女的列表和详情请求目前经过 Vercel cron 代理，而不是由 Worker 直接访问 Bilibili。

数据最终统一收敛为 `CalendarActivity` 类型：

```typescript
interface CalendarActivity {
  id: number | string;
  title: string;
  start_time: string;
  end_time: string;
  banner?: string;
  content?: string;
  range?: string;
  isEnd?: boolean;
  linkUrl?: string;
}
```

### 前端：自定义日历组件

日历组件自行实现，未使用第三方日历库，核心包括：

- **层级分配算法**（`levelAssignment`）：按活动开始时间排序，优先复用已经结束的层级，没有可用层级时才新增一行，减少行数膨胀。
- **周视图事件定位**（`calculateEventPosition`）：计算活动在当前周网格中的 `left`（起始列偏移）和 `width`（跨列数），精确渲染时间条。
- **双视图模式**：左侧显示活动概览列表，右侧显示月历和周网格；两侧都支持折叠或展开。
- **已结束活动处理**：概览列表把已结束活动移到后面，并增加删除线和“已结束”标记。
- **图片预览**：使用 Ant Design `Image` 组件展示 Banner，支持点击预览。

### 性能优化

- **Redis 缓存中间件**：Worker 自动按 pathname 检查 Redis；命中则直接返回，未命中时在响应阶段回写缓存，默认 TTL 为 `300s`。
- **详情缓存**：FGO、闪耀！优俊少女的 cron 详情代理缓存期已延长到 `24h`。
- **React.lazy + Suspense**：游戏页面按路由懒加载，减少首屏 JS 体积。
- **Vite Gzip 压缩**：构建产物自动生成 `.gz` 文件，减小传输体积。
- **Edge 部署**：Worker 运行在 Cloudflare 边缘节点，降低接口访问延迟。
- **快速失败**：FGO、闪耀！优俊少女在代理超时时返回 504，前端关闭自动重试并提供手动重新加载。

## 已接入游戏

| 游戏 | 前端路由 | Worker API |
| --- | --- | --- |
| 公主连结 | `/pcr` | `GET /pcr` |
| 原神 | `/` | `GET /genshin` |
| 星穹铁道 | `/starrail` | `GET /starrail` |
| 绝区零 | `/zzz` | `GET /zzz` |
| FGO | `/fgo` | `GET /fgo` |
| 明日方舟 | `/arknights` | `GET /ak` |
| 鸣潮 | `/mc` | `GET /mc` |
| 战双帕弥什 | `/pns` | `GET /pns` |
| 蔚蓝档案（国服） | `/ba` | `GET /ba` |
| 蔚蓝档案（日服） | `/ba-jp` | `GET /ba-jp` |
| NIKKE: 胜利女神（外服） | `/nikke` | `GET /nikke` |
| 尘白禁区 | `/snowbreak` | `GET /cbjq` |
| 明日方舟：终末地 | `/endfield` | `GET /endfield` |
| 异环 | `/nte` | `GET /nte` |
| 闪耀！优俊少女 | `/umamusume` | `GET /umamusume` |

## 功能特性

- [x] 支持 15 个游戏页面：公主连结、原神、星穹铁道、绝区零、FGO、明日方舟、鸣潮、战双帕弥什、蔚蓝档案（国服/日服）、NIKKE、尘白禁区、终末地、异环、闪耀！优俊少女。
- [x] 自动提取和预览活动 Banner。
- [x] 生成活动详情链接。
- [x] 已结束活动自动下沉，并显示删除线和状态。
- [x] 周视图事件颜色区分和网格排布。
- [x] 日历月份切换与周行展开/折叠。
- [x] 活动概览列表折叠。
- [x] 响应式布局（MUI Drawer 侧边栏）。

## 数据格式

常规活动接口统一返回：

```json
{
  "code": 200,
  "data": [
    {
      "id": 10001,
      "title": "活动标题",
      "start_time": "2026-11-26 12:00",
      "end_time": "2026-12-10 03:59",
      "banner": "https://example.com/banner.png",
      "content": "活动说明或时间范围",
      "range": "2026-11-26 12:00 ~ 2026-12-10 03:59",
      "linkUrl": "https://example.com/news/10001"
    }
  ]
}
```

抓取失败时，Worker 通常返回 `500`；上游详情请求超时时，FGO/优俊少女可能返回 `504`，不会伪装成正常的空数组。

## 缓存与超时

### Worker Redis 缓存

- Worker 通过 `checkCacheResults` 按请求 pathname 查询 Redis。
- 命中时直接返回缓存结果；未命中时，在响应完成后写回缓存。
- Redis 默认 TTL 为 `300s`。
- Redis 读取和写入都有 `2s` 超时，Redis 异常不会无限阻塞 Worker。
- 只有正常响应会进入缓存，超时错误不会被缓存。

### 前端错误处理

- FGO 和优俊少女的 Axios 请求超时为 `12s`。
- react-query 对这两个页面设置 `retry: false`，失败后不再自动重复打满冷缓存。
- 页面显示“活动数据获取超时，请稍后重试”和手动“重新加载”按钮。
- 这是目前面对 Vercel 免费版执行时长限制的折中方案：失败快速返回，由用户决定是否重试。

## iCal 订阅

Worker 提供单游戏 `.ics` 订阅入口：

```text
GET /ics/pcr
GET /ics/genshin
GET /ics/starrail
GET /ics/zzz
GET /ics/fgo
GET /ics/ak
GET /ics/mc
GET /ics/pns
GET /ics/ba
GET /ics/ba-jp
GET /ics/nikke
GET /ics/cbjq
GET /ics/endfield
GET /ics/nte
GET /ics/umamusume
```

每个入口只返回对应游戏的日历，不维护总日历。响应类型为 `text/calendar; charset=utf-8`，并通过 Workers Cache 提供 ETag、缓存头；KV 快照带有 `generatedAt` metadata 时还会返回 Last-Modified。

快照保存在 KV：

```text
ics:v1:<game>
```

GitHub Actions 的 [refresh-ical.yml](.github/workflows/refresh-ical.yml) 每 3 小时运行一次，生成脚本位于 `apps/cloudflare-backend/scripts/generate-ics.mjs`。需要在 GitHub 仓库中配置：

| 名称 | 类型 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare 账户 ID |
| `CLOUDFLARE_API_TOKEN` | Secret | 需要 Workers KV Storage Edit 权限 |
| `ICS_KV_NAMESPACE_ID` | Secret | `ICS_KV` 的 namespace ID |
| `ICS_BACKEND_URL` | Repository variable | Worker 入口地址；为空时使用代码中的默认地址 |

手动运行方式：

```bash
cd apps/cloudflare-backend
pnpm ics:refresh
```

如果 KV 未命中，Worker 仍会现场生成并写回，作为 GitHub Actions 失败时的兜底。

## 安装与开发

### 环境要求

- Node.js `>=18`，推荐使用 CI 中的 `20` 或 `22`。
- pnpm `>=12 <13`，仓库使用的 `packageManager` 为 `pnpm@12.21.0`。

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
# 同时启动可用工作区
pnpm dev

# 只启动前端，默认端口 5173
pnpm dev:frontend

# 只启动 Cloudflare Worker
pnpm dev:backend
```

### 构建与部署

```bash
# 构建所有工作区
pnpm build

# 构建前端
pnpm build:frontend

# 对 Worker 执行 dry-run
pnpm --filter @game-calendar/cloudflare-backend build

# 部署 Worker
pnpm build:backend
```

## 项目结构

```text
game-schedule/
├── apps/
│   ├── web-frontend/                 # React + Vite SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── EventCalendar/    # 自定义日历、层级排布和事件定位
│   │   │   │   └── RequestError.tsx  # 请求超时/失败提示
│   │   │   ├── pages/                # 各游戏页面
│   │   │   ├── services/             # Worker API 基础地址
│   │   │   └── utils/                # 菜单、路由、请求工具
│   │   └── vite.config.ts
│   │
│   └── cloudflare-backend/           # Cloudflare Workers API
│       ├── src/
│       │   ├── __tests__/            # 后端 Vitest 测试
│       │   ├── common/               # Redis、时间、稳定 ID 等公共逻辑
│       │   ├── Arknights/            # 明日方舟
│       │   ├── ba/                   # 蔚蓝档案
│       │   ├── endfield/             # 明日方舟：终末地
│       │   ├── fgo/                  # FGO（通过 cron 代理）
│       │   ├── gamekee/              # Gamekee 数据源
│       │   ├── kuro-game/            # 鸣潮、战双
│       │   ├── nte/                  # 异环
│       │   ├── snowbreak/            # 尘白禁区
│       │   ├── umamusume/            # 闪耀！优俊少女（通过 cron 代理）
│       │   ├── zzz/                  # 绝区零
│       │   ├── index.ts              # Worker 入口
│       │   └── router.ts             # 路由、CORS、Redis 中间件
│       ├── scripts/wrangler.mjs
│       ├── vitest.config.ts
│       └── wrangler.toml
│
├── docs/
│   ├── knowledge-base/               # 数据源和解析经验
│   └── research/                     # 技术方案与可行性研究
├── .github/workflows/
│   ├── publish.yml                   # 前端部署到 Cloudflare Pages
│   └── test.yml                      # 后端测试与覆盖率
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 测试

后端使用 Vitest，测试配置位于 `apps/cloudflare-backend/vitest.config.ts`。测试会启用 V8 覆盖率，默认门槛为：

```text
Statements: 60%
Branches:   50%
Functions:  50%
Lines:      60%
```

最近一次本地后端测试结果：

```text
Statements: 86.26%
Branches:   77.69%
Functions:  84.48%
Lines:      87.41%
```

运行后端测试和覆盖率：

```bash
cd apps/cloudflare-backend
pnpm test
```

也可以在根目录单独运行该工作区：

```bash
pnpm turbo run test --filter="@game-calendar/cloudflare-backend"
```

当前前端工作区的 `test` 脚本仍是占位命令，实际的自动化测试主要集中在 Worker 后端。

GitHub Actions 的测试任务在 Node 20 和 Node 22 上运行，并上传覆盖率报告；前端发布任务使用 Node 22，将 `apps/web-frontend/dist` 部署到 Cloudflare Pages。

## 开发记录

- 2026/11 完成 FGO、闪耀！优俊少女的 Vercel cron 代理链路，详情缓存延长到 24 小时。
- 2026/11 增加详情请求主动超时、504 响应和前端手动重试，避免 react-query 自动重试拖长等待。
- 2026/11 增加 FGO/优俊少女标题候选筛选及 cron 聚合接口实验，生产 Worker 尚未切换到 `/events`。
- 2026/9/11 新增绝区零。
- 2026/9/10 接入异环 API。
- 2026/6/5 接入 Vitest 测试和 GitHub Actions 后端测试流水线。
- 2026/6/1 接入明日方舟：终末地。
- 2025/6/3 接入尘白禁区。
- 2025/5/23 接入蔚蓝档案（国服）。
- 2025/5/22 接入蔚蓝档案（日服）和 NIKKE: 胜利女神（外服）。
- 2024/8/13 接入鸣潮、战双帕弥什，支持 Banner 图片预览。
- 2024/7/27 使用 cheerio 提取 FGO Banner 图。
- 2024/2/13 调整日历布局、周视图折叠和侧边栏自适应。

## License

[MIT](./LICENSE)

本项目仅供学习参考使用。活动信息以游戏官方公告为准。

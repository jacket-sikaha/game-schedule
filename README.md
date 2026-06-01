# Game Events Calendar

> 多游戏活动日历聚合器 — 通过代理抓取各手游官网/Wiki 活动数据，以统一日历视图呈现，支持 10+ 款游戏的实时活动追踪。

[![demo](https://img.shields.io/badge/demo-online-4FC08D)](https://gameevent-frontend.pages.dev/)

[![DeepWiki Index](https://deepwiki.com/badge.svg)](https://deepwiki.com/jacket-sikaha/game-schedule)

---

## 技术栈

| 层级           | 技术                                        |
| -------------- | ------------------------------------------- |
| **前端框架**   | React 19 + TypeScript                       |
| **构建工具**   | Vite 8 + Rollup                             |
| **UI 组件库**  | Ant Design 6 + MUI 7                        |
| **样式方案**   | TailwindCSS 3 + Emotion                     |
| **状态/数据**  | react-query + Axios                         |
| **路由**       | react-router-dom 6                          |
| **日期处理**   | dayjs                                       |
| **后端运行时** | Cloudflare Workers (Edge)                   |
| **后端路由**   | itty-router 5                               |
| **缓存层**     | Redis (ioredis)                             |
| **HTML 解析**  | cheerio                                     |
| **包管理**     | pnpm (workspace)                            |
| **构建编排**   | Turborepo                                   |
| **CI/CD**      | GitHub Actions → Cloudflare Pages / Workers |

---

## 核心设计

### 架构概览

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare Workers                 │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐  │
│  │ PCR    │  │ 原神   │  │ FGO    │  │ 明日方舟  │  │
│  │ Module │  │ Module │  │ Module │  │ Module    │  │
│  └───┬────┘  └───┬────┘  └───┬────┘  └─────┬────┘  │
│      └──────┬────┘─────┬─────┘────────┬────┘        │
│             ▼          ▼               ▼             │
│      ┌──────────────────────────────────────┐       │
│      │       统一数据格式 (CalendarActivity) │       │
│      └──────────────────────────────────────┘       │
│                          │                           │
│                   ┌──────▼──────┐                    │
│                   │  Redis Cache │                    │
│                   └──────┬──────┘                    │
│                          │                           │
└──────────────────────────┼───────────────────────────┘
                           │ HTTP API
┌──────────────────────────┼───────────────────────────┐
│                   ┌──────▼──────┐                    │
│                   │   React App  │                    │
│                   │  (Vite SPA)  │                    │
│                   └──────┬──────┘                    │
│                          │                           │
│                ┌─────────▼─────────┐                 │
│                │  EventCalendar    │                 │
│                │  自定义日历组件    │                 │
│                │  层级排布算法      │                 │
│                └───────────────────┘                 │
│            Cloudflare Pages (Static)                 │
└──────────────────────────────────────────────────────┘
```

### 后端 — 插件式数据接入

每个游戏对应一个独立的 Module，通过实现统一的数据提取接口接入系统：

- **结构化 API 源**（如 PCR、原神、星穹铁道）：直接调用官方/社区 API，做字段映射即可。
- **非结构化 HTML 源**（如 FGO、蔚蓝档案、尘白禁区）：使用 `cheerio` 解析 DOM，配合正则表达式从公告 HTML 中提取活动时间段、Banner 图等关键信息。针对不同网站的 HTML 模板差异，每个游戏模块独立维护解析策略。
- **混合源**（如明日方舟）：先调用列表 API 获取活动入口，再逐一抓取详情页提取多子活动时间。

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
  linkUrl?: string;
}
```

### 前端 — 自定义日历组件

日历组件自行实现，未使用第三方日历库，核心包括：

- **层级分配算法**（`levelAssignment`）：按活动开始时间排序，贪心分配行层级，最大化空间利用率。新活动从高层级往下查找空闲层级插入，避免不必要的行数膨胀。
- **周视图事件定位**（`calculateEventPosition`）：计算每个活动在当前周网格中的 `left`（起始偏移列）和 `width`（跨列数），精确渲染时间条。
- **双视图模式**：左侧为活动概览列表（按进行中 → 已结束排序），右侧为周网格日历视图，支持折叠/展开。
- **图片预览**：集成 Ant Design `Image` 组件，支持 Banner 点击预览。

### 性能优化

- **Redis 缓存中间件**：Backend 中间件自动拦截请求，Redis 命中则直接返回；未命中则在响应后异步回写缓存（TTL: 300s）。避免重复抓取游戏源站。
- **React.lazy + Suspense**：每个游戏页面按路由懒加载，减少首屏 JS 体积。
- **Vite Gzip 压缩**：构建产物自动 `.gz` 压缩，减小传输体积。
- **Edge 部署**：Backend 运行在 Cloudflare Workers 边缘节点，降低数据获取延迟。

---

## 功能特性

- [x] 支持 **10 款游戏** 活动日历展示：公主连结、原神、星穹铁道、FGO、明日方舟、鸣潮、战双帕弥什、蔚蓝档案(国服/日服)、NIKKE、尘白禁区
- [x] 活动 **Banner 图** 提取与预览
- [x] 活动 **详情链接** 跳转
- [x] 已结束活动自动下沉排序
- [x] 周视图事件 **颜色区分** + 网格排布
- [x] 日历月切换
- [x] 响应式布局（MUI Drawer 侧边栏）

---

## 安装与启动

### 前置条件

- Node.js >= 22
- pnpm >= 8

### 安装

```bash
pnpm install
```

### 开发

```bash
# 同时启动前端和后端
pnpm dev

# 仅前端 (port 5173)
pnpm dev:frontend

# 仅后端 (Cloudflare Workers dev)
pnpm dev:backend
```

### 构建

```bash
pnpm build

# 前端构建
pnpm build:frontend

# 后端部署
pnpm build:backend
```

---

## 项目结构

```
game-schedule/
├── apps/
│   ├── web-frontend/                 # React + Vite SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── EventCalendar/    # 自定义日历组件
│   │   │   │       ├── index.tsx     # 日历主组件
│   │   │   │       ├── utils.ts      # 层级排布 & 事件定位算法
│   │   │   │       └── CalendarType.d.ts
│   │   │   ├── pages/                # 各游戏页面（按路由懒加载）
│   │   │   ├── services/             # API 基础配置
│   │   │   ├── utils/                # 菜单配置、路由懒加载
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   │
│   └── cloudflare-backend/           # Cloudflare Workers API
│       ├── src/
│       │   ├── common/               # Redis 缓存、共享工具
│       │   ├── Arknights/            # 明日方舟
│       │   ├── ba/                   # 蔚蓝档案
│       │   ├── fgo/                  # FGO
│       │   ├── gamekee/              # Gamekee 源（蔚蓝日服、NIKKE）
│       │   ├── kuro-game/            # 库洛游戏（鸣潮、战双）
│       │   ├── snowbreak/            # 尘白禁区
│       │   ├── index.ts              # Worker 入口
│       │   └── router.ts             # 路由 & CORS
│       └── wrangler.toml
│
├── docs/
├── .github/workflows/publish.yml     # CI/CD
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## API 说明

后端提供以下 RESTful 接口，统一返回格式：

```json
{
  "code": 200,
  "data": [
    {
      "id": "number | string",
      "title": "string",
      "start_time": "YYYY-MM-DD HH:mm",
      "end_time": "YYYY-MM-DD HH:mm",
      "banner": "string (optional)",
      "linkUrl": "string (optional)"
    }
  ]
}
```

---

## 开发记录

- 2026/6/1 新增接入游戏：明日方舟：终末地
- 2025/6/3 新增接入游戏：尘白禁区，有部分大版本活动会存在多个时间，暂时只显示第一个时间，详细信息请自行查看官网
- 2025/5/23 新增接入游戏：蔚蓝档案（国服），由于采用正则表达式获取 html 里的活动日程，对于多个时间的活动，暂时只显示第一个时间，详细信息请自行查看官网。
- 2025/5/22 新增接入游戏：蔚蓝档案（日服），NIKKE:胜利女神（外服）,鸣潮 banner 显示高清图，部分游戏增加活动详情链接
- 2024/8/13 新增接入游戏：鸣潮，战双帕弥什，点击图片支持预览
- 2024/8/10 提取出明日方舟的 banner 图
- 2024/7/27 使用 cheerio 提取出 fgo 的 banner 图
- 2024/2/13 调整日历布局和日历显示，不再因侧边栏伸缩而出现高度变化，支持点击对应的周日程控制其高度折叠

---

## License

[MIT](./LICENSE)

---

#### 本项目仅供学习参考使用

本项目的目的是为了提供一个学习资源，展示一些技术实现和编程概念。

谢谢！

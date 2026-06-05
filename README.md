# Game Events Calendar

> 多游戏活动日历聚合器 — 通过代理抓取各手游官网/Wiki 活动数据，以统一日历视图呈现，支持 10+ 款游戏的实时活动追踪。

[![demo](https://img.shields.io/badge/demo-online-4FC08D)](https://gameevent-frontend.pages.dev/)

[![DeepWiki Index](https://deepwiki.com/badge.svg)](https://deepwiki.com/jacket-sikaha/game-schedule)

---

## 技术栈

| 层级 | 技术 |
| --- | --- |
| **前端框架** | React 19 + TypeScript |
| **构建工具** | Vite 8 + Rollup |
| **UI 组件库** | Ant Design 6 + MUI 7 |
| **样式方案** | TailwindCSS 3 + Emotion |
| **状态/数据** | react-query + Axios |
| **路由** | react-router-dom 6 |
| **日期处理** | dayjs |
| **后端运行时** | Cloudflare Workers (Edge) |
| **后端路由** | itty-router 5 |
| **缓存层** | Redis (ioredis) |
| **HTML 解析** | cheerio |
| **包管理** | pnpm (workspace) |
| **构建编排** | Turborepo |
| **测试框架** | Vitest 4 + @vitest/coverage-v8 |
| **CI/CD** | GitHub Actions → Cloudflare Pages / Workers |

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

- [x] 支持 **多款游戏** 活动日历展示：公主连结、原神、星穹铁道、FGO、明日方舟、鸣潮、战双帕弥什、蔚蓝档案(国服/日服)、NIKKE、尘白禁区、终末地
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
│       │   ├── __tests__/            # 单元测试（8 文件 86 用例）
│       │   ├── common/               # Redis 缓存、共享工具
│       │   ├── Arknights/            # 明日方舟
│       │   ├── ba/                   # 蔚蓝档案
│       │   ├── fgo/                  # FGO
│       │   ├── gamekee/              # Gamekee 源（蔚蓝日服、NIKKE）
│       │   ├── kuro-game/            # 库洛游戏（鸣潮、战双）
│       │   ├── snowbreak/            # 尘白禁区
│       │   ├── endfield/             # 明日方舟：终末地
│       │   ├── index.ts              # Worker 入口
│       │   └── router.ts             # 路由 & CORS
│       ├── vitest.config.ts          # 测试配置（覆盖率门槛、mock、CI 重试）
│       └── wrangler.toml
│
├── docs/
├── .github/workflows/
│   ├── publish.yml                  # CI/CD（部署）
│   └── test.yml                     # CI（自动化测试 + 覆盖率）
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 测试

### 框架选型

选用 **Vitest 4** 作为测试框架，V8 coverage provider 做覆盖率统计。与 Vite 原生兼容，配置简洁，API 与 Jest 高度一致但执行速度更快。

monorepo 的测试架构：root 级 `vitest.config.ts` 通过 workspace 模式自动发现所有子项目的测试，各子项目维护自己的详细配置（覆盖率门槛、mock、超时等）。

### 运行测试

```bash
# monorepo 根目录 — 跑所有子项目
pnpm test

# 进入具体子项目 — 跑单个项目
cd apps/cloudflare-backend
pnpm test              # 一次执行
pnpm test:watch        # watch 模式（边改边跑）

# 含覆盖率报告
pnpm exec vitest run --coverage
```

### 后端测试覆盖情况

| 模块 | 测试思路 | 覆盖率（Statements） |
| --- | --- | --- |
| `Arknights/util` | mock `fetch` 两段调用（列表 → 详情），验证 HTML 正则解析 + 子活动时间提取 + Banner 图片匹配 | 96% |
| `ba/util` | 测试 `matchTime` 日期提取（跨年补年、默认小时填充）和 `handleBAData` 数据清洗（type 过滤、无效条目跳过） | 96% |
| `fgo/util` | mock `fetch` 模拟公告列表 → 详情全流程；`getImgBanner` 覆盖 7 种 HTML 变体；`html2Str` 覆盖嵌套标签提取 | 92% |
| `gamekee/util` | 验证秒级时间戳 → 格式化日期的批量转换、`big_picture` 优先回退逻辑、零值边界 | 100% |
| `endfield/index` | HTML 解析 `activity-card` DOM 元素，验证 `data-open`/`data-close` 空值处理、href 补全 | 100% |
| `kuro-game/util` | mock `fetch` 模拟库洛 Wiki API 响应，验证 `sideModules` 过滤 + `countDown` 字段解构 | 88% |
| `snowbreak/util` | `matchTime` 日期提取，含单数字月日格式（`5月23日`）的真实场景覆盖 | 50% |
| `common/index` | 纯函数 `TIME_FORMAT` 校验 + `getShanghaiDate` 时区转换（仅测纯函数，Redis 中间件预留集成测试） | 21% |

**全局覆盖率**（排除 Worker 入口/路由/Redis 连接等需集成环境的文件后）：

```
Statements: 77%  |  Branches: 73%
Functions:  75%  |  Lines:    77%
```

所有阈值（60%/50%/50%/60%）均已达标并留有缓冲空间。

### 测试编写规范

本项目遵循以下企业级测试约定：

- **AAA 模式**：每个用例按 Arrange（准备数据）→ Act（执行）→ Assert（断言）三段组织
- **describe/it 层级**：按「模块 → 函数 → 场景」嵌套，一眼看清测试范围
- **vi.mock 全局化**：`@/common/redis` 的 mock 放在 `setup.ts` 统一管理，避免每个测试文件重复
- **vi.stubGlobal('fetch')**：用 `mockResolvedValueOnce` 精确控制多次 `fetch` 调用的返回顺序
- **时区安全**：所有涉及 `dayjs.tz()` 的断言使用 ISO 8601 `Z` 后缀明确 UTC 输入，不依赖宿主本地时区
- **CI 重试机制**：`vitest.config.ts` 中 `retry: process.env.CI ? 2 : 0`，本地立即报错，CI 自动重试 2 次应对偶发 flaky test

### GitHub Actions 自动化测试

每次 Push 到 `main`/`master` 分支或发起 PR 时，`.github/workflows/test.yml` 自动执行：

```
checkout → pnpm install → vitest run --coverage → upload report
```

- Node 20 + 22 双版本矩阵验证
- `shared-workspace-lockfile=true` 确保 monorepo 全局单锁文件
- 覆盖率不达标 → 流水线标红 ❌ → PR 不能合
- 测试报告（html/lcov）作为 artifact 存档 7 天

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

- 2026/6/5 接入 Vitest 4 测试框架，覆盖后端 8 个模块（86 用例，77% 代码覆盖率）；配置 GitHub Actions 自动化测试流水线
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

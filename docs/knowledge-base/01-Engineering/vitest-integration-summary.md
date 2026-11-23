---
title: Vitest 接入总结
tags:
  - engineering
  - vitest
  - testing
created: 2026-06-06
updated: 2026-11-21
---

# Vitest 接入总结

> 项目：Game-Events-Calendar (pnpm monorepo + Turborepo)
> 成果：86 用例 / 8 测试文件 / 覆盖率 77% / GitHub Actions 自动化

---

## 一、写测试用例的要点

### 1.1 测试组织结构

```
describe('模块名', () => {
  describe('函数名', () => {
    it('场景描述', () => {
      // Arrange → Act → Assert
    })
  })
})
```

### 1.2 Mock 策略

| 场景 | 方案 | 位置 |
|---|---|---|
| 全局共享 mock（如 Redis） | `vi.mock('@/common/redis')` | `setup.ts` 统一管理 |
| 单文件 mock（如 fetch） | `vi.stubGlobal('fetch', mockFn)` | 测试文件 `beforeEach` |
| 多次调用不同返回 | `mockResolvedValueOnce` 按顺序 | 测试用例内 |

```ts
// mock fetch 两段调用：列表 → 详情
mockFetch
  .mockResolvedValueOnce({ json: () => Promise.resolve(listData) })
  .mockResolvedValueOnce({ json: () => Promise.resolve(detailData) })
```

### 1.3 时区安全

**绝不依赖 `process.env.TZ` 或宿主本地时区。**

```ts
// ❌ 错误：CI (UTC) 和本地 (Asia/Shanghai) 解析结果不同
dayjs('2025-01-15 08:00:00').tz('Asia/Shanghai')

// ✅ 正确：用 Z 后缀明确 UTC 输入
dayjs('2025-01-15T00:00:00Z').tz('Asia/Shanghai') // → 08:00

// ✅ 只校验格式，不校验精确值
expect(date.format(TIME_FORMAT)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
```

### 1.4 覆盖率配置

```ts
coverage: {
  enabled: process.env.CI === 'true',  // 本地不看，CI 才跑
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],  // 终端 + 浏览器 + Codecov
  exclude: [
    'src/**/*.test.ts',       // 测试文件自身
    'src/**/*.d.ts',          // 类型声明
    'src/__tests__/**',       // 测试辅助
    'src/index.ts',           // 入口胶水代码
    'src/router.ts',          // 路由（需集成测试）
    'src/common/redis.ts',    // 数据库连接（需集成测试）
  ],
  thresholds: { lines: 60, branches: 50, functions: 50, statements: 60 },
}
```

排除原则：**不是不该测，是不该用单元测试测**。入口、路由、数据库连接留给 miniflare 集成测试。

### 1.5 报告器（reporters）

| 环境 | 配置 | 效果 |
|---|---|---|
| 本地 | `configDefaults.reporters` | `default`（智能检测：终端用 default，AI 用 minimal）|
| CI | `['html', 'junit', ...configDefaults.reporters]` | default + github-actions(PR 标注) + junit(XML) + html(交互报告) |

关键：**手动配 reporters 会覆盖 vitest 默认值**，用 `configDefaults.reporters` 叠加。

### 1.6 CI 差异化

```ts
retry: process.env.CI ? 2 : 0,                          // CI 重试 flaky test
coverage.enabled: process.env.CI === 'true',             // 本地不看覆盖率
reporters: process.env.CI ? [...extra, ...defaults] : defaults,
```

---

## 二、Monorepo 测试步骤

### 2.1 依赖安装

```bash
# 根目录 — vitest 装为全局 devDependency
pnpm add -wD vitest @vitest/coverage-v8
```

### 2.2 项目配置

```
根目录                         子项目（如 apps/cloudflare-backend）
├── package.json               ├── package.json
│   "test": "turbo run test"   │   "test": "vitest run"
├── turbo.json                  │   "test:ci": "vitest run --coverage"
│   "test": { ... }            ├── vitest.config.ts  ← 详细配置放这里
├── .npmrc                     └── src/__tests__/
│   shared-workspace-lockfile=true  ← 全局单锁文件
└── pnpm-workspace.yaml
```

### 2.3 两种调度模式

| | vitest workspace | Turbo 编排（当前） |
|---|---|---|
| 入口 | 根 `vitest.config.ts` + `projects: ['apps/*']` | `turbo.json` + `turbo run test` |
| 适合 | 小型 monorepo，全量跑也没几秒 | 中型，要缓存 & 按项目触发 |
| 只跑改动的 | ❌ | ✅ turbo 缓存自动 skip |

根 `vitest.config.ts` 已删除，调度权完全交给 turbo。

### 2.4 CI 流程

```yaml
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
    paths: ['apps/cloudflare-backend/**']  # 只有 backend 变更才触发

steps:
  1. checkout@v4
  2. pnpm/action-setup@v4
  3. setup-node@v4 (Node 20 + 22 矩阵)
  4. pnpm install --frozen-lockfile
  5. turbo run test:ci --filter="@game-calendar/cloudflare-backend"
  6. upload-artifact (coverage/ + test-report/)
```

### 2.5 CI 产物

```
upload-artifact
  ├── coverage/index.html      ← 代码覆盖（行级绿/红标注）
  ├── coverage/lcov.info       ← 接入 Codecov/Coveralls
  ├── coverage/junit.xml       ← Actions 面板摘要
  └── test-report/index.html   ← 测试结果交互 UI（搜索/过滤/覆盖率）
```

### 2.6 常见踩坑

| 坑 | 原因 | 解决 |
|---|---|---|
| CI 时区不一致 | `dayjs()` 无时区字符串解析依赖宿主 | 用 `T00:00:00Z` 格式 |
| `--frozen-lockfile` 报错 | `shared-workspace-lockfile=false` 要求每包独立锁文件 | 改为 `true`（全局单锁文件） |
| `pnpm test -- --coverage` 覆盖率不生效 | `--` 被 vitest 当选项结束符 | `pnpm exec vitest run --coverage` 或 turbo 编排 |
| 手动配 reporters 丢默认值 | 覆盖了 vitest 智能检测 | 用 `...configDefaults.reporters` |
| 覆盖率不达标 | 入口/路由/DB 文件拖后腿 | 加入 `coverage.exclude`，留给集成测试 |
| Node 20 弃用警告 | Actions 运行时升级 | `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` |

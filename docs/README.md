# Game Events Calendar Monorepo

这是一个使用 pnpm workspaces 的游戏活动日历 monorepo 项目，包含前端和后端应用。

## 📁 项目结构

```
game-schedule/
├── apps/
│   ├── web-frontend/          # React + Vite 前端应用
│   └── cloudflare-backend/    # Cloudflare Workers 后端 API
├── packages/                  # 共享包（将来可以添加）
├── .npmrc                    # pnpm 配置
├── package.json              # 根目录 package.json
├── pnpm-workspace.yaml       # pnpm workspaces 配置
├── turbo.json                # Turbo 构建配置
└── ...
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

同时启动前端和后端：
```bash
pnpm dev
```

单独启动前端：
```bash
pnpm dev:frontend
```

单独启动后端：
```bash
pnpm dev:backend
```

### 构建项目

```bash
pnpm build
```

### 代码检查

```bash
pnpm lint
```

## 📦 包说明

### @game-calendar/web-frontend
- 技术栈：React 18 + TypeScript + Vite + TailwindCSS + Ant Design
- 端口：5173
- 功能：游戏活动日历展示和管理界面

### @game-calendar/cloudflare-backend
- 技术栈：Cloudflare Workers + TypeScript
- 功能：游戏活动数据 API 服务
- 支持游戏：明日方舟、FGO、尘白禁区等

## 🛠️ 开发工具

- **包管理器**：pnpm
- **构建工具**：Turbo (可选)
- **代码检查**：ESLint + TypeScript

## 📋 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm dev` | 启动所有应用的开发服务器 |
| `pnpm build` | 构建所有应用 |
| `pnpm lint` | 运行代码检查 |
| `pnpm clean` | 清理构建产物 |

## 🔧 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

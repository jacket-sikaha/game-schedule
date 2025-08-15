# 开发指南

## 开始使用

### 1. 安装 pnpm（如果尚未安装）
```bash
npm install -g pnpm
```

### 2. 安装所有依赖
```bash
pnpm install
```

### 3. 启动开发环境

#### 同时启动前端和后端：
```bash
pnpm dev
```

#### 单独启动：
```bash
# 仅前端
pnpm dev:frontend

# 仅后端
pnpm dev:backend
```

## 项目结构详解

### 应用目录
- `apps/web-frontend/` - React + Vite 前端应用
  - 端口：5173
  - 技术栈：React 18, TypeScript, Vite, TailwindCSS, Ant Design
  
- `apps/cloudflare-backend/` - Cloudflare Workers 后端
  - 端口：由 wrangler 分配
  - 技术栈：TypeScript, Cloudflare Workers, itty-router

### 共享包目录
- `packages/` - 未来可添加共享组件、工具函数等

## 常用开发命令

### 包管理
```bash
# 安装根目录依赖
pnpm install

# 安装特定包的依赖
pnpm --filter @game-calendar/web-frontend add axios
pnpm --filter @game-calendar/cloudflare-backend add dayjs
```

### 开发
```bash
# 启动所有应用
pnpm dev

# 启动特定应用
pnpm --filter @game-calendar/web-frontend dev
pnpm --filter @game-calendar/cloudflare-backend dev
```

### 构建
```bash
# 构建所有应用
pnpm build

# 构建特定应用
pnpm --filter @game-calendar/web-frontend build
pnpm --filter @game-calendar/cloudflare-backend build
```

### 代码质量
```bash
# 运行所有应用的 lint
pnpm lint

# 运行特定应用的 lint
pnpm --filter @game-calendar/web-frontend lint
```

### 清理
```bash
# 清理所有 node_modules 和构建产物
pnpm run --recursive clean
```

## 开发工作流

### 1. 日常开发
1. 克隆仓库
2. 运行 `pnpm install` 安装依赖
3. 运行 `pnpm dev` 启动所有服务
4. 开始开发

### 2. 添加新依赖
```bash
# 给前端添加依赖
pnpm --filter @game-calendar/web-frontend add package-name

# 给后端添加依赖
pnpm --filter @game-calendar/cloudflare-backend add package-name

# 添加开发依赖
pnpm --filter @game-calendar/web-frontend add -D package-name
```

### 3. 运行特定命令
```bash
# 在前端目录运行任何命令
pnpm --filter @game-calendar/web-frontend [command]

# 在后端目录运行任何命令
pnpm --filter @game-calendar/cloudflare-backend [command]
```

## 环境配置

### 前端环境变量
在 `apps/web-frontend/` 目录下创建 `.env.local` 文件：
```bash
VITE_API_URL=http://localhost:8787
```

### 后端环境变量
在 `apps/cloudflare-backend/` 目录下创建 `.dev.vars` 文件：
```bash
REDIS_URL=your-redis-url
```

## 部署

### 前端部署
```bash
# 构建前端
pnpm build:frontend

# 部署到 Cloudflare Pages
cd apps/web-frontend && pnpm run deploy
```

### 后端部署
```bash
# 部署到 Cloudflare Workers
cd apps/cloudflare-backend && pnpm run deploy
```

## 故障排除

### 常见问题

1. **依赖安装失败**
   - 确保使用 pnpm 而不是 npm/yarn
   - 运行 `pnpm store prune` 清理缓存

2. **端口冲突**
   - 前端默认端口 5173
   - 后端端口由 wrangler 分配

3. **构建失败**
   - 检查 TypeScript 错误
   - 确保所有依赖都已安装

### 获取帮助
- 检查各应用的 README.md
- 查看错误日志
- 确保 Node.js 版本 >= 18.0.0
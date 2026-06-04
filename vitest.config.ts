import { defineConfig } from 'vitest/config'

// Monorepo workspace 配置：vitest 会自动发现每个子项目的 vitest.config.ts
// 当前启用测试的子项目：apps/cloudflare-backend
// 待接入：apps/web-frontend
export default defineConfig({
    test: {
        // 只扫描 apps 目录，packages 目录暂无用
        projects: ['apps/*'],
    },
})

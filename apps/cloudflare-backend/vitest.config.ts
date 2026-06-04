import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM 环境下没有 __dirname，手动推导
const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            'cloudflare:workers': resolve(__dirname, './src/__tests__/__mocks__/cloudflare-workers.ts'),
        },
    },
    test: {
        // ── 基础配置 ──
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        // 跳过不需要测试的目录
        exclude: ['node_modules', 'dist', '.wrangler'],

        // ── 测试生命周期（企业标配）──
        // 每个测试后自动清除 mock 调用记录（避免测试间数据污染）
        clearMocks: true,
        // 每个测试后恢复原始实现（如果某个模块被 vi.mock 替换了）
        restoreMocks: true,

        // ── 超时控制 ──
        testTimeout: 10_000,   // 单个测试 10 秒超时（防止异步测试卡死）
        hookTimeout: 10_000,   // beforeAll/afterAll 10 秒超时

        // ── 重试（CI 专属）──
        // 本地失败就直接报错，CI 环境自动重试 2 次（应对偶发 flaky test）
        retry: process.env.CI ? 2 : 0,

        // ── 初始化文件 ──
        setupFiles: ['./src/__tests__/setup.ts'],

        // ── 覆盖率（四件事：provider、报告格式、排除项、门槛）──
        coverage: {
            provider: 'v8',
            // text: 终端输出  html: 浏览器看  lcov: CI 工具消费
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            // 只统计 src 下的 .ts 文件
            include: ['src/**/*.ts'],
            // 排除测试文件、类型声明、测试辅助文件、废弃的旧 Redis 连接代码
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.d.ts',
                'src/__tests__/**',
                'src/common/redis-pool.ts',   // 已废弃的旧代码
            ],
            // 覆盖率门槛：不达标 → 测试失败 → CI 不通过
            thresholds: {
                lines: 60,
                branches: 50,
                functions: 50,
                statements: 60,
            },
        },

        // ── 报告器（CI 时生成 JUnit XML，方便 Jenkins/GitLab 读取）──
        reporters: process.env.CI
            ? ['junit', 'verbose']
            : ['verbose'],
        outputFile: process.env.CI
            ? { junit: './coverage/junit.xml' }
            : undefined,
    },
})

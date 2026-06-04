// Mock for `cloudflare:workers` — provides stub `env` export for vitest
export const env: Record<string, any> = { REDIS_PASSWD: 'mock-redis-password' }

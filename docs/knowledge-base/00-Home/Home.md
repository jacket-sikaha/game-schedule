---
title: Game Events Calendar 知识库
tags:
  - moc
  - game-events-calendar
---

# Game Events Calendar 知识库

这是本项目的 Obsidian 知识入口。代码仓库自身的 README 保持在原位置，便于 GitHub 和开发工具直接使用；这里主要整理长期有效的工程经验与调研结论。

## 内容地图

- [[01-Engineering/Engineering|工程实践]]
- [[02-Research/Research|调研结论]]

## 重点文档

- [[01-Engineering/vitest-integration-summary|Vitest 接入总结]]
- [[02-Research/ical-feasibility|iCal 订阅可行性分析]]
- [[02-Research/nte-announcement-sources|异环公告数据源调研]]

## 仓库入口

- 项目说明：[/README.md](/README.md)
- 后端说明：[/apps/cloudflare-backend/README.md](/apps/cloudflare-backend/README.md)

## 使用约定

1. 知识库统一放在 `docs/knowledge-base`。
2. 工程实践放入 `01-Engineering`，调研结论放入 `02-Research`。
3. 原始数据、复现脚本和验证产物继续留在 `docs/research`，文档需要引用时写相对路径。
4. 新文档建议包含 frontmatter：`title`、`tags`、`created`、`updated`。

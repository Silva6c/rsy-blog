---
title: "Claude 对话浏览器：JSON 导出 → 可读聊天界面"
excerpt: "一个 Flask 小工具，把 Claude 导出的 conversations.json 还原成对话格式，支持搜索、主题切换、Markdown 导出。"
publishedAt: 2026-06-02
tags: ["Flask", "Python", "Claude", "工具"]
author: "RSY"
---

Claude.ai 在 Settings → Privacy → Export Data 提供数据导出功能，下载解压后得到一个 `conversations.json`。该文件是一个 JSON 数组，每个元素包含一个对话的全部消息、内容块、元数据。直接在编辑器里阅读效率很低，需要专门的工具来做格式还原。

claude-viewer 是一个 Flask 应用，把 JSON 文件拖入浏览器即可浏览对话。

## 功能:

- 侧边栏显示对话列表，按更新时间倒序排列
- 消息以气泡格式展示：用户（human）和助手（assistant）分左右显示
- thinking 块默认折叠为 `<details>` 面板，点击展开
- 工具调用显示为卡片（工具名称、输入参数 JSON、内联结果）
- 代码块使用 highlight.js 语法高亮
- 亮色/暗色主题切换
- `Ctrl+K` 搜索对话框，按标题和摘要模糊匹配
- 单对话导出为 Markdown 文件
- 加载 `memories.json` 后显示 Claude 推断的用户画像

## 技术实现:

后端：Flask，单个入口文件 `app.py` + `src/` 四个模块。

| 模块 | 职责 |
|------|------|
| `model.py` | 三个 dataclass：ContentBlock / ChatMessage / Conversation |
| `parser.py` | 解析 conversations.json，支持 JSON 数组和 JSONL 两种格式 |
| `content_renderer.py` | 16 种内容块类型 → HTML 片段的映射函数 |
| `renderer_md.py` | 对话 → Markdown 文本导出 |

API 层提供 6 个端点：`/api/upload`（POST 上传并解析）、`/api/list`（对话摘要列表）、`/api/conv/<uuid>`（单对话详情，返回已渲染的 HTML 片段）、`/api/conv/<uuid>/export`（导出 Markdown）、`/api/search?q=`（搜索）、`/api/stats`（统计信息）。

前端纯原生 JavaScript，无框架。JSON 解析和 HTML 渲染在后端完成，前端只需插入 DOM 和绑定事件。

内容块渲染采用分发模式：`render_content_block()` 根据 `block.type` 字段路由到对应的 `_render_*()` 函数。tool_result 类型包含嵌套子内容块，使用递归渲染。

## 与现有工具的区别:

GitHub 上有几个同类项目（如 claude-chat-viewer、claude-export-viewer），大多为纯前端解析，JSON 全量加载到浏览器内存。本项目的差异在于：

1. 解析在后端完成，API 只返回当前查看的对话数据，大文件场景下内存占用更可控
2. 支持后端 Markdown 导出
3. 预留了 JSONL 格式（Claude Code 会话记录）的适配接口

## 安装:

```bash
git clone https://github.com/Silva6c/claude-viewer
cd claude-viewer
pip install flask
python app.py
```

启动后自动打开 `http://localhost:5000`，拖拽 `conversations.json` 即可使用。

## 已知限制:

- 仅支持 Claude.ai 网页版导出的 JSON 格式，Claude Code 的 `.jsonl` 解析逻辑尚未完成
- 不支持多文件同时加载
- 搜索仅覆盖标题和摘要，不搜索对话正文

后续计划：完成 JSONL 适配、对话正文全文搜索、批量 Markdown 导出。

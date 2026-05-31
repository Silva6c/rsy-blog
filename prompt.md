# RSY's 1st BLOG — 项目上下文 Prompt

> 在新对话窗口中使用本文件，快速恢复项目上下文，无需重新解释。

---

## 1. 项目概要

为 RSY 从零搭建的**零运行成本个人博客**，当前部署在 GitHub Pages。

- **线上地址**：`https://silva6c.github.io/rsy-blog/`
- **GitHub 仓库**：`https://github.com/Silva6c/rsy-blog`
- **分支**：`master`
- **部署方式**：推送 `master` → GitHub Actions 自动构建并部署到 GitHub Pages
- **总费用**：￥0.00/月

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Astro（SSG 模式） | ^5.7 |
| 样式 | TailwindCSS v4 + Shadcn UI | ^4.1 |
| UI 组件 | React 19（仅交互 Island） | ^19.1 |
| 认证 | Supabase Auth（Magic Link + GitHub OAuth） | ^2.49 |
| 图片存储 | Cloudflare R2（10GB 免费） | — |
| 评论 | Giscus（GitHub Discussions） | — |
| 托管 | GitHub Pages | — |

## 3. 关键架构决策

### 3.1 内容管理：Markdown 优先
文章以 `.md` 文件存放在 `src/content/blog/`，使用 Astro Content Collections。推送 Git 即自动部署。Supabase 仅用于 Auth，不存文章。

### 3.2 Shadcn UI：只用于交互组件
Button、Input、Card、Avatar 四个组件在 `src/components/ui/`。静态内容全部用原生 `.astro` 组件 + TailwindCSS。

### 3.3 设计风格：现代科技风
深色默认，青色渐变品牌色，JetBrains Mono 代码字体，毛玻璃导航栏。

### 3.4 BASE 路径模式（核心 · 必读）
因为是 GitHub Pages **项目页**（非用户页），部署在子路径 `/rsy-blog/` 下。**所有内部链接必须加前缀**：

```ts
// src/lib/constants.ts
export const BASE = import.meta.env.BASE_URL;
// 开发环境 → '/'
// 生产环境 → '/rsy-blog/'
```

**规则**：任何 `.astro` 文件中的 `<a href>` 都必须用 `{BASE}` 或 `` {`${BASE}path`} ``，不能写死 `/path`。

已统一使用 `BASE` 的文件：`Header.astro`、`Footer.astro`、`ArticleCard.astro`、`index.astro`、`404.astro`、`admin.astro`、`BaseLayout.astro`、`blog/[slug].astro`。

## 4. 项目结构

```
rsy-blog/
├── .github/workflows/deploy.yml  ← GitHub Actions 自动部署
├── astro.config.mjs              ← base: '/rsy-blog/', site: 'silva6c.github.io'
├── tsconfig.json                 ← strictest, path alias @/
├── package.json                  ← 无 wrangler/cloudflare 依赖
├── public/
│   ├── _headers, _redirects, robots.txt, favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/          ← Shadcn UI（button/input/card/avatar）
│   │   ├── Header.astro ← 导航栏 + 移动端菜单 + ThemeToggle
│   │   ├── Footer.astro
│   │   ├── ArticleCard.astro
│   │   ├── TableOfContents.astro
│   │   ├── ThemeToggle.tsx     ← React Island（暗色/浅色切换）
│   │   ├── GiscusComments.tsx  ← React Island（评论）
│   │   └── LoginForm.tsx       ← React Island（Supabase 登录）
│   ├── content/
│   │   ├── config.ts      ← Blog Collection Schema（Zod）
│   │   └── blog/           ← Markdown 文章放这里
│   ├── layouts/
│   │   └── BaseLayout.astro  ← 全局布局（SEO meta + 主题初始化）
│   ├── lib/
│   │   ├── constants.ts   ← SITE_NAME / SITE_DESCRIPTION / SITE_URL / BASE
│   │   ├── utils.ts       ← cn() / estimateReadingTime() / formatDate()
│   │   └── supabase.ts    ← getSupabase() 惰性初始化
│   ├── pages/
│   │   ├── index.astro        ← 首页（文章列表）
│   │   ├── blog/[slug].astro  ← 文章详情（MDX + 目录 + 评论）
│   │   ├── login.astro        ← 登录页
│   │   ├── admin.astro        ← 管理面板
│   │   ├── 404.astro          ← 404 页面
│   │   └── rss.xml.js         ← RSS 源
│   └── styles/
│       └── globals.css    ← TailwindCSS v4 + Shadcn 变量 + 工具类
└── supabase/migrations/
    └── 001_initial_schema.sql  ← profiles + articles 表 + RLS
```

## 5. 如何添加新文章

在 `src/content/blog/` 下创建 `.md` 文件：

```markdown
---
title: "文章标题"
excerpt: "文章摘要"
publishedAt: 2026-06-15
updatedAt: 2026-06-20  # 可选
tags: ["标签1", "标签2"]
author: "RSY"
coverImage: "https://pub-xxxxx.r2.dev/images/xxx.jpg"  # 可选
draft: false
---

文章正文（Markdown）...
```

推送后 GitHub Actions 自动构建部署。

## 6. 部署流程

### 自动部署（推荐）
```bash
git add .
git commit -m "描述"
git push origin master
# → GitHub Actions 自动构建 → 自动部署到 GitHub Pages
```

### 本地开发
```bash
npm install
npm run dev      # → http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

### 本地目录
本地克隆到 `G:\CLAUDE_TEST\rsy-blog-fix\`。

## 7. 迁移历史（重要 · 避免踩坑）

| 阶段 | 做了什么 | 教训 |
|------|---------|------|
| Cloudflare Pages → GitHub Pages | 删除 `wrangler.toml`、`@astrojs/cloudflare`，添加 `.github/workflows/deploy.yml` | Cloudflare 检测到 wrangler.toml 会自动执行 Workers 部署 |
| CLAUDE_TEST → rsy-blog | `git subtree push` 把 `website/` 推送到独立仓库 | Subtree 不会推送根目录的 `.github/` |
| Workflow 位置 | 从 `website/.github/` 移到根目录 `.github/` | GitHub Actions 要求 `.github/workflows/` 在仓库根目录 |
| 404 问题（两次） | ① Astro `base` 不会自动加到 `<a href>` ② `@astrojs/cloudflare` 残留干扰 | 所有链接必须手动拼接 `{BASE}`，CC 自动添加的依赖要清理 |

## 8. 已知 Bug 修复记录

1. **全站 404**：`<a href="/login">` 没加 `/rsy-blog/` 前缀 → 6 个文件统一导入 `BASE` 并手动拼接
2. **Cloudflare 残留**：Footer/Admin/hello-world.md 里还有 Cloudflare 引用 → 全部改为 GitHub Pages
3. **LoginForm 重定向 Bug**：`window.location.origin + '/admin'` 缺 BASE 路径 → 改为 `import.meta.env.BASE_URL`
4. **Giscus 主题硬编码**：始终深色 → 改为动态读 `data-theme`
5. **ThemeToggle 双份渲染**：桌面端和移动端各渲染一个 → 合并为一个
6. **BaseLayout 死导入**：`ThemeToggle` 已导入但未使用 → 删除
7. **SITE_NAME 4 处硬编码**：→ 统一从 `constants.ts` 导入

## 9. 设计 Token

| Token | 值 |
|-------|-----|
| 品牌色 | `hsl(187 100% 42%)` 青色 |
| 背景 | `hsl(222 47% 6%)` 深蓝黑 |
| 卡片 | `hsl(222 47% 10%)` |
| 字体 | Inter + Noto Sans SC（正文）· JetBrains Mono（代码） |
| 圆角 | `0.625rem` |
| 工具类 | `.text-gradient-brand` 品牌渐变文字 |

## 10. 免费服务一览

| 服务 | 用途 | 免费额度 |
|------|------|----------|
| GitHub Pages | 托管 | 无限带宽 |
| GitHub Actions | CI/CD | 2000 分钟/月 |
| Supabase | 认证 | 50K MAU |
| Cloudflare R2 | 图片 | 10GB |
| Giscus | 评论 | 无限 |

## 11. 常用命令

```bash
cd G:\CLAUDE_TEST\rsy-blog-fix
npm run dev          # 本地运行
npm run build        # 构建
git push origin master  # 推送 → 自动部署
```

## 12. 待完成事项

- [ ] Supabase 环境变量配置（登录功能需要）
- [ ] Giscus 环境变量配置（评论功能需要）
- [ ] Cloudflare R2 配置（图片上传需要）
- [ ] 在线 Markdown 编辑器（未来）
- [ ] 自定义域名绑定（可选）

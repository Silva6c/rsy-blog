---
title: "Hello World — 零成本博客启航"
excerpt: "第一篇博客文章，介绍这个零成本博客的技术栈和搭建思路。"
publishedAt: 2026-06-01
tags: ["Astro", "GitHub Pages", "零成本"]
author: "RSY"
---

# Hello World — 零成本博客启航

欢迎来到我的个人博客！这是第一篇示例文章。

## 为什么选择零成本架构？

作为独立开发者，我希望在 **完全不花钱** 的前提下拥有一个高性能、可扩展的个人博客。经过调研，我选择了以下技术组合：

| 层级 | 技术 | 费用 |
|:----:|:----:|:----:|
| 静态生成 | Astro SSG | 免费 |
| 样式 | TailwindCSS + Shadcn UI | 免费 |
| 认证 | Supabase Auth | 免费 (50K MAU) |
| 图片存储 | Cloudflare R2 | 免费 (10GB) |
| 托管 | GitHub Pages | 免费 (无限带宽) |
| 评论 | Giscus | 免费 (GitHub Discussions) |
| 分析 | GitHub Traffic | 免费 |

## 技术亮点

### 1. Astro 静态生成

```astro
---
// src/pages/index.astro
const posts = await getCollection('blog');
---

<ul>
  {posts.map(post => <li>{post.data.title}</li>)}
</ul>
```

Astro 在构建时将页面预渲染为纯 HTML，**零 JavaScript 开销**，首屏加载极快。

### 2. 深色主题 · 科技风

使用 TailwindCSS v4 的 CSS 变量系统，配合 Shadcn UI 组件库，实现了：

- 默认深色主题，护眼且酷炫
- CSS 变量驱动，一键切换浅色模式
- 品牌色渐变点缀，科技感十足

### 3. 部署流程

```bash
# 写文章 → 推送 → 自动部署
git add src/content/blog/new-post.md
git commit -m "新文章: xxx"
git push origin master
# GitHub Pages 自动构建并部署
```

## 开始写作

在 `src/content/blog/` 目录下创建 `.md` 文件：

```markdown
---
title: "你的文章标题"
excerpt: "文章摘要"
publishedAt: 2026-06-01
tags: ["标签1", "标签2"]
---

文章内容...
```

推送后即可在首页看到新文章。

---

> 这是第一篇示例文章。后续会分享更多全栈开发、云计算和安全技术相关内容。

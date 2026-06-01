---
title: "博客活了"
excerpt: "一个零运行成本的个人博客是怎么搭起来的。"
publishedAt: 2026-06-01
tags: ["Astro", "GitHub Pages", "博客"]
author: "RSY"
---

这个博客从写完第一行代码到上线，花了大概几天。总费用为零。

我一开始的需求很明确：写 Markdown 就能发文章，不需要登录后台、不需要维护数据库、最好连服务器都不需要。满足这些条件的方案其实不多。

最终选了 Astro。它是一个静态站点生成器，在构建时把 Markdown 编译成纯 HTML。这意味着部署目标可以是一个静态文件托管服务——我用了 GitHub Pages，因为仓库已经在 GitHub 上，免费，不用额外注册任何东西。

样式用了 TailwindCSS v4。这个版本用 CSS 变量驱动主题，深色模式和浅色模式切换只要改几个变量值。UI 组件借了 Shadcn 的几个组件——Button、Card、Input，省掉了从零写样式的时间。

评论系统接了 Giscus，数据存在 GitHub Discussions 里，和仓库绑定在一起，不需要额外的云服务或数据库。认证那一块预留了 Supabase 的接口，Magic Link 和 GitHub OAuth 的登录流程已经写好了，环境变量补上就能用。图片存储指向 Cloudflare R2，10GB 免费额度对个人博客来说绰绰有余。

部署链路是 push 到 master → GitHub Actions 构建 → 部署到 GitHub Pages。每次写完文章 git push 一下，两分钟后网站就更新了。

到目前为止，这个博客的重量是零元。后面打算写一点开发中的笔记和遇到的技术问题，算是给自己留个存档。
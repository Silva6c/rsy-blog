# 🪙 零成本博客 — 完整部署指南

> **目标：** 从零到上线，一分钱不花，拥有一个功能完整的个人博客。
>
> **预计耗时：** 45~60 分钟
>
> **总费用：￥0.00**

---

## 目录

- [架构概览](#架构概览)
- [前置准备](#前置准备)
- [第一步：Supabase（认证 + 数据库）](#第一步supabase认证--数据库)
- [第二步：Cloudflare R2（图片存储）](#第二步cloudflare-r2图片存储)
- [第三步：GitHub + Giscus（评论系统）](#第三步github--giscus评论系统)
- [第四步：Cloudflare Pages（托管部署）](#第四步cloudflare-pages托管部署)
- [第五步：本地开发与部署](#第五步本地开发与部署)
- [第六步：可选配置](#第六步可选配置)
- [常见问题排查](#常见问题排查)

---

## 架构概览

```
你写文章(.md) → git push → GitHub
                              ↓
                   Cloudflare Pages 自动构建
                   运行 npm run build（Astro SSG）
                              ↓
                   纯静态 HTML/CSS/JS 部署到全球 CDN
                              ↓
                   用户访问 your-blog.pages.dev
                     ├─ 登录 → Supabase Auth
                     ├─ 评论 → Giscus (GitHub Discussions)
                     ├─ 图片 ← Cloudflare R2
                     └─ 统计 → Cloudflare Web Analytics
```

| 服务 | 用途 | 免费额度 | 够用吗？ |
|------|------|----------|----------|
| **Cloudflare Pages** | 托管网站 | 无限带宽 · 500 次构建/月 | ✅ 远超需求 |
| **Supabase** | 用户认证 | 50,000 月活用户 · 500MB DB | ✅ 个人博客绰绰有余 |
| **Cloudflare R2** | 图片存储 | 10GB · 千万次操作/月 | ✅ 可存 ~5000 张高清图 |
| **Giscus** | 评论系统 | 无限（基于 GitHub API） | ✅ 完全免费 |
| **GitHub** | 代码仓库 | 无限公共/私有仓库 | ✅ |

---

## 前置准备

在开始之前，请确保你已有：

- [ ] **GitHub 账号** → [github.com](https://github.com) 免费注册
- [ ] **Cloudflare 账号** → [dash.cloudflare.com](https://dash.cloudflare.com) 免费注册
- [ ] **Node.js 24+** → [nodejs.org](https://nodejs.org) 下载安装
- [ ] **Git** → [git-scm.com](https://git-scm.com) 下载安装
- [ ] **一个邮箱**（用于 Supabase 注册和管理员登录）

> 💡 全程不需要信用卡，所有服务都有永久免费层。

---

## 第一步：Supabase（认证 + 数据库）

### 1.1 注册并创建项目

1. 访问 [supabase.com](https://supabase.com) → 点击 **"Start your project"**
2. 用 GitHub 账号登录（推荐，方便后续集成）
3. 登录后进入 Dashboard → 点击 **"New project"**
4. 填写项目信息：

   | 字段 | 填写内容 | 说明 |
   |------|----------|------|
   | **Name** | `my-blog` | 随意命名 |
   | **Database Password** | 生成一个强密码 | **记下来！** 后面 SQL 迁移要用 |
   | **Region** | `ap-southeast-1`（新加坡） | 亚洲用户选这个最快 |
   | **Pricing Plan** | **Free** | 默认就是 Free |

5. 点击 **"Create project"** → 等待 1~2 分钟初始化

### 1.2 获取 API 密钥

1. 左侧菜单 → **Settings** → **API**
2. 复制以下两个值，填入项目的 `.env` 文件：

   | 页面上的名称 | 对应 .env 变量 | 安全性 |
   |-------------|---------------|--------|
   | **Project URL** | `PUBLIC_SUPABASE_URL` | 可公开 |
   | **anon public key** | `PUBLIC_SUPABASE_ANON_KEY` | 可公开 |
   | **service_role key** | `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ 保密 |

   ```
   # .env 示例：
   PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 1.3 执行数据库迁移

1. 左侧菜单 → **SQL Editor** → 点击 **"New query"**
2. 打开项目中的 `supabase/migrations/001_initial_schema.sql`
3. 复制全部内容 → 粘贴到 SQL Editor
4. 点击右下角 **"Run"** 执行
5. 看到 "Success. No rows returned" 即成功

> 这条 SQL 创建了 `profiles` 表（用户资料）、`articles` 表（文章）、自动触发器、和 RLS 安全策略。

### 1.4 设置认证方式

1. 左侧菜单 → **Authentication** → **Providers**
2. **Email provider**（默认开启，无需配置）：
   - 确认 "Enable email provider" 是开启状态
   - 建议关闭 "Confirm email"（开发阶段方便测试）
3. **GitHub provider**（可选，推荐）：
   - 点击 GitHub → 开启
   - 需要去 GitHub Settings → Developer settings → OAuth Apps 创建一个 App
   - 回调 URL 填入：`https://<your-project>.supabase.co/auth/v1/callback`
4. 其他 provider（Google, GitLab 等）按需开启

---

## 第二步：Cloudflare R2（图片存储）

### 2.1 创建 R2 存储桶

1. 访问 [dash.cloudflare.com](https://dash.cloudflare.com) → 登录
2. 左侧菜单 → **R2** → 点击 **"Create bucket"**
3. 填写：

   | 字段 | 值 |
   |------|-----|
   | Bucket Name | `blog-images` |
   | Location | **Asia Pacific**（或离你最近的） |

4. 点击 **"Create bucket"**

### 2.2 开启公网访问

1. 进入刚创建的 bucket → 顶部 tab **"Settings"**
2. 找到 **"Public Access"** 部分
3. 开启 **"R2.dev Subdomain"** → 点击 **"Allow Access"**
4. 开启后会显示一个公网 URL，类似：
   ```
   https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
   ```
5. 复制这个 URL → 填入 `.env` 的 `PUBLIC_R2_PUBLIC_URL`

### 2.3 创建 API Token

1. 右侧 **"Manage R2 API Tokens"** → **"Create API Token"**
2. 配置：

   | 字段 | 值 |
   |------|-----|
   | Token Name | `blog-upload` |
   | Permissions | **Object Read & Write** |
   | Select Bucket | `blog-images` |

3. 点击 **"Create API Token"**
4. ⚠️ **立即复制**以下值（只显示一次！）：

   | 显示的值 | 对应 .env 变量 |
   |---------|---------------|
   | Access Key ID | `R2_ACCESS_KEY_ID` |
   | Secret Access Key | `R2_SECRET_ACCESS_KEY` |

5. 获取 Account ID：
   - 回到 Cloudflare Dashboard 首页
   - 右侧或 URL 中的 32 位十六进制字符串就是 Account ID
   - 填入 `.env` 的 `R2_ACCOUNT_ID`

---

## 第三步：GitHub + Giscus（评论系统）

### 3.1 创建 GitHub 仓库

1. [github.com/new](https://github.com/new) 创建新仓库
2. Repository name: `my-blog`（或任意名）
3. 选择 **Public**（Giscus 要求仓库公开）
4. **不要**勾选 "Initialize with README"（我们已有代码）
5. 点击 **"Create repository"**

### 3.2 开启 Discussions

1. 进入仓库 → **Settings** tab
2. 往下滚动到 **Features** 部分
3. 勾选 ✅ **Discussions**
4. 这样你的仓库就支持讨论功能了

### 3.3 配置 Giscus

1. 访问 [giscus.app/zh-CN](https://giscus.app/zh-CN)
2. 在 **"仓库"** 输入框中填入：`你的用户名/你的仓库名`（如 `myusername/my-blog`）
3. 页面会自动验证 → 显示 "此仓库满足所有条件"
4. 在 **"页面 ↔️ discussion 映射"** 选择：**"Discussion 的标题包含页面的路径"**
5. 在 **"分类"** 下拉菜单中选择一个分类（如 **Announcements**，或去 Discussions 新建一个叫 "Comments" 的分类）
6. 页面下方会自动生成配置信息，复制以下值：

   | 页面显示的属性 | 对应 .env 变量 |
   |--------------|---------------|
   | `data-repo` | `PUBLIC_GISCUS_REPO` |
   | `data-repo-id` | `PUBLIC_GISCUS_REPO_ID` |
   | `data-category-id` | `PUBLIC_GISCUS_CATEGORY_ID` |

### 3.4 推送代码到 GitHub

```bash
# 在项目根目录执行
git init  # 如果还没有初始化

# 复制 .env.example 并填入真实值
cp .env.example .env
# 编辑 .env，填入上面获取的所有密钥

# 添加并推送
git add .
git commit -m "初始化零成本博客"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

---

## 第四步：Cloudflare Pages（托管部署）

### 4.1 连接 Git 仓库

1. 访问 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → 点击 **"Create"**
3. 选择 **"Pages"** tab → 点击 **"Connect to Git"**
4. 授权 Cloudflare 访问你的 GitHub 账号
5. 选择你的博客仓库 → 点击 **"Begin setup"**

### 4.2 构建配置

| 配置项 | 值 |
|--------|-----|
| **Project name** | `zero-cost-blog` |
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

### 4.3 设置环境变量

在 Cloudflare Pages 设置页面 → **Environment variables** 部分，
逐个添加以下变量（值与本地 `.env` 文件中的一致）：

| 变量名 | 来源 |
|--------|------|
| `PUBLIC_SUPABASE_URL` | Supabase Settings → API |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API |
| `PUBLIC_GISCUS_REPO` | Giscus 配置页 |
| `PUBLIC_GISCUS_REPO_ID` | Giscus 配置页 |
| `PUBLIC_GISCUS_CATEGORY_ID` | Giscus 配置页 |
| `PUBLIC_R2_PUBLIC_URL` | R2 Bucket Settings |

> ⚠️ 这些变量名必须和 `.env.example` 中的完全一致。
>
> ⚠️ 注意：Cloudflare Pages 的 env vars 区分 **Production** 和 **Preview** 环境，请确保都设置。

### 4.4 首次部署

1. 点击 **"Save and Deploy"**
2. Cloudflare 会自动：克隆仓库 → 安装依赖 → 构建 → 部署
3. 约 2~3 分钟后，你会看到一个 `*.pages.dev` 域名
4. 点击访问 → 🎉 你的博客上线了！

### 4.5 绑定自定义域名（可选）

1. Pages 项目 → **Custom domains** tab
2. 点击 **"Set up a custom domain"**
3. 输入你的域名（如 `blog.yourname.com`）
4. 按提示修改 DNS 记录（在你的域名注册商处）
5. 等待 SSL 证书自动签发（约 5 分钟）

> 如果你没有自己的域名，`*.pages.dev` 子域名完全免费且自带 HTTPS。

---

## 第五步：本地开发与部署

### 5.1 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器（热更新）
npm run dev
# → http://localhost:4321

# 构建生产版本
npm run build
# → 生成 dist/ 目录

# 预览构建产物
npm run preview
# → http://localhost:4321
```

### 5.2 手动部署

```bash
# 一键构建并部署到 Cloudflare Pages
npm run deploy
```

### 5.3 日常发布流程

```bash
# 1. 写文章
#    在 src/content/blog/ 下创建新的 .md 文件

# 2. 本地预览
npm run dev

# 3. 提交并推送
git add .
git commit -m "新文章：xxx"
git push

# 4. 自动部署（Cloudflare Pages 检测到 push 后自动构建）
#    无需任何额外操作！
```

### 5.4 发布文章的 Markdown 格式

```markdown
---
title: "你的文章标题"
excerpt: "文章摘要（会显示在首页卡片和 SEO 描述中）"
publishedAt: 2026-06-15
updatedAt: 2026-06-20  # 可选
tags: ["Astro", "前端", "教程"]
author: "你的名字"
coverImage: "https://pub-xxxxx.r2.dev/images/cover.jpg"  # 可选
draft: false  # true = 草稿，不会出现在首页
---

文章内容（Markdown 格式）...

## 二级标题

正文内容...

### 三级标题

代码块：
\```javascript
console.log('hello world');
\```
```

---

## 第六步：可选配置

### 6.1 设置管理员

1. 访问你的博客 → 点击 **"登录"** → 用邮箱注册/登录
2. 登录成功后，去 Supabase Dashboard → SQL Editor
3. 执行以下 SQL（替换为你的用户 ID）：

   ```sql
   -- 先找到你的 user id
   SELECT id, email FROM auth.users;

   -- 设为管理员
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = '<你的-user-id>';
   ```

### 6.2 上传图片到 R2

有三种方式：

**方式一：Cloudflare Dashboard（最简单）**
1. R2 → 进入 bucket → **Upload** 按钮
2. 直接拖拽文件上传

**方式二：Wrangler CLI**
```bash
# 上传单个文件
npx wrangler r2 object put blog-images/images/cover.jpg --file ./cover.jpg

# 上传整个目录
npx wrangler r2 object put blog-images/images/ --file ./images/
```

**方式三：S3 兼容 API（用于批量/自动化）**
```bash
# R2 兼容 S3 API，可以用任何 S3 工具
# Access Key ID 和 Secret Access Key 在第二步中已生成
```

上传后的访问 URL：
```
https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev/images/cover.jpg
```

### 6.3 Cloudflare Web Analytics

1. Cloudflare Dashboard → **Analytics & Logs** → **Web Analytics**
2. 点击 **"Add a site"**
3. 输入你的 Pages 域名
4. Cloudflare 会在 Pages 层面自动注入分析脚本，**无需修改任何代码**
5. 提供：PV、UV、来源、国家、设备类型等统计

### 6.4 设置自定义 404 页面

创建 `src/pages/404.astro`：

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---
<BaseLayout title="页面未找到">
  <div class="text-center py-20">
    <h1 class="text-6xl font-bold text-[hsl(var(--primary))]">404</h1>
    <p class="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
      你寻找的页面不存在
    </p>
    <a href="/" class="mt-6 inline-block text-[hsl(var(--primary))] hover:underline">
      返回首页
    </a>
  </div>
</BaseLayout>
```

---

## 常见问题排查

### Q: `npm run build` 报错 `supabaseUrl is required`

**原因：** `.env` 文件未配置 Supabase 环境变量。

**解决：** 复制 `.env.example` → `.env` → 填入真实值。
如果暂时不需要登录功能，可以留空，构建会自动跳过。

### Q: Cloudflare Pages 部署后页面空白

**原因：** 构建命令或输出目录配置错误。

**解决：** 检查 Cloudflare Pages 设置：
- Build command 必须是 `npm run build`
- Build output directory 必须是 `dist`

### Q: Giscus 评论区不显示

**原因：** 环境变量未在 Cloudflare Pages 中设置。

**解决：**
1. Cloudflare Pages → Settings → Environment variables
2. 确保 `PUBLIC_GISCUS_REPO` / `PUBLIC_GISCUS_REPO_ID` / `PUBLIC_GISCUS_CATEGORY_ID` 已设置
3. 重新部署（修改 env vars 后需要重新部署）

### Q: 登录后看不到管理面板

**原因：** 你的用户还没有被设为管理员。

**解决：** 按 [6.1 设置管理员](#61-设置管理员) 的步骤操作。

### Q: 如何让搜索引擎收录我的博客？

1. Cloudflare Pages 已经自动提供 HTTPS（搜索引擎偏好）
2. `robots.txt` 和 `sitemap.xml` 会自动生成
3. 去 Google Search Console / Bing Webmaster 手动提交 sitemap URL：
   - `https://你的域名.pages.dev/sitemap.xml`

### Q: 免费额度用完了怎么办？

各服务的免费额度非常充裕：

| 服务 | 个人博客月均用量 | 免费额度 | 占比 |
|------|----------------|----------|------|
| Cloudflare Pages 带宽 | ~1GB | 无限 | <0.01% |
| Cloudflare Pages 构建 | ~20次 | 500次 | 4% |
| Supabase 数据库 | ~50MB | 500MB | 10% |
| Supabase 认证用户 | ~100 | 50,000 | 0.2% |
| R2 存储 | ~2GB | 10GB | 20% |

对于个人博客，几乎不可能用完免费额度。即使接近上限，各服务也会邮件提醒。

---

## 成本总结

| 项目 | 月费 |
|------|------|
| 域名 | ￥0（使用 `*.pages.dev`） |
| 托管 | ￥0（Cloudflare Pages 无限免费） |
| 数据库 | ￥0（Supabase 500MB 免费） |
| 认证 | ￥0（Supabase Auth 50K 用户免费） |
| 图片存储 | ￥0（Cloudflare R2 10GB 免费） |
| 评论系统 | ￥0（Giscus + GitHub Discussions） |
| 站点分析 | ￥0（Cloudflare Web Analytics） |
| 代码仓库 | ￥0（GitHub 免费） |
| **总计** | **￥0.00/月** 🎉 |

---

> 📝 这份文档会随着项目更新而改进。有问题？在 GitHub Issues 中提问。

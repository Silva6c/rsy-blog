# RSY's Blog

基于 [Astro](https://astro.build) SSG + GitHub Pages 的个人技术博客，零运行成本。

## 技术栈

- **框架**: Astro v5（静态站点生成）
- **样式**: TailwindCSS v4 + CSS 变量主题
- **首页**: Canvas 2D 水族馆效果（自研波引擎，逐像素折射）
- **评论**: Giscus（数据存 GitHub Discussions）
- **部署**: GitHub Actions → GitHub Pages

## 本地开发

```bash
npm install
npm run dev
# http://localhost:4321/rsy-blog/
```

## 项目结构

```
src/
├── components/     # React/Astro 组件
├── content/blog/   # Markdown 文章
├── data/           # 项目展示等静态数据
├── layouts/        # 页面布局
├── lib/            # 工具函数、水体引擎
├── pages/          # 路由页面
└── styles/         # 全局 CSS
```

## 许可证

MIT License — 详见 [LICENSE](LICENSE)

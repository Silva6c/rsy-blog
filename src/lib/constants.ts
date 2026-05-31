// ─── 站点常量（从环境变量或默认值读取） ───

/** 站点名称 */
export const SITE_NAME = "RSY's 1st BLOG";

/** 站点描述 */
export const SITE_DESCRIPTION = "RSY 的个人技术博客 — 记录学习、思考与创造";

/** 站点 URL */
export const SITE_URL = import.meta.env.PROD
  ? 'https://silva6c.github.io'
  : 'http://localhost:4321';

/** 部署路径（GitHub Pages 项目页需要，本地开发时为空） */
export const BASE = import.meta.env.BASE_URL; // 生产: '/rsy-blog/' 开发: '/'

// ─── Supabase（客户端安全变量） ───

/** Supabase 项目 URL */
export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;

/** Supabase Anon Key — 可安全暴露 */
export const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

// ─── Giscus 评论 ───

/** Giscus 仓库 */
export const GISCUS_REPO = import.meta.env.PUBLIC_GISCUS_REPO as string;

/** Giscus 仓库 ID */
export const GISCUS_REPO_ID = import.meta.env.PUBLIC_GISCUS_REPO_ID as string;

/** Giscus 分类 ID */
export const GISCUS_CATEGORY_ID = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID as string;

// ─── R2 图片存储 ───

/** R2 公网访问 URL 前缀 */
export const R2_PUBLIC_URL = import.meta.env.PUBLIC_R2_PUBLIC_URL as string;

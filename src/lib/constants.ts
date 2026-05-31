// ─── 站点常量（从环境变量或默认值读取） ───

/** 站点名称 */
export const SITE_NAME = 'Zero Cost Blog';

/** 站点描述 */
export const SITE_DESCRIPTION = '一个零运行成本的个人技术博客';

/** 站点 URL（部署后替换为实际域名） */
export const SITE_URL = import.meta.env.PROD
  ? 'https://YOUR-DOMAIN.pages.dev'
  : 'http://localhost:4321';

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

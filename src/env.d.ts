/// <reference types="astro/client" />

// 环境变量类型声明
interface ImportMetaEnv {
  /** Supabase 项目 URL（公开） */
  readonly PUBLIC_SUPABASE_URL: string;
  /** Supabase Anon Key（公开） */
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  /** Giscus 仓库（格式：owner/repo） */
  readonly PUBLIC_GISCUS_REPO: string;
  /** Giscus 仓库 ID */
  readonly PUBLIC_GISCUS_REPO_ID: string;
  /** Giscus 分类 ID */
  readonly PUBLIC_GISCUS_CATEGORY_ID: string;
  /** R2 公网访问域名 */
  readonly PUBLIC_R2_PUBLIC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

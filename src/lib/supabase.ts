// ─── Supabase 客户端（惰性初始化） ───
//
// 仅在客户端运行时创建实例，避免构建时报错。
// 使用前必须在 .env 中配置 PUBLIC_SUPABASE_URL 和 PUBLIC_SUPABASE_ANON_KEY。

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** 缓存的 Supabase 客户端实例 */
let _client: SupabaseClient | null = null;
/** 是否已检查过配置 */
let _checked = false;

/**
 * 获取 Supabase 客户端实例
 *
 * 如果环境变量未配置，返回 null 并在控制台输出警告。
 */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  // 只在客户端环境创建
  if (typeof window === 'undefined') {
    return null;
  }

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (!_checked) {
      console.warn(
        '[零成本博客] Supabase 未配置。请在 .env 中设置 PUBLIC_SUPABASE_URL 和 PUBLIC_SUPABASE_ANON_KEY。',
      );
      _checked = true;
    }
    return null;
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}

/**
 * 检查用户是否已登录
 *
 * @returns 当前会话，未登录或未配置时返回 null
 */
export async function getCurrentSession() {
  const client = getSupabase();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

/**
 * 检查当前用户是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { data } = await client.auth.getUser();
  if (!data.user) return false;

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  return profile?.role === 'admin';
}

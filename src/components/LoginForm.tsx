// ─── 登录表单（毛玻璃风格） ───

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isConfigured =
    import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  /** 发送 Magic Link */
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    const supabase = getSupabase();
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase 未配置' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}admin`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: '已发送登录链接到你的邮箱，请检查收件箱（含垃圾邮件）',
      });
    }

    setLoading(false);
  };

  /** GitHub OAuth 登录 */
  const handleGitHubLogin = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase 未配置' });
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}admin`,
      },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    }
    setLoading(false);
  };

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>未配置</CardTitle>
          <CardDescription>
            Supabase 环境变量未设置。请在 .env 中配置 PUBLIC_SUPABASE_URL 和 PUBLIC_SUPABASE_ANON_KEY
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>欢迎回来</CardTitle>
        <CardDescription>通过以下方式登录管理面板</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Magic Link 登录 */}
        <form onSubmit={handleMagicLink} className="space-y-3">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" className="w-full" variant="glass" disabled={loading}>
            {loading ? '发送中...' : '发送登录链接'}
          </Button>
        </form>

        {/* 分隔线 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[hsl(var(--border))]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-[hsl(var(--muted-foreground))]">
              或者
            </span>
          </div>
        </div>

        {/* OAuth 登录 */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGitHubLogin}
          disabled={loading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub 登录
        </Button>

        {/* 消息提示 */}
        {message && (
          <div
            className={`rounded-[var(--radius)] p-3 text-sm ${
              message.type === 'success'
                ? 'bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--destructive))/0.1] text-[hsl(var(--destructive))]'
            }`}
          >
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

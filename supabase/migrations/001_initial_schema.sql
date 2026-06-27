-- ╔══════════════════════════════════════════════════════════════╗
-- ║         零成本博客 — 数据库初始化迁移                        ║
-- ║         执行方式：在 Supabase SQL Editor 中运行本文件        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ⚠️ 重要提示：
-- 本迁移应在 Supabase 项目初始化完成后执行。
-- Supabase 已经内置了 auth.users 表（认证系统），
-- 本文件只创建扩展表和业务表。

-- ──────────────────────────────────────────────────────────────
-- 1. 用户扩展表（关联 Supabase Auth）
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  bio         TEXT DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'author'
              CHECK (role IN ('admin', 'author')),
  website     TEXT,
  github      TEXT,
  twitter     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS '用户扩展资料表 — 关联 auth.users';
COMMENT ON COLUMN public.profiles.role IS '角色：admin 可管理所有文章，author 只能管理自己的';

-- ──────────────────────────────────────────────────────────────
-- 2. 文章表
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE
               CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        TEXT NOT NULL,
  excerpt      TEXT DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  cover_image  TEXT,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published', 'archived')),
  author_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.articles IS '博客文章表';
COMMENT ON COLUMN public.articles.slug IS 'URL 友好的唯一标识，如 hello-world';
COMMENT ON COLUMN public.articles.status IS 'draft=草稿 / published=已发布 / archived=已归档';

-- 文章查询索引
CREATE INDEX IF NOT EXISTS idx_articles_slug     ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status   ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author   ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_pubdate  ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_tags     ON public.articles USING GIN(tags);

-- ──────────────────────────────────────────────────────────────
-- 3. 自动更新时间触发器
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表添加自动更新
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 为 articles 表添加自动更新
DROP TRIGGER IF EXISTS set_updated_at_articles ON public.articles;
CREATE TRIGGER set_updated_at_articles
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 4. 新用户自动创建 Profile
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- 注册触发器：每次新用户注册自动创建 profile 记录
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 5. Row Level Security（RLS）策略
-- ──────────────────────────────────────────────────────────────

-- 5a. 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles  ENABLE ROW LEVEL SECURITY;

-- 5b. profiles 策略
-- 所有人可以查看公开资料
CREATE POLICY "公开资料可见" ON public.profiles
  FOR SELECT USING (true);

-- 用户只能修改自己的资料
CREATE POLICY "用户可修改自己的资料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5c. articles 策略
-- 任何人都可以查看已发布的文章
CREATE POLICY "已发布文章公开可读" ON public.articles
  FOR SELECT USING (status = 'published');

-- 作者可以查看自己的所有文章（含草稿）
CREATE POLICY "作者可查看自己的全部文章" ON public.articles
  FOR SELECT USING (auth.uid() = author_id);

-- 管理员可以查看所有文章
CREATE POLICY "管理员可查看所有文章" ON public.articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理员和作者可以创建文章
CREATE POLICY "管理员和作者可创建文章" ON public.articles
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'author')
    )
  );

-- 管理员和作者可以修改自己的文章
CREATE POLICY "作者可修改自己的文章" ON public.articles
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 管理员可以修改所有文章
CREATE POLICY "管理员可修改所有文章" ON public.articles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理员和作者可以删除自己的文章
CREATE POLICY "作者可删除自己的文章" ON public.articles
  FOR DELETE USING (auth.uid() = author_id);

-- 管理员可以删除所有文章
CREATE POLICY "管理员可删除所有文章" ON public.articles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 6. 初始管理员设置指南
-- ──────────────────────────────────────────────────────────────

-- 注册第一个用户后，运行以下 SQL 将其设为管理员：
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE id = '<你的-user-id>';
--
-- 获取 user id 的方法：
--   SELECT id, email FROM auth.users;

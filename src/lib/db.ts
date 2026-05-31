// ─── Drizzle ORM 数据库 Schema 定义 ───
//
// 用途：
// 1. 提供 TypeScript 类型安全的数据库操作
// 2. 未来构建在线编辑面板时使用
// 3. 当前博客以 Markdown 驱动，Supabase 仅用于 Auth
//
// 注意：本文件不引入运行时依赖（drizzle-orm 的 schema 模块是纯类型定义）

import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';

// ─── 用户扩展资料表 ───

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(), // 关联 auth.users(id)
    displayName: text('display_name').notNull().default(''),
    avatarUrl: text('avatar_url'),
    bio: text('bio').default(''),
    role: text('role').notNull().default('author'),
    website: text('website'),
    github: text('github'),
    twitter: text('twitter'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // 注意：PK 约束已通过 primaryKey() 定义，CASCADE 在 Supabase 迁移 SQL 中处理
  ],
);

// ─── 文章表 ───

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(), // 唯一 URL 标识
    title: text('title').notNull(),
    excerpt: text('excerpt').default(''),
    content: text('content').notNull().default(''),
    coverImage: text('cover_image'),
    tags: text('tags').array().notNull().default([]),
    status: text('status').notNull().default('draft'),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_articles_slug').on(table.slug),
    index('idx_articles_status').on(table.status),
    index('idx_articles_author').on(table.authorId),
    index('idx_articles_pubdate').on(table.publishedAt),
  ],
);

// ─── TypeScript 类型导出 ───

/** 用户资料 */
export type Profile = typeof profiles.$inferSelect;
/** 新建用户资料 */
export type NewProfile = typeof profiles.$inferInsert;

/** 文章 */
export type Article = typeof articles.$inferSelect;
/** 新建文章 */
export type NewArticle = typeof articles.$inferInsert;

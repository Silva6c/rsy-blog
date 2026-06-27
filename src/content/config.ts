import { defineCollection, z } from 'astro:content';

/** 博客文章集合 */
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    /** 文章标题 */
    title: z.string(),
    /** 文章摘要（用于列表展示和 SEO） */
    excerpt: z.string().optional(),
    /** 发布日期 */
    publishedAt: z.date(),
    /** 更新日期 */
    updatedAt: z.date().optional(),
    /** 是否为草稿（草稿不会出现在首页） */
    draft: z.boolean().default(false),
    /** 标签 */
    tags: z.array(z.string()).default([]),
    /** 封面图片 URL（R2 或本地路径） */
    coverImage: z.string().optional(),
    /** 作者显示名 */
    author: z.string().default('Admin'),
  }),
});

export const collections = {
  blog: blogCollection,
};

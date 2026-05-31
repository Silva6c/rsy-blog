// ─── RSS 订阅源 ───
// 自动从 Content Collection 生成 RSS XML

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, BASE } from '@/lib/constants';

export async function GET() {
  const articles = await getCollection('blog');
  const published = articles
    .filter((a) => !a.data.draft)
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: SITE_URL,
    items: published.map((article) => ({
      title: article.data.title,
      description: article.data.excerpt ?? '',
      pubDate: article.data.publishedAt,
      link: `${BASE}blog/${article.slug}`,
      categories: article.data.tags,
      author: article.data.author,
    })),
    customData: `<language>zh-CN</language>`,
  });
}

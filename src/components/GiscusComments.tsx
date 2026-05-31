// ─── Giscus 评论组件（React Island） ───
// 基于 GitHub Discussions，完全免费，无广告

import { useEffect, useRef } from 'react';
import { GISCUS_REPO, GISCUS_REPO_ID, GISCUS_CATEGORY_ID } from '@/lib/constants';

export default function GiscusComments() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 避免重复加载
    if (containerRef.current?.querySelector('iframe')) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    // Giscus 配置
    script.setAttribute('data-repo', GISCUS_REPO);
    script.setAttribute('data-repo-id', GISCUS_REPO_ID);
    script.setAttribute('data-category-id', GISCUS_CATEGORY_ID);
    script.setAttribute('data-category', 'Announcements');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('data-loading', 'lazy');

    containerRef.current?.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="mt-12 border-t border-[hsl(var(--border))] pt-8">
      <h2 className="mb-6 text-lg font-semibold">评论</h2>
      {(!GISCUS_REPO || !GISCUS_REPO_ID || !GISCUS_CATEGORY_ID) ? (
        <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          <p>评论功能尚未配置</p>
          <p class="mt-1 text-xs">
            请在 <code className="rounded bg-[hsl(var(--code-bg))] px-1 py-0.5">.env</code> 中设置
            <code className="rounded bg-[hsl(var(--code-bg))] px-1 py-0.5 ml-1">PUBLIC_GISCUS_*</code> 变量
          </p>
        </div>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}

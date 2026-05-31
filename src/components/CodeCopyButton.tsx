// ─── 代码块复制按钮 ───

import { useState, useEffect, useCallback } from 'react';

export default function CodeCopyButton() {
  const [buttons, setButtons] = useState<
    Array<{ pre: HTMLPreElement; button: HTMLButtonElement }>
  >([]);

  const cleanup = useCallback(() => {
    buttons.forEach(({ button }) => button.remove());
    setButtons([]);
  }, [buttons]);

  useEffect(() => {
    cleanup();

    const preElements = document.querySelectorAll('article pre');
    const newButtons: Array<{ pre: HTMLPreElement; button: HTMLButtonElement }> = [];

    preElements.forEach((pre) => {
      // 创建按钮
      const button = document.createElement('button');
      button.className =
        'glass-button absolute top-2 right-2 rounded-md p-1.5 text-xs opacity-0 transition-opacity group-hover:opacity-100';
      button.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      button.setAttribute('aria-label', '复制代码');
      button.setAttribute('title', '复制代码');

      button.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        const text = code?.textContent ?? pre.textContent ?? '';
        try {
          await navigator.clipboard.writeText(text);
          button.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
          setTimeout(() => {
            button.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
          }, 2000);
        } catch {
          // 剪贴板 API 不可用
        }
      });

      // 包装 pre 为相对定位容器
      if (!pre.style.position || pre.style.position === 'static') {
        pre.style.position = 'relative';
      }
      pre.classList.add('group');
      pre.appendChild(button);
      newButtons.push({ pre, button });
    });

    setButtons(newButtons);
    return cleanup;
  }, []);

  // 返回 null — 这个组件纯副作用驱动，不渲染任何 JSX
  return null;
}

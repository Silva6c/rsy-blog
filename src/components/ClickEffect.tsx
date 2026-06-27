// ─── 点击涟漪效果 ───
// 点击页面任意位置产生涟漪扩散动画

import { useEffect, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export default function ClickEffect() {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;

      // 忽略在按钮、链接、输入框上的点击（它们有自己的交互反馈）
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, [role="button"]')) return;

      const id = ++counterRef.current;
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.setProperty('--ripple-id', String(id));
      el.appendChild(ripple);

      // 动画结束后移除
      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ isolation: 'isolate' }}
    >
      <style>{`
        .click-ripple {
          position: fixed;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          animation: ripple-expand 0.6s ease-out forwards;
          pointer-events: none;
        }
        @keyframes ripple-expand {
          0% { width: 0; height: 0; opacity: 0.8; }
          100% { width: 80px; height: 80px; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

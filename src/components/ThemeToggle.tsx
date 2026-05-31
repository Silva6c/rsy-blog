// ─── 主题切换按钮（三态：深色 / 浅色 / 自动） ───

import { useState, useEffect } from 'react';

type Mode = 'dark' | 'light' | 'auto';

const STORAGE_KEY = 'theme-mode';
const CYCLE: Mode[] = ['dark', 'light', 'auto'];

function resolveTheme(mode: Mode): 'dark' | 'light' {
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applyTheme(mode: Mode) {
  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('dark');
  const [systemDark, setSystemDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
    const initial = stored && CYCLE.includes(stored) ? stored : 'dark';
    setMode(initial);
    applyTheme(initial);

    // 监听系统主题变化（auto 模式需要）
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const idx = CYCLE.indexOf(mode);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setMode(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch { /* 无痕模式 */ }
  };

  const currentTheme = mode === 'auto' ? (systemDark ? 'dark' : 'light') : mode;

  return (
    <button
      onClick={toggle}
      className="glass-button rounded-lg p-2 transition-all hover:scale-110"
      aria-label={`当前: ${mode === 'auto' ? '自动' : mode === 'dark' ? '深色' : '浅色'}，点击切换`}
      title={mode === 'auto' ? '自动（跟随系统）' : mode === 'dark' ? '深色模式' : '浅色模式'}
    >
      {/* 深色图标 */}
      {currentTheme === 'dark' && (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      {/* 浅色图标 */}
      {currentTheme === 'light' && (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
      {/* auto 指示点 */}
      {mode === 'auto' && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--primary))] opacity-40" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))]" />
        </span>
      )}
    </button>
  );
}

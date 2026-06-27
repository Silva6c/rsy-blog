// ─── 主题切换按钮（三态循环：深色 → 浅色 → 自动 → 深色） ───
// 图标语义：「点击我会切到什么模式」

import { useState, useEffect } from 'react';

type Mode = 'dark' | 'light' | 'auto';

const STORAGE_KEY = 'theme-mode';
const CYCLE: Mode[] = ['dark', 'light', 'auto'];

/** 根据时区判断白天/夜间（6:00–18:00 为白天） */
function isDaytimeByTimezone(): boolean {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 6 && hours < 18;
}

/** 获取 auto 模式下应展示的主题 */
function resolveAuto(): 'dark' | 'light' {
  return isDaytimeByTimezone() ? 'light' : 'dark';
}

function applyTheme(mode: Mode) {
  if (mode === 'auto') {
    const t = resolveAuto();
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-theme-mode', 'auto');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.removeAttribute('data-theme-mode');
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('dark');
  // auto 模式下的实际主题，用于图标显示
  const [autoTheme, setAutoTheme] = useState<'dark' | 'light'>(resolveAuto());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
    const initial = stored && CYCLE.includes(stored) ? stored : 'dark';
    setMode(initial);
    applyTheme(initial);

    // 每分钟检查时区变化（跨 6:00/18:00 边界时自动切换）
    if (initial === 'auto') {
      const timer = setInterval(() => {
        const t = resolveAuto();
        setAutoTheme(t);
        document.documentElement.setAttribute('data-theme', t);
      }, 60_000);
      return () => clearInterval(timer);
    }
  }, []);

  const toggle = () => {
    const idx = CYCLE.indexOf(mode);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setMode(next);
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* 无痕 */ }

    if (next === 'auto') {
      const t = resolveAuto();
      setAutoTheme(t);
      // 启动定时器
      const timer = setInterval(() => {
        const newT = resolveAuto();
        setAutoTheme(newT);
        document.documentElement.setAttribute('data-theme', newT);
      }, 60_000);
      // 简单处理：用全局变量存 timer id
      (window as any).__themeTimer = timer;
    } else {
      clearInterval((window as any).__themeTimer);
    }
  };

  // 决定按钮图标 & 文字
  const isAuto = mode === 'auto';

  return (
    <button
      onClick={toggle}
      className="glass-button relative rounded-lg p-2 text-xs font-medium transition-all hover:scale-110 min-w-[36px] flex items-center justify-center"
      aria-label={
        isAuto ? '自动模式（根据时区）' :
        mode === 'dark' ? '深色模式，点击切换浅色' :
        '浅色模式，点击切换深色'
      }
      title={
        isAuto ? '自动模式（6:00–18:00 浅色，18:00–6:00 深色）' :
        mode === 'dark' ? '点击切换浅色模式' :
        '点击切换深色模式'
      }
    >
      {isAuto ? (
        /* 自动模式 — "AUTO" 文字标签 */
        <span class="text-[11px] font-bold tracking-wider text-[hsl(var(--primary))]">
          AUTO
        </span>
      ) : mode === 'dark' ? (
        /* 深色模式 — 太阳图标（表示点击切换到浅色） */
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
      ) : (
        /* 浅色模式 — 月亮图标（表示点击切换到深色） */
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

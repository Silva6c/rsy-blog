// ─── 全屏背景图片层 ───
// 深色/浅色模式各一套图，主题切换时同步更换
// 图片存放在 public/images/backgrounds/

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL;

/** 深色模式背景图（放 public/images/backgrounds/dark/） */
const DARK_IMAGES = [
  `${BASE}images/backgrounds/dark/01_dark.png`,
  `${BASE}images/backgrounds/dark/02_dark.png`,
  `${BASE}images/backgrounds/dark/03_dark.png`,
  `${BASE}images/backgrounds/dark/04_dark.png`,
  `${BASE}images/backgrounds/dark/05_dark.png`,
  `${BASE}images/backgrounds/dark/06_dark.jpg`,
];

/** 浅色模式背景图（放 public/images/backgrounds/light/） */
const LIGHT_IMAGES = [
  `${BASE}images/backgrounds/light/01_light.png`,
  `${BASE}images/backgrounds/light/02_light.png`,
  `${BASE}images/backgrounds/light/03_light.png`,
  `${BASE}images/backgrounds/light/04_light.png`,
  `${BASE}images/backgrounds/light/05_light.png`,
  `${BASE}images/backgrounds/light/06_light.jpg`,
];

const INTERVAL = 30000;

export default function BackgroundImage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const images = theme === 'light' ? LIGHT_IMAGES : DARK_IMAGES;
  const [current, setCurrent] = useState(0);
  const prevTheme = useRef(theme);

  // 监听主题切换
  useEffect(() => {
    const el = document.documentElement;
    const update = () =>
      setTheme(el.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // 主题切换时重置索引，避免跨组越界
  useEffect(() => {
    if (prevTheme.current !== theme) {
      setCurrent(0);
      prevTheme.current = theme;
    }
  }, [theme]);

  // 定时切换（依赖 theme 确保切换主题时重建定时器）
  useEffect(() => {
    if (INTERVAL <= 0 || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [images.length, theme]);

  return (
    <div className="fixed inset-0 z-[-3] overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${theme}-${current}`}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${images[current]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </AnimatePresence>
    </div>
  );
}

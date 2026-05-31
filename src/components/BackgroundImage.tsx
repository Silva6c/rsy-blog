// ─── 全屏背景图片层 ───
// 背景图片存放在 public/images/backgrounds/

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL;

const IMAGES = [
  `${BASE}images/backgrounds/01-dark-abstract.jpg`,
  `${BASE}images/backgrounds/02-blue-abstract.jpg`,
  `${BASE}images/backgrounds/03-dark-flow.jpg`,
  `${BASE}images/backgrounds/04-starry-night.jpg`,
];

const INTERVAL = 30000;

export default function BackgroundImage() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

  useEffect(() => {
    IMAGES.forEach((url, i) => {
      if (loaded.has(i)) return;
      const img = new Image();
      img.onload = () => setLoaded((prev) => new Set([...prev, i]));
      img.src = url;
    });
  }, []);

  useEffect(() => {
    if (INTERVAL <= 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % IMAGES.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const overlayStyle =
    theme === 'light'
      ? {
          // 浅色模式：轻奶白遮罩 + 微模糊，让暗图柔和融入
          background: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }
      : {
          // 深色模式：暗紫遮罩保持氛围
          background: 'rgba(15, 11, 46, 0.35)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        };

  return (
    <div className="fixed inset-0 z-[-3] overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${IMAGES[current]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </AnimatePresence>

      {/* 主题感知遮罩 */}
      <div className="absolute inset-0" style={overlayStyle} />
    </div>
  );
}

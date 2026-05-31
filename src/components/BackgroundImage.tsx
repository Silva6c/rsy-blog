// ─── 全屏背景图片层 ───
// 背景图片存放在 public/images/backgrounds/
// 替换图片：替换该目录下的 jpg 文件即可

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

      {/* 只用一层轻遮罩保证文字可读，图片主体清晰可见 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(15, 11, 46, 0.35)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />
    </div>
  );
}

// ─── 全屏背景图片层 ───
// 背景图片存放在 public/images/backgrounds/
// 替换图片：替换该目录下的 jpg 文件即可，支持任意数量

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL; // 开发: '/'  生产: '/rsy-blog/'

/** 背景图片列表（本地文件，存放在 public/images/backgrounds/） */
const IMAGES = [
  `${BASE}images/backgrounds/01-dark-abstract.jpg`,
  `${BASE}images/backgrounds/02-blue-abstract.jpg`,
  `${BASE}images/backgrounds/03-dark-flow.jpg`,
  `${BASE}images/backgrounds/04-starry-night.jpg`,
];

/** 图片切换间隔（毫秒），设为 0 则禁用自动切换 */
const INTERVAL = 30000;

export default function BackgroundImage() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));

  // 预加载所有图片
  useEffect(() => {
    IMAGES.forEach((url, i) => {
      if (loaded.has(i)) return;
      const img = new Image();
      img.onload = () => setLoaded((prev) => new Set([...prev, i]));
      img.src = url;
    });
  }, []);

  // 定时切换
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${IMAGES[current]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </AnimatePresence>

      {/* 暗色遮罩 + 模糊 — 让图片融入背景渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, rgba(15,11,46,0.55) 0%, rgba(26,17,69,0.45) 50%, rgba(13,27,62,0.55) 100%)
          `,
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}
      />
    </div>
  );
}

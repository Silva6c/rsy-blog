// ─── 全屏背景图片层 ───
// 使用免费图源，毛玻璃博客的氛围感背景
// 可替换为自定义图片：修改下方的 IMAGES 数组即可

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** 背景图片列表（Unsplash 精选 · 暗色系抽象/科技风 · 免费使用） */
const IMAGES = [
  // 暗紫抽象
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
  // 深蓝粒子
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80',
  // 暗色抽象流
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80',
  // 深紫星空
  'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80',
  // 暗蓝纹理
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
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

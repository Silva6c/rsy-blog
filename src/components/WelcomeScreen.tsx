// ─── 欢迎屏幕（毛玻璃全屏动画） ───
// 参考 Kirameku 的 WelcomeScreen，首次访问显示

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 仅首次访问显示（sessionStorage 控制）
    const shown = sessionStorage.getItem('welcome-shown');
    if (!shown) {
      setShow(true);
      sessionStorage.setItem('welcome-shown', '1');
      // 3 秒后自动关闭
      const timer = setTimeout(() => setShow(false), 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClick = () => setShow(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          onClick={handleClick}
        >
          {/* 背景 */}
          <div className="absolute inset-0 bg-[#0f0b2e]/95 backdrop-blur-xl" />

          {/* 内容 */}
          <div className="relative text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-sm text-[hsl(var(--muted-foreground))] tracking-widest uppercase"
            >
              欢迎来到
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-4 text-5xl font-bold sm:text-6xl"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              <span className="text-gradient-brand">
                RSY's 1st BLOG
              </span>
            </motion.h1>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="mx-auto mt-6 h-[2px] rounded-full"
              style={{
                background: 'linear-gradient(to right, hsl(var(--primary)), #38bdf8)',
              }}
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="mt-6 text-base text-[hsl(var(--muted-foreground))]"
            >
              记录学习、思考与创造
            </motion.p>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

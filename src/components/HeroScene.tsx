// ─── 首页视频背景 ───
import { motion } from 'framer-motion';

const BASE = import.meta.env.BASE_URL;

export default function HeroScene() {
  return (
    <div className="relative flex min-h-[calc(100vh-180px)] items-center justify-center overflow-hidden">
      {/* 全屏视频背景 — 放大至裁切边界 */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-1/2 left-1/2 min-w-[120%] min-h-[120%] -translate-x-1/2 -translate-y-1/2 object-cover"
        poster={`${BASE}images/backgrounds/dark/01_dark.png`}
      >
        <source src={`${BASE}video/bg.mp4`} type="video/mp4" />
      </video>

      {/* 四周暗角遮罩 — 模糊边界 + 融入背景 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 40%, #0d0b1a 100%)
          `,
        }}
      />

      {/* 居中内容 */}
      <div className="relative z-10 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="text-5xl sm:text-7xl font-bold tracking-tight"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            textShadow: '0 0 80px rgba(99,102,241,0.3)',
          }}
        >
          <span className="text-gradient-brand">
            RSY's 1st BLOG
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mt-6 text-base sm:text-lg tracking-widest text-[hsl(var(--muted-foreground))]"
        >
          记录 · 思考 · 创造
        </motion.p>
      </div>
    </div>
  );
}

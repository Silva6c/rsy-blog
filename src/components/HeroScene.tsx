// ─── 首页视频背景 ───
import { motion } from 'framer-motion';

const BASE = import.meta.env.BASE_URL;

export default function HeroScene() {
  return (
    <div className="relative flex min-h-[calc(100vh-180px)] items-center justify-center overflow-hidden">
      {/* 全屏视频背景 */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster={`${BASE}images/backgrounds/dark/01_dark.png`}
      >
        <source src={`${BASE}video/bg.mp4`} type="video/mp4" />
      </video>

      {/* 暗色渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b1a]/60 via-transparent to-[#0d0b1a]/80" />

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

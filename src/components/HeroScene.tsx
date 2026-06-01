// ─── 首页 3D 大片场景 ───
// 纯 CSS 3D + framer-motion · 零外部资源

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/** 3D 浮动几何体 */
function FloatingShapes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: '1200px', perspectiveOrigin: 'center center' }}
    >
      {/* 中心大环 */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[500px] h-[500px] -ml-[250px] -mt-[250px] rounded-full border border-[hsl(var(--primary))/0.12]"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${60 + mouse.y * 8}deg) rotateY(${mouse.x * 15}deg)`,
          background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />

      {/* 中环 */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[380px] h-[380px] -ml-[190px] -mt-[190px] rounded-full border border-[hsl(var(--primary))/0.08]"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${70 + mouse.y * 5}deg) rotateY(${mouse.x * -12}deg) rotateZ(${mouse.x * 5}deg)`,
          background: 'radial-gradient(circle, rgba(168,85,247,0.03) 0%, transparent 70%)',
        }}
      />

      {/* 小环 */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[260px] h-[260px] -ml-[130px] -mt-[130px] rounded-full border border-[hsl(var(--primary))/0.15]"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${50 - mouse.y * 4}deg) rotateY(${mouse.x * 10}deg)`,
          boxShadow: '0 0 60px rgba(99,102,241,0.08), inset 0 0 60px rgba(99,102,241,0.04)',
        }}
      />

      {/* 浮动光点 */}
      {[
        { x: '30%', y: '25%', s: 120, d: 4, c: 'rgba(99,102,241,0.06)' },
        { x: '70%', y: '35%', s: 80, d: 3, c: 'rgba(168,85,247,0.05)' },
        { x: '20%', y: '65%', s: 100, d: 5, c: 'rgba(6,182,212,0.04)' },
        { x: '75%', y: '70%', s: 90, d: 4, c: 'rgba(99,102,241,0.05)' },
        { x: '50%', y: '15%', s: 70, d: 6, c: 'rgba(236,72,153,0.04)' },
      ].map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.s,
            height: orb.s,
            transform: `translate(-50%, -50%) translate3d(${mouse.x * -20 * orb.d}px, ${mouse.y * -20 * orb.d}px, ${-orb.d * 50}px)`,
            background: orb.c,
            transition: 'transform 0.8s ease-out',
          }}
        />
      ))}

      {/* 细粒子 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(99,102,241,0.3), transparent),
            radial-gradient(1px 1px at 60% 20%, rgba(168,85,247,0.3), transparent),
            radial-gradient(1px 1px at 40% 70%, rgba(99,102,241,0.25), transparent),
            radial-gradient(1px 1px at 80% 60%, rgba(6,182,212,0.25), transparent),
            radial-gradient(1px 1px at 10% 50%, rgba(236,72,153,0.2), transparent),
            radial-gradient(1px 1px at 70% 80%, rgba(99,102,241,0.2), transparent),
            radial-gradient(1px 1px at 30% 10%, rgba(168,85,247,0.25), transparent),
            radial-gradient(1px 1px at 50% 85%, rgba(6,182,212,0.2), transparent),
            radial-gradient(2px 2px at 55% 45%, rgba(99,102,241,0.4), transparent),
            radial-gradient(2px 2px at 25% 55%, rgba(168,85,247,0.35), transparent)
          `,
          transform: `translate3d(${mouse.x * -15}px, ${mouse.y * -15}px, 0)`,
          transition: 'transform 1s ease-out',
        }}
      />
    </div>
  );
}

/** 主标题 */
function HeroTitle() {
  return (
    <div className="relative z-10 text-center px-4">
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
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
        transition={{ duration: 0.6, delay: 1.2 }}
        className="mt-6 text-base sm:text-lg tracking-wide text-[hsl(var(--muted-foreground))]"
      >
        记录 · 思考 · 创造
      </motion.p>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ duration: 1, delay: 1.6, ease: 'easeOut' }}
        className="mx-auto mt-8 h-[1px] rounded-full"
        style={{
          background: 'linear-gradient(to right, transparent, hsl(var(--primary)), transparent)',
        }}
      />
    </div>
  );
}

export default function HeroScene() {
  return (
    <div className="relative flex min-h-[calc(100vh-180px)] items-center justify-center">
      <FloatingShapes />
      <HeroTitle />
    </div>
  );
}

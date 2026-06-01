// ─── Canvas 液态流体背景 — 多色 metaball + 光线折射 ───

import { useEffect, useRef } from 'react';

const BLOBS = [
  { x: 0.25, y: 0.35, r: 0.18, vx: 0.00012, vy: 0.00008, c: [99, 102, 241] },  // indigo
  { x: 0.70, y: 0.25, r: 0.15, vx: -0.00009, vy: 0.00011, c: [168, 85, 247] }, // purple
  { x: 0.50, y: 0.60, r: 0.20, vx: 0.00007, vy: -0.00006, c: [6, 182, 212] },  // cyan
  { x: 0.35, y: 0.70, r: 0.14, vx: -0.00010, vy: -0.00009, c: [236, 72, 153] }, // pink
  { x: 0.80, y: 0.65, r: 0.12, vx: 0.00008, vy: 0.00010, c: [129, 140, 248] }, // light indigo
  { x: 0.15, y: 0.15, r: 0.10, vx: 0.00013, vy: 0.00007, c: [192, 132, 252] }, // light purple
];

export default function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, raf = 0;
    const blobs = BLOBS.map(b => ({ ...b }));

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      raf = requestAnimationFrame(animate);

      // 更新 blob 位置（边界反弹 + 有机漂移）
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -0.1 || b.x > 1.1) b.vx *= -1;
        if (b.y < -0.1 || b.y > 1.1) b.vy *= -1;
      }

      // 清屏
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0d0b1a';
      ctx.fillRect(0, 0, w, h);

      // 绘制光晕背景（底部暖光照亮）
      ctx.globalCompositeOperation = 'lighter';
      const cx = w / 2, cy = h / 2;

      // 每个 blob 的柔光层
      for (const b of blobs) {
        const bx = b.x * w, by = b.y * h;
        const maxR = b.r * Math.max(w, h);
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, maxR * 2.5);
        const [r, g, bl] = b.c;
        grad.addColorStop(0, `rgba(${r},${g},${bl},0.35)`);
        grad.addColorStop(0.4, `rgba(${r},${g},${bl},0.12)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(bx - maxR * 2.5, by - maxR * 2.5, maxR * 5, maxR * 5);
      }

      // Metaball 融合层（高亮核心）
      for (const b of blobs) {
        const bx = b.x * w, by = b.y * h;
        const maxR = b.r * Math.max(w, h);
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, maxR * 0.6);
        const [r, g, bl] = b.c;
        grad.addColorStop(0, `rgba(${r},${g},${bl},0.7)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${bl},0.2)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(bx - maxR, by - maxR, maxR * 2, maxR * 2);
      }

      ctx.globalCompositeOperation = 'source-over';

      // 高光折射斑
      const time = performance.now() * 0.001;
      for (let i = 0; i < 3; i++) {
        const sx = (0.2 + i * 0.3 + Math.sin(time * 0.3 + i) * 0.05) * w;
        const sy = (0.3 + i * 0.2 + Math.cos(time * 0.4 + i) * 0.08) * h;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 120);
        g.addColorStop(0, 'rgba(255,255,255,0.06)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(sx - 150, sy - 150, 300, 300);
      }
    };

    animate();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-3] pointer-events-none"
    />
  );
}

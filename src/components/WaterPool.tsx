// ─── Canvas 光追风格水面 — 波光反射 + 焦散 ───
// 不用 Three.js，纯 Canvas 像素级控制

import { useEffect, useRef } from 'react';

const GRID = 120;          // 波场分辨率
const DAMPING = 0.985;     // 衰减
const SPEED = 0.22;        // 波速

export default function WaterPool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = 0, h = 0, animId = 0;

    // 三缓冲区高度场
    const N = GRID + 1;
    let h0 = new Float32Array(N * N);
    let h1 = new Float32Array(N * N);
    let h2 = new Float32Array(N * N);

    // 光折射偏移 → 用于焦散绘制
    let causticMap = new Float32Array(N * N);

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── 鼠标涟漪 ───
    const onMouse = (mx: number, my: number) => {
      // 屏幕坐标 → 波场索引（水占下半屏 45%~100%）
      const ix = Math.round((mx / w) * GRID);
      const iy = Math.round(((my - h * 0.45) / (h * 0.55)) * GRID);
      if (ix < 1 || ix >= N - 1 || iy < 1 || iy >= N - 1) return;
      const impulse = 0.6;
      for (let di = -8; di <= 8; di++) {
        for (let dj = -8; dj <= 8; dj++) {
          const ni = ix + di, nj = iy + dj;
          if (ni < 0 || ni >= N || nj < 0 || nj >= N) continue;
          h1[ni * N + nj] += impulse * Math.exp(-(di * di + dj * dj) / 14);
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => onMouse(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) onMouse(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouch);

    // ─── 渲染一帧 ───
    const render = () => {
      animId = requestAnimationFrame(render);

      // 1. 波方程时间步
      const c = SPEED;
      for (let i = 1; i < N - 1; i++) {
        for (let j = 1; j < N - 1; j++) {
          const idx = i * N + j;
          const lap = h1[idx - N] + h1[idx + N] + h1[idx - 1] + h1[idx + 1] - 4 * h1[idx];
          h2[idx] = (2 * h1[idx] - h0[idx] + c * lap) * DAMPING;
        }
      }

      // 随机微扰
      if (Math.random() < 0.05) {
        const rx = 1 + Math.floor(Math.random() * (N - 2));
        const ry = 1 + Math.floor(Math.random() * (N - 2));
        for (let di = -2; di <= 2; di++)
          for (let dj = -2; dj <= 2; dj++) {
            const ni = rx + di, nj = ry + dj;
            if (ni >= 0 && ni < N && nj >= 0 && nj < N)
              h1[ni * N + nj] += 0.04 * Math.exp(-(di * di + dj * dj) / 2);
          }
      }

      // 计算焦散强度图（波面曲率 → 光线聚焦）
      for (let i = 1; i < N - 1; i++) {
        for (let j = 1; j < N - 1; j++) {
          const idx = i * N + j;
          const dx = h2[idx + 1] - h2[idx - 1];
          const dy = h2[idx + N] - h2[idx - N];
          causticMap[idx] = Math.abs(dx) + Math.abs(dy);
        }
      }

      // 2. 绘制
      ctx.clearRect(0, 0, w, h);

      // 底色（深蓝黑）
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(0, 0, w, h);

      // 水面区域 — 下半屏（0.45~1.0）
      const waterTop = h * 0.45;
      const waterBot = h;
      const waterH = waterBot - waterTop;
      const cellW = w / GRID;
      const cellH = waterH / GRID;

      // 水下底色渐变
      const underGrad = ctx.createLinearGradient(0, waterTop, 0, waterBot);
      underGrad.addColorStop(0, 'rgba(10,20,50,0.9)');
      underGrad.addColorStop(0.5, 'rgba(8,15,40,0.95)');
      underGrad.addColorStop(1, 'rgba(5,8,25,0.98)');
      ctx.fillStyle = underGrad;
      ctx.fillRect(0, waterTop, w, waterH);

      // 焦散光斑（水下投射）— 降低阈值让效果可见
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const idx = i * N + j;
          const caustic = causticMap[idx];
          if (caustic > 0.002) {
            const cx = i * cellW;
            const cy = waterTop + j * cellH;
            const alpha = Math.min(caustic * 8, 0.3);
            const r = cellW * 2;
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, `rgba(100,160,255,${alpha})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
          }
        }
      }

      // 水面镜面反射线（波峰高光）
      ctx.strokeStyle = 'rgba(180,220,255,0.2)';
      ctx.lineWidth = 2;
      for (let i = 0; i < N - 1; i++) {
        for (let j = 0; j < N - 1; j++) {
          const idx = i * N + j;
          const hCur = h2[idx];
          const hNext = h2[idx + 1];
          // 波峰检测 — 降低阈值
          if (hCur > 0.003 && hCur > hNext && hCur > h2[idx - 1]) {
            const x = i * cellW;
            const y = waterTop + j * cellH + hCur * 60;
            ctx.globalAlpha = Math.min(hCur * 30, 0.7);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellW, y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // 水平线光晕
      const horGrad = ctx.createLinearGradient(0, waterTop - 3, 0, waterTop + 20);
      horGrad.addColorStop(0, 'rgba(130,170,255,0.0)');
      horGrad.addColorStop(0.3, 'rgba(130,170,255,0.12)');
      horGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = horGrad;
      ctx.fillRect(0, waterTop - 3, w, 23);

      // 缓冲区轮转
      [h0, h1, h2] = [h1, h2, h0];
      h2.fill(0);
    };

    render();

    // IntersectionObserver
    const observer = new IntersectionObserver(
      ([e]) => { if (!e.isIntersecting) cancelAnimationFrame(animId); else { animId = requestAnimationFrame(render); } },
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-3]" />;
}

// ─── 水族馆水壁 — 折射扭曲 + 水面线晃荡 ───
// 水透明不可见，仅通过背景扭曲和水面线感知其存在

import { useEffect, useRef } from 'react';

const SAMPLES = 180;          // 水面线采样点
const DAMPING = 0.955;        // 更硬更快衰减
const SPEED = 0.1;            // 更慢更稳
const REFRACT = 0.018;        // 折射稍强

export default function WaterPool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = 0, h = 0, animId = 0;

    // 离屏背景画布
    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d')!;

    // ─── 水面线波场（一维） ───
    const N = SAMPLES + 1;
    let w0 = new Float32Array(N);
    let w1 = new Float32Array(N);
    let w2 = new Float32Array(N);

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      offscreen.width = w;
      offscreen.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── 画背景到离屏 Canvas ───
    const drawBackground = () => {
      // 白色底
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, w, h);
      // 浅灰装饰圆
      octx.fillStyle = 'rgba(0,0,0,0.03)';
      octx.beginPath(); octx.arc(w * 0.3, h * 0.3, 200, 0, Math.PI * 2); octx.fill();
      octx.fillStyle = 'rgba(0,0,0,0.02)';
      octx.beginPath(); octx.arc(w * 0.7, h * 0.5, 180, 0, Math.PI * 2); octx.fill();
      // 标题
      octx.fillStyle = '#111111';
      octx.font = `bold ${Math.min(w * 0.08, 80)}px "Noto Serif SC", serif`;
      octx.textAlign = 'center';
      octx.fillText("RSY's 1st BLOG", w / 2, h * 0.35);
      // tagline
      octx.fillStyle = 'rgba(0,0,0,0.4)';
      octx.font = `${Math.min(w * 0.025, 24)}px "Inter","Noto Sans SC",sans-serif`;
      octx.fillText('记录 · 思考 · 创造', w / 2, h * 0.35 + 50);
      octx.textAlign = 'start';
    };
    drawBackground();
    window.addEventListener('resize', drawBackground);

    // ─── 鼠标涟漪 ───
    const onMouse = (mx: number, my: number) => {
      const ix = Math.round((mx / w) * SAMPLES);
      if (ix < 2 || ix >= N - 2) return;
      const impulse = 0.3;   // 减轻鼠标冲击
      for (let d = -6; d <= 6; d++) {
        const ni = ix + d;
        if (ni >= 0 && ni < N) w1[ni] += impulse * Math.exp(-(d * d) / 16);
      }
    };
    const onMM = (e: MouseEvent) => onMouse(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { if (e.touches.length > 0) onMouse(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('touchmove', onTouch);

    // ─── 水面线高度（屏幕上的 Y 像素） ───
    const waterlineBase = () => h * 0.45;

    // ─── 渲染 ───
    const render = () => {
      animId = requestAnimationFrame(render);

      // 1. 波方程
      const c = SPEED;
      for (let i = 1; i < N - 1; i++) {
        const lap = w1[i - 1] + w1[i + 1] - 2 * w1[i];
        w2[i] = (2 * w1[i] - w0[i] + c * lap) * DAMPING;
      }
      // 随机微扰（更小更少）
      if (Math.random() < 0.02) {
        const ri = 1 + Math.floor(Math.random() * (N - 2));
        for (let d = -1; d <= 1; d++) {
          const ni = ri + d;
          if (ni >= 0 && ni < N) w1[ni] += 0.015 * Math.exp(-(d * d) / 1.5);
        }
      }

      // 2. 折射渲染
      const wlBase = waterlineBase();
      // 上半屏：直接拷贝背景
      ctx.drawImage(offscreen, 0, 0);
      // 下半屏：逐像素折射采样
      const imageData = ctx.getImageData(0, Math.floor(wlBase) - 5, w, h - Math.floor(wlBase) + 5);
      const src = octx.getImageData(0, Math.floor(wlBase) - 10, w, h - Math.floor(wlBase) + 10);
      const data = imageData.data;
      const sdata = src.data;
      const iw = imageData.width;
      const ih = imageData.height;

      for (let py = 0; py < ih; py++) {
        const screenY = wlBase + py;
        // 该行对应的水面线采样点
        const sampleIdx = Math.round((py / ih) * SAMPLES);
        const waveH = w2[Math.min(sampleIdx, N - 1)];
        const waveSlope = sampleIdx > 0 && sampleIdx < N - 1
          ? (w2[sampleIdx + 1] - w2[sampleIdx - 1]) : 0;

        // 折射偏移：越往下偏移越大（光线穿过更厚的水层）
        const depth = py / ih; // 0 at surface, 1 at bottom
        const offsetX = (waveSlope * 60 + waveH * 2) * depth * REFRACT * w;

        for (let px = 0; px < iw; px++) {
          const srcX = Math.round(px + offsetX);
          const clampedX = Math.max(0, Math.min(iw - 1, srcX));
          const srcIdx = (py * iw + clampedX) * 4;
          const dstIdx = (py * iw + px) * 4;
          data[dstIdx] = sdata[srcIdx];
          data[dstIdx + 1] = sdata[srcIdx + 1];
          data[dstIdx + 2] = sdata[srcIdx + 2];
          data[dstIdx + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, Math.floor(wlBase) - 5);

      // 蓝色水体覆盖（下半屏）
      ctx.fillStyle = 'rgba(150,200,235,0.28)';
      ctx.fillRect(0, wlBase, w, h - wlBase);

      // 3. 水面线（切面轮廓）
      ctx.beginPath();
      const segW = w / SAMPLES;
      for (let i = 0; i <= SAMPLES; i++) {
        const x = i * segW;
        const y = wlBase + w2[i] * 35;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 4. 波峰高光点
      for (let i = 1; i < SAMPLES; i++) {
        if (w2[i] > 0.004 && w2[i] > w2[i - 1] && w2[i] > w2[i + 1]) {
          const x = i * segW;
          const y = wlBase + w2[i] * 35;
          const alpha = Math.min(w2[i] * 40, 0.5);
          const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
          g.addColorStop(0, `rgba(255,255,255,${alpha * 1.5})`);
          g.addColorStop(0.5, `rgba(200,220,255,${alpha})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - 10, y - 10, 20, 20);
        }
      }

      // 缓冲区轮转
      [w0, w1, w2] = [w1, w2, w0];
      w2.fill(0);
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
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', drawBackground);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-3]" />;
}

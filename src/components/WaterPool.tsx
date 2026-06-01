// ─── 水族馆水壁 — 刚体水面倾斜 + 折射扭曲 ───
// 水面是一条笔直的线，但可以倾斜和上下平移
// 鼠标划过 → 水面倾角改变 → 水体内部折射扭曲

import { useEffect, useRef } from 'react';

const STIFFNESS = 8;          // 弹簧刚度
const DAMPING = 3.5;          // 弹簧阻尼
const MAX_TILT = 0.4;         // 最大倾角 (rad)
const REFRACT = 0.028;        // 折射强度

export default function WaterPool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = 0, h = 0, animId = 0;

    // 离屏背景
    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d')!;

    // ─── 刚体水面状态 ───
    let tiltAngle = 0;        // 水面倾角 (rad)
    let offsetY = 0;          // 水面中点垂直位移 (px)
    let tiltVel = 0;          // 倾角速度
    let offsetVel = 0;        // 位移速度
    let targetTilt = 0;       // 目标倾角
    let targetOffset = 0;     // 目标位移
    let lastMX = 0, lastMY = 0, lastT = performance.now();

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      offscreen.width = w;
      offscreen.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── 背景 ───
    const drawBg = () => {
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, w, h);
      octx.fillStyle = 'rgba(0,0,0,0.03)';
      octx.beginPath(); octx.arc(w * 0.3, h * 0.3, 200, 0, Math.PI * 2); octx.fill();
      octx.fillStyle = 'rgba(0,0,0,0.02)';
      octx.beginPath(); octx.arc(w * 0.7, h * 0.5, 180, 0, Math.PI * 2); octx.fill();
      octx.fillStyle = '#111111';
      octx.font = `bold ${Math.min(w * 0.08, 80)}px "Noto Serif SC", serif`;
      octx.textAlign = 'center';
      octx.fillText("RSY's 1st BLOG", w / 2, h * 0.35);
      octx.fillStyle = 'rgba(0,0,0,0.4)';
      octx.font = `${Math.min(w * 0.025, 24)}px "Inter","Noto Sans SC",sans-serif`;
      octx.fillText('记录 · 思考 · 创造', w / 2, h * 0.35 + 50);
      octx.textAlign = 'start';
    };
    drawBg();
    window.addEventListener('resize', drawBg);

    // ─── 鼠标 → 目标倾角/位移 ───
    const onMouse = (mx: number, my: number) => {
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.1);
      if (dt <= 0) { lastT = now; lastMX = mx; lastMY = my; return; }
      const vx = (mx - lastMX) / dt;
      const vy = (my - lastMY) / dt;
      // 水平速度 → 水面倾斜, 垂直速度 → 水面升降
      targetTilt = THREE.MathUtils?.clamp(vx * 0.002, -MAX_TILT, MAX_TILT) ?? Math.max(-MAX_TILT, Math.min(MAX_TILT, vx * 0.002));
      targetOffset = Math.max(-30, Math.min(30, vy * -0.15));
      lastMX = mx; lastMY = my; lastT = now;
    };
    // clamp helper (no THREE import)
    const clamp = (v: number, lo: number, hi: number) => v < lo ? lo : v > hi ? hi : v;
    const onMM = (e: MouseEvent) => onMouse(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { if (e.touches.length > 0) onMouse(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('touchmove', onTouch);

    const waterlineBase = () => h * 0.45;

    // ─── 渲染 ───
    const render = () => {
      animId = requestAnimationFrame(render);

      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      // 弹簧物理：倾角
      tiltVel += (targetTilt - tiltAngle) * STIFFNESS * dt - tiltVel * DAMPING * dt;
      tiltAngle += tiltVel * dt;
      // 弹簧物理：位移
      offsetVel += (targetOffset - offsetY) * STIFFNESS * 0.8 * dt - offsetVel * DAMPING * 0.8 * dt;
      offsetY += offsetVel * dt;
      // 目标衰减
      targetTilt *= 0.95;
      targetOffset *= 0.95;

      const baseY = waterlineBase() + offsetY;

      // 上半屏：直接拷贝背景
      ctx.drawImage(offscreen, 0, 0);

      // 下半屏折射区域
      const topY = Math.floor(baseY) - 5;
      const regionH = h - topY;
      if (regionH <= 0) return;

      const imageData = ctx.getImageData(0, topY, w, regionH);
      const src = octx.getImageData(0, topY, w, regionH);
      const data = imageData.data;
      const sdata = src.data;
      const iw = imageData.width;
      const ih = imageData.height;

      for (let py = 0; py < ih; py++) {
        const depth = py / ih;
        const decay = Math.exp(-depth * 2.2);
        // 折射偏移 = 倾角驱动 + 深度衰减
        const offX = tiltAngle * 250 * decay * REFRACT * w;

        for (let px = 0; px < iw; px++) {
          const sx = Math.round(px + offX);
          const cx = clamp(sx, 0, iw - 1);
          const si = (py * iw + cx) * 4;
          const di = (py * iw + px) * 4;
          data[di] = sdata[si];
          data[di + 1] = sdata[si + 1];
          data[di + 2] = sdata[si + 2];
          data[di + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, topY);

      // 蓝色水体
      ctx.fillStyle = 'rgba(150,200,235,0.28)';
      ctx.fillRect(0, baseY, w, h - baseY);

      // 水面线 — 笔直 + 倾斜
      const leftY = baseY - tiltAngle * w / 2;
      const rightY = baseY + tiltAngle * w / 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, leftY);
      ctx.lineTo(w, rightY);
      ctx.stroke();

      // 水面微光晕
      const glowGrad = ctx.createLinearGradient(0, baseY - 5, 0, baseY + 5);
      glowGrad.addColorStop(0, 'rgba(200,220,255,0)');
      glowGrad.addColorStop(0.5, 'rgba(200,220,255,0.10)');
      glowGrad.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, baseY - 5, w, 10);
    };

    render();

    const observer = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) cancelAnimationFrame(animId);
        else { cancelAnimationFrame(animId); animId = requestAnimationFrame(render); }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', drawBg);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-3]" />;
}

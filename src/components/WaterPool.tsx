// ─── 水族馆水壁 — 三维波场 + 法线折射 ───
// h(x,z) 高度场：X=屏幕宽 Z=纵深。波在X-Z面传播。
// 折射由 ∂h/∂x 和 ∂h/∂z 共同决定。

import { useEffect, useRef } from 'react';

/* ── 波场参数 ── */
const WX = 200;               // X 方向采样数
const WZ = 40;                // Z 方向采样数
const WAVE_C = 0.15;          // 波速
const DAMPING = 0.98;         // 阻尼

/* ── 折射参数 ── */
const REFRACT_X = 2.2;        // X梯度→水平偏移系数
const REFRACT_Z = 0.8;        // Z梯度→垂直偏移系数

/* ── 弹簧参数（整体倾斜） ── */
const TILT_K = 8;
const TILT_D = 3.5;

export default function WaterPool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = 0, h = 0, animId = 0;

    /* ── 离屏背景 ── */
    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d')!;

    /* ── 三维波场 (WX+1) × (WZ+1) ── */
    const NX = WX + 1, NZ = WZ + 1;
    let h0 = new Float32Array(NX * NZ);
    let h1 = new Float32Array(NX * NZ);
    let h2 = new Float32Array(NX * NZ);

    /* ── Z 倾斜状态 ── */
    let zTilt = 0;            // 当前Z倾角
    let zTiltVel = 0;
    let zTiltTarget = 0;
    let lastMX = 0, lastMY = 0, lastT = performance.now();

    const clamp = (v: number, lo: number, hi: number) => v < lo ? lo : v > hi ? hi : v;

    /* ── 尺寸 ── */
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      offscreen.width = w;
      offscreen.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── 画背景 ── */
    const drawBg = () => {
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, w, h);
      // 装饰光斑
      octx.fillStyle = 'rgba(0,0,0,0.03)';
      octx.beginPath(); octx.arc(w * 0.3, h * 0.3, 200, 0, Math.PI * 2); octx.fill();
      octx.fillStyle = 'rgba(0,0,0,0.02)';
      octx.beginPath(); octx.arc(w * 0.7, h * 0.5, 180, 0, Math.PI * 2); octx.fill();
      // 标题 — 品牌渐变色
      const titleGrad = octx.createLinearGradient(0, 0, w, 0);
      titleGrad.addColorStop(0, '#6366f1');
      titleGrad.addColorStop(1, '#38bdf8');
      octx.fillStyle = titleGrad;
      octx.font = `bold ${Math.min(w * 0.08, 80)}px "Noto Serif SC", serif`;
      octx.textAlign = 'center';
      octx.fillText("RSY's 1st BLOG", w / 2, h * 0.55);
      octx.fillStyle = 'rgba(0,0,0,0.35)';
      octx.font = `${Math.min(w * 0.025, 24)}px "Inter","Noto Sans SC",sans-serif`;
      octx.fillText('记录 · 思考 · 创造', w / 2, h * 0.55 + 50);
      octx.textAlign = 'start';
    };
    drawBg();
    window.addEventListener('resize', drawBg);

    /* ── 鼠标 → 涟漪 + Z倾斜 ── */
    const onMouse = (mx: number, my: number) => {
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.1);
      if (dt <= 0) { lastT = now; lastMX = mx; lastMY = my; return; }
      const vx = (mx - lastMX) / dt;
      const vy = (my - lastMY) / dt;
      lastMX = mx; lastMY = my; lastT = now;

      // 只有鼠标在水中时（水面以下）才产生涟漪
      if (my > waterlineY()) {
        // Z倾斜目标（垂直速度）
        zTiltTarget = clamp(vy * -0.08, -40, 40);

        // 涟漪 — 注入脉冲到鼠标对应深度
        const ix = Math.round((mx / w) * WX);
        const depthFrac = clamp((my - waterlineY()) / (h - waterlineY()), 0, 1);
        const iz = Math.round(depthFrac * (NZ - 1));
        const impulse = 0.6 * (0.3 + depthFrac * 0.7); // 越深越强
        const spread = 6;
        for (let di = -spread; di <= spread; di++) {
          for (let dj = -spread; dj <= spread; dj++) {
            const ni = ix + di, nj = iz + dj;
            if (ni >= 0 && ni < NX && nj >= 0 && nj < NZ) {
              const d2 = di * di + dj * dj;
              h1[ni * NZ + nj] += impulse * Math.exp(-d2 / 10);
            }
          }
        }
      }
    };
    const onMM = (e: MouseEvent) => onMouse(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { if (e.touches.length > 0) onMouse(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('touchmove', onTouch);

    /* ── 水面基准线 ── */
    const waterlineY = () => h * 0.45;

    /* ── 渲染 ── */
    const render = () => {
      animId = requestAnimationFrame(render);
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      // 1. 二维波方程时间步
      const c = WAVE_C;
      for (let i = 1; i < NX - 1; i++) {
        for (let j = 1; j < NZ - 1; j++) {
          const idx = i * NZ + j;
          const lap = h1[idx - NZ] + h1[idx + NZ] + h1[idx - 1] + h1[idx + 1] - 4 * h1[idx];
          h2[idx] = (2 * h1[idx] - h0[idx] + c * lap) * DAMPING;
        }
      }

      // 2. 更新Z倾斜
      zTiltVel += (zTiltTarget - zTilt) * TILT_K * dt - zTiltVel * TILT_D * dt;
      zTilt += zTiltVel * dt;
      zTiltTarget *= 0.95;

      // 随机微扰
      if (Math.random() < 0.03) {
        const ri = 1 + Math.floor(Math.random() * (NX - 2));
        const rj = 1 + Math.floor(Math.random() * (NZ - 2));
        for (let di = -2; di <= 2; di++)
          for (let dj = -2; dj <= 2; dj++) {
            const ni = ri + di, nj = rj + dj;
            if (ni >= 0 && ni < NX && nj >= 0 && nj < NZ)
              h1[ni * NZ + nj] += 0.03 * Math.exp(-(di * di + dj * dj) / 3);
          }
      }

      // 3. 画上半屏（直接拷贝）
      ctx.drawImage(offscreen, 0, 0);

      // 4. 下半屏折射区域
      const wlBase = waterlineY();
      const topY = Math.floor(wlBase) - 8;
      const regionH = h - topY;
      if (regionH <= 0) { [h0, h1, h2] = [h1, h2, h0]; h2.fill(0); return; }

      const imageData = ctx.getImageData(0, topY, w, regionH);
      const src = octx.getImageData(0, topY, w, regionH);
      const data = imageData.data;
      const sdata = src.data;
      const iw_px = imageData.width;
      const ih_px = imageData.height;

      for (let py = 0; py < ih_px; py++) {
        // 当前像素对应的波场索引
        const screenY = topY + py;
        // Z坐标：距水面线越远 = 水体越深 = Z值越大
        const zFrac = clamp((screenY - wlBase) / (h - wlBase), 0, 1);
        const jCell = Math.round(zFrac * WZ);

        for (let px = 0; px < iw_px; px++) {
          const iCell = Math.round((px / iw_px) * WX);
          const idx = clamp(iCell, 0, NX - 1) * NZ + clamp(jCell, 0, NZ - 1);

          // 梯度 → 法线
          const dx = iCell > 0 && iCell < NX - 1 ? (h1[(iCell + 1) * NZ + jCell] - h1[(iCell - 1) * NZ + jCell]) : 0;
          const dz = jCell > 0 && jCell < NZ - 1 ? (h1[iCell * NZ + jCell + 1] - h1[iCell * NZ + jCell - 1]) : 0;

          // Z倾斜叠加到Z梯度
          const effectiveDz = dz + zTilt * 0.005 * zFrac;

          // 折射偏移
          const offX = dx * REFRACT_X * w * 0.005;
          const offY = effectiveDz * REFRACT_Z * 1.5;

          const sx = Math.round(px + offX);
          const sy = Math.round(py + offY);
          const csx = clamp(sx, 0, iw_px - 1);
          const csy = clamp(sy, 0, ih_px - 1);

          const si = (csy * iw_px + csx) * 4;
          const di = (py * iw_px + px) * 4;
          data[di] = sdata[si];
          data[di + 1] = sdata[si + 1];
          data[di + 2] = sdata[si + 2];
          data[di + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, topY);

      // 5. 蓝色水体渐变覆盖（表面淡，底部深）
      const waterGrad = ctx.createLinearGradient(0, wlBase, 0, h);
      waterGrad.addColorStop(0, 'rgba(160,210,240,0.08)');
      waterGrad.addColorStop(0.3, 'rgba(130,190,230,0.18)');
      waterGrad.addColorStop(0.7, 'rgba(80,140,210,0.28)');
      waterGrad.addColorStop(1, 'rgba(40,80,160,0.40)');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, wlBase, w, h - wlBase);

      // 6. 水面线 h(x, z=0)
      const segW = w / WX;
      ctx.beginPath();
      for (let i = 0; i <= WX; i++) {
        const x = i * segW;
        const waveH = h2[i * NZ + 0];   // z=0 前壁处
        const y = wlBase + waveH * 30;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 水面微光
      const glowGrad = ctx.createLinearGradient(0, wlBase - 4, 0, wlBase + 4);
      glowGrad.addColorStop(0, 'rgba(200,220,255,0)');
      glowGrad.addColorStop(0.5, 'rgba(200,220,255,0.10)');
      glowGrad.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, wlBase - 4, w, 8);

      // 缓冲区轮转
      [h0, h1, h2] = [h1, h2, h0];
      h2.fill(0);
    };

    render();

    /* ── IntersectionObserver ── */
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

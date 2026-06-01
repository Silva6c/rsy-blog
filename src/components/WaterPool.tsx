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

/* ── 背景图片 ── */
const BASE = import.meta.env.BASE_URL;
const BG_IMAGES = [
  `${BASE}images/backgrounds/dark/01_dark.png`,
  `${BASE}images/backgrounds/dark/02_dark.png`,
  `${BASE}images/backgrounds/dark/03_dark.png`,
  `${BASE}images/backgrounds/dark/04_dark.png`,
  `${BASE}images/backgrounds/dark/05_dark.png`,
  `${BASE}images/backgrounds/dark/06_dark.jpg`,
];
const BG_INTERVAL = 30000;

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

    /* ── 背景图片 ── */
    const bgImages: HTMLImageElement[] = [];
    let bgIndex = 0;
    let bgLoaded = false;
    // 预加载图片
    BG_IMAGES.forEach((url, i) => {
      const img = new Image();
      img.onload = () => { if (i === 0) { bgLoaded = true; drawBg(); } };
      img.src = url;
      bgImages.push(img);
    });
    // 定时轮换
    const bgTimer = setInterval(() => {
      bgIndex = (bgIndex + 1) % BG_IMAGES.length;
      drawBg();
    }, BG_INTERVAL);

    /* ── Z 倾斜状态 ── */
    let zTilt = 0;
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
      // 背景图片（cover 模式）
      const img = bgImages[bgIndex];
      if (img && img.complete) {
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(w / iw, h / ih);
        const sw = iw * scale, sh = ih * scale;
        const sx = (w - sw) / 2, sy = (h - sh) / 2;
        octx.drawImage(img, sx, sy, sw, sh);
      } else {
        // 图片未就绪时用深色底
        octx.fillStyle = '#0d0b1a';
        octx.fillRect(0, 0, w, h);
      }
      // 暗色遮罩（让上方文字可读）
      octx.fillStyle = 'rgba(0,0,0,0.25)';
      octx.fillRect(0, 0, w, h);

      // 标题 — 品牌渐变色
      const titleGrad = octx.createLinearGradient(0, 0, w, 0);
      titleGrad.addColorStop(0, '#6366f1');
      titleGrad.addColorStop(1, '#38bdf8');
      octx.fillStyle = titleGrad;
      octx.font = `bold ${Math.min(w * 0.08, 80)}px "Noto Serif SC", serif`;
      octx.textAlign = 'center';
      octx.fillText("RSY's 1st BLOG", w / 2, h * 0.55);
      octx.fillStyle = 'rgba(255,255,255,0.55)';
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

      // 1. 二维波方程（含 z=0 和 z=NZ-1 反射边界）
      const c = WAVE_C;
      for (let i = 1; i < NX - 1; i++) {
        for (let j = 0; j < NZ; j++) {
          const idx = i * NZ + j;
          // X 邻居
          const xp = h1[idx - NZ], xn = h1[idx + NZ];
          // Z 邻居 — 反射边界：z=0→镜像z=1, z=NZ-1→镜像z=NZ-2
          const zp = j > 0 ? h1[idx - 1] : h1[idx + 1];
          const zn = j < NZ - 1 ? h1[idx + 1] : h1[idx - 1];
          const lap = xp + xn + zp + zn - 4 * h1[idx];
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

      // 预计算每列的水面线 Y（避免重复算）
      const waterlineByX: number[] = [];
      for (let px = 0; px < iw_px; px++) {
        const iCell = Math.round((px / iw_px) * WX);
        waterlineByX[px] = wlBase + h2[clamp(iCell, 0, NX - 1) * NZ + 0] * 12;
      }

      for (let py = 0; py < ih_px; py++) {
        const screenY = topY + py;

        for (let px = 0; px < iw_px; px++) {
          const di = (py * iw_px + px) * 4;

          // 像素在水面以上 → 不折射，直接拷贝
          if (screenY < waterlineByX[px]) {
            const si = di;
            data[di] = sdata[si];
            data[di + 1] = sdata[si + 1];
            data[di + 2] = sdata[si + 2];
            data[di + 3] = 255;
            continue;
          }

          // 像素在水中 → 计算折射
          const iCell = Math.round((px / iw_px) * WX);
          const zFrac = clamp((screenY - wlBase) / (h - wlBase), 0, 1);
          const jCell = Math.round(zFrac * WZ);

          const il = clamp(iCell - 1, 0, NX - 1), ir = clamp(iCell + 1, 0, NX - 1);
          const jl = clamp(jCell - 1, 0, NZ - 1), jr = clamp(jCell + 1, 0, NZ - 1);
          const ddx = il !== ir ? (h1[ir * NZ + jCell] - h1[il * NZ + jCell]) / (ir - il) : 0;
          const ddz = jl !== jr ? (h1[iCell * NZ + jr] - h1[iCell * NZ + jl]) / (jr - jl) : 0;
          const effectiveDz = ddz + zTilt * 0.005 * zFrac;

          const offX = ddx * REFRACT_X * w * 0.005;
          const offY = effectiveDz * REFRACT_Z * 1.5;

          const sx = Math.round(px + offX);
          const sy = Math.round(py + offY);
          const csx = clamp(sx, 0, iw_px - 1);
          const csy = clamp(sy, 0, ih_px - 1);

          const si = (csy * iw_px + csx) * 4;
          data[di] = sdata[si];
          data[di + 1] = sdata[si + 1];
          data[di + 2] = sdata[si + 2];
          data[di + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, topY);

      // 5. 蓝色水体 — 跟随水面线曲线填充
      ctx.save();
      ctx.beginPath();
      const segW2 = w / WX;
      // 沿水面线从左到右
      for (let i = 0; i <= WX; i++) {
        const x = i * segW2;
        const wy = wlBase + h2[i * NZ + 0] * 12;
        if (i === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      // 向下到屏幕底，再闭合
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      // 渐变填充（从上到下）
      const waterGrad = ctx.createLinearGradient(0, wlBase - 10, 0, h);
      waterGrad.addColorStop(0, 'rgba(160,210,240,0.24)');
      waterGrad.addColorStop(0.2, 'rgba(130,190,230,0.60)');
      waterGrad.addColorStop(0.6, 'rgba(80,140,210,1.0)');
      waterGrad.addColorStop(1, 'rgba(40,80,160,1.0)');
      ctx.fillStyle = waterGrad;
      ctx.fill();
      ctx.restore();

      // 6. 水面线 h(x, z=0)
      const segW = w / WX;
      ctx.beginPath();
      for (let i = 0; i <= WX; i++) {
        const x = i * segW;
        const waveH = h2[i * NZ + 0];   // z=0 前壁处
        const y = wlBase + waveH * 12;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 水面光晕 — 跟随水面线
      ctx.save();
      ctx.beginPath();
      const segW3 = w / WX;
      const glowTop = 4, glowBot = 4;
      for (let i = 0; i <= WX; i++) {
        const x = i * segW3;
        const wy = wlBase + h2[i * NZ + 0] * 12;
        if (i === 0) ctx.moveTo(x, wy - glowTop);
        else ctx.lineTo(x, wy - glowTop);
      }
      for (let i = WX; i >= 0; i--) {
        const x = i * segW3;
        const wy = wlBase + h2[i * NZ + 0] * 12;
        ctx.lineTo(x, wy + glowBot);
      }
      ctx.closePath();
      const glowGrad = ctx.createLinearGradient(0, wlBase - glowTop - 4, 0, wlBase + glowBot + 4);
      glowGrad.addColorStop(0, 'rgba(100,150,220,0)');
      glowGrad.addColorStop(0.5, 'rgba(100,150,220,0.25)');
      glowGrad.addColorStop(1, 'rgba(100,150,220,0)');
      ctx.fillStyle = glowGrad;
      ctx.fill();
      ctx.restore();

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
      clearInterval(bgTimer);
      observer.disconnect();
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', drawBg);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-3]" />;
}

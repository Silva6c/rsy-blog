// ─── 水族馆水壁 — React 胶水层 ───
// 水体物理引擎在 water-engine.ts

import { useEffect, useRef } from 'react';
import {
  createWaterState, stepWaves, stepTilt, swapBuffers,
  rippleAt, microPerturb, gradient, waterlineAt,
  type WaterParams,
} from '@/lib/water-engine';

/* ── 参数 ── */
const PARAMS: WaterParams = {
  wx: 200, wz: 40, waveC: 0.15, damping: 0.98,
  refractX: 2.2, refractZ: 0.8, tiltK: 8, tiltD: 3.5,
};
const WX = PARAMS.wx, WZ = PARAMS.wz;
const NX = WX + 1, NZ = WZ + 1;

/* ── 图片 ── */
const BASE = import.meta.env.BASE_URL;
const BG_DARK = [1,2,3,4,5].map(i => `${BASE}images/backgrounds/dark/0${i}_dark.png`).concat([`${BASE}images/backgrounds/dark/06_dark.jpg`]);
const BG_LIGHT = [1,2,3,4,5].map(i => `${BASE}images/backgrounds/light/0${i}_light.png`).concat([`${BASE}images/backgrounds/light/06_light.jpg`]);

const clamp = (v: number, lo: number, hi: number) => v < lo ? lo : v > hi ? hi : v;

export default function WaterPool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = 0, h = 0, animId = 0;

    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d')!;

    const state = createWaterState(PARAMS);
    let lastMX = 0, lastMY = 0, lastT = performance.now();

    /* ── 图片 ── */
    const darkImgs: HTMLImageElement[] = BG_DARK.map(u => { const i = new Image(); i.src = u; return i; });
    const lightImgs: HTMLImageElement[] = BG_LIGHT.map(u => { const i = new Image(); i.src = u; return i; });
    let bgIdx = 0;
    // 渐变过渡
    const prevCanvas = document.createElement('canvas');
    const pctx = prevCanvas.getContext('2d')!;
    let fadeT = 0;  // 0→1, 0=旧图 1=新图
    const FADE_DURATION = 1.5; // 秒

    /* ── 主题 ── */
    const theme = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    let curTheme = theme();

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      offscreen.width = w; offscreen.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── 背景 ── */
    const drawBg = () => {
      const lt = curTheme === 'light';
      const imgs = lt ? lightImgs : darkImgs;
      const img = imgs[bgIdx % imgs.length];

      // 渐变过渡中：先画旧画面
      if (fadeT < 1) {
        octx.drawImage(prevCanvas, 0, 0);
        octx.globalAlpha = fadeT;
      }

      if (img?.complete) {
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const s = Math.max(w / iw, h / ih);
        octx.drawImage(img, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s);
      } else if (fadeT >= 1) {
        octx.fillStyle = lt ? '#f5f3fa' : '#0d0b1a';
        octx.fillRect(0, 0, w, h);
      }
      octx.globalAlpha = 1;

      octx.fillStyle = lt ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)';
      octx.fillRect(0, 0, w, h);
      const g = octx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#6366f1'); g.addColorStop(1, '#38bdf8');
      octx.fillStyle = g;
      octx.font = `bold ${Math.min(w * 0.08, 80)}px "Noto Serif SC", serif`;
      octx.textAlign = 'center';
      octx.fillText("RSY's 1st BLOG", w / 2, h * 0.55);
      octx.fillStyle = lt ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)';
      octx.font = `${Math.min(w * 0.025, 24)}px "Inter","Noto Sans SC",sans-serif`;
      octx.fillText('记录 · 思考 · 创造', w / 2, h * 0.55 + 50);
      octx.textAlign = 'start';
    };
    drawBg();
    window.addEventListener('resize', drawBg);
    const themeObs = new MutationObserver(() => { const t = theme(); if (t !== curTheme) { curTheme = t; drawBg(); } });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    let bgTimer: ReturnType<typeof setInterval>;
    const scheduleNextBg = () => {
      clearInterval(bgTimer);
      const isMeteor = bgIdx % 6 === METEOR_IMG_IDX;
      bgTimer = setInterval(() => {
        prevCanvas.width = w; prevCanvas.height = h;
        pctx.drawImage(offscreen, 0, 0);
        bgIdx++; fadeT = 0;
        scheduleNextBg(); // 根据新图片重新设定间隔
      }, isMeteor ? 30000 : 15000);
    };
    scheduleNextBg();

    /* ── 鼠标 ── */
    const wlY = () => h * 0.45;
    const onMouse = (mx: number, my: number) => {
      const now = performance.now(), dt = Math.min((now - lastT) / 1000, 0.1);
      if (dt <= 0) { lastT = now; lastMX = mx; lastMY = my; return; }
      const vx = (mx - lastMX) / dt, vy = (my - lastMY) / dt;
      lastMX = mx; lastMY = my; lastT = now;
      if (my <= wlY()) return;
      state.zTiltTarget = clamp(vy * -0.08, -40, 40);
      const ix = Math.round((mx / w) * WX);
      const iz = Math.round(clamp((my - wlY()) / (h - wlY()), 0, 1) * (NZ - 1));
      rippleAt(state, ix, iz, 0.6 * (0.3 + clamp((my - wlY()) / (h - wlY()), 0, 1) * 0.7), 6);
    };
    const onMM = (e: MouseEvent) => onMouse(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { if (e.touches.length > 0) onMouse(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('touchmove', onTouch);

    /* ── 彩蛋状态 ── */
    // ① 水面线7连击 — 监听window因为canvas在z-3收不到事件
    let clickCount = 0, clickTimer = 0;
    const onWindowClick = (e: MouseEvent) => {
      const wy = wlY() + waterlineAt(state, Math.round((e.clientX / w) * WX)) * 12;
      if (Math.abs(e.clientY - wy) < 30) {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = window.setTimeout(() => { clickCount = 0; }, 2000);
        if (clickCount >= 7) { clickCount = 0; triggerRage(); }
      }
    };
    window.addEventListener('click', onWindowClick);

    // ③ 陨石撞击（03_dark.png 时点击水面触发）
    const METEOR_IMG_IDX = 2; // 03_dark.png
    type Meteor = { x: number; y: number; vx: number; vy: number; trail: {x:number;y:number}[]; alive: boolean };
    let meteor: Meteor | null = null;
    const onWindowClick2 = (e: MouseEvent) => {
      // 只有当前图片是 03_dark.png 且点击在水面以下
      if (bgIdx % 6 !== METEOR_IMG_IDX) return;
      if (e.clientY < wlY()) return;
      if (meteor?.alive) return; // 已有陨石
      // 从左上或右上飞来
      const fromLeft = Math.random() > 0.5;
      meteor = {
        x: fromLeft ? -80 : w + 80,
        y: -80,
        vx: fromLeft ? 10 + Math.random() * 6 : -(10 + Math.random() * 6),
        vy: 4 + Math.random() * 3,
        trail: [],
        alive: true,
      };
    };
    window.addEventListener('click', onWindowClick2);
    const konamiKeys = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiIdx = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === konamiKeys[konamiIdx]) { konamiIdx++; if (konamiIdx === konamiKeys.length) { konamiIdx = 0; triggerKonami(); } }
      else { konamiIdx = 0; }
    };
    window.addEventListener('keydown', onKey);

    // 彩蛋触发
    let rageEnd = 0;
    function triggerRage() {
      rageEnd = performance.now() + 5000;
      // 剧烈晃荡：随机强脉冲
      for (let p = 0; p < 20; p++) {
        rippleAt(state, Math.floor(Math.random() * WX), 0, 1.5 + Math.random() * 2, 12);
      }
    }
    let konamiParticles: {x:number;y:number;vx:number;vy:number;life:number;c:string}[] = [];
    function triggerKonami() {
      for (let i = 0; i < 300; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 3 + Math.random() * 18;
        konamiParticles.push({
          x: w/2, y: h/2, vx: Math.cos(a)*s, vy: Math.sin(a)*s - Math.random()*8,
          life: 1, c: ['#6366f1','#a855f7','#06b6d4','#ec4899','#facc15','#f472b6','#38bdf8'][Math.floor(Math.random()*7)]
        });
      }
    }

    /* ── 陀螺仪 ── */
    let gyroG = 0, gyroB = 0;
    const onGyro = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      gyroG += (e.gamma - gyroG) * 0.08; gyroB += (e.beta - gyroB) * 0.08;
      state.zTiltTarget = clamp(gyroG * 2.5, -50, 50);
      if (Math.abs(gyroG) > 2 || Math.abs(gyroB) > 2) {
        rippleAt(state, Math.round((0.5 + gyroG * 0.01) * WX), 2, Math.min(0.4, (Math.abs(gyroG) + Math.abs(gyroB)) * 0.005), 4);
      }
    };
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      document.addEventListener('click', function iosG() {
        (DeviceOrientationEvent as any).requestPermission().then((s: string) => { if (s === 'granted') window.addEventListener('deviceorientation', onGyro); }).catch(() => {});
        document.removeEventListener('click', iosG);
      }, { once: true });
    } else { window.addEventListener('deviceorientation', onGyro); }

    /* ── 渲染 ── */
    const render = () => {
      animId = requestAnimationFrame(render);
      const now = performance.now(), dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      // 渐变过渡推进
      if (fadeT < 1) { fadeT = Math.min(1, fadeT + dt / FADE_DURATION); drawBg(); }

      stepWaves(state, PARAMS);
      stepTilt(state, PARAMS, dt);
      microPerturb(state);

      // 彩蛋：rage 模式持续注能
      if (performance.now() < rageEnd) {
        if (Math.random() < 0.5) rippleAt(state, Math.floor(Math.random() * WX), 0, 0.8 + Math.random(), 8);
        state.zTiltTarget = Math.sin(performance.now() * 0.01) * 30;
      }

      ctx.drawImage(offscreen, 0, 0);

      const baseY = wlY(), topY = Math.floor(baseY) - 8, regionH = h - topY;
      if (regionH <= 0) { swapBuffers(state); return; }

      const imageData = ctx.getImageData(0, topY, w, regionH);
      const src = octx.getImageData(0, topY, w, regionH);
      const data = imageData.data, sdata = src.data, iw = imageData.width, ih = imageData.height;

      const wlx: number[] = [];
      for (let px = 0; px < iw; px++) wlx[px] = baseY + waterlineAt(state, Math.round((px / iw) * WX)) * 12;

      for (let py = 0; py < ih; py++) {
        const sy = topY + py;
        for (let px = 0; px < iw; px++) {
          const di = (py * iw + px) * 4;
          if (sy < wlx[px]) { data[di]=sdata[di]; data[di+1]=sdata[di+1]; data[di+2]=sdata[di+2]; data[di+3]=255; continue; }
          const ic = Math.round((px / iw) * WX);
          const zf = clamp((sy - baseY) / (h - baseY), 0, 1);
          const jc = Math.round(zf * WZ);
          const g = gradient(state, ic, jc);
          const edz = g.dz + state.zTilt * 0.005 * zf;
          const ox = g.dx * PARAMS.refractX * w * 0.005;
          const oy = edz * PARAMS.refractZ * 1.5;
          const sx = clamp(Math.round(px + ox), 0, iw - 1), sy2 = clamp(Math.round(py + oy), 0, ih - 1);
          const si = (sy2 * iw + sx) * 4;
          data[di]=sdata[si]; data[di+1]=sdata[si+1]; data[di+2]=sdata[si+2]; data[di+3]=255;
        }
      }
      ctx.putImageData(imageData, 0, topY);

      const lt = curTheme === 'light';
      ctx.save(); ctx.beginPath();
      for (let i = 0; i <= WX; i++) { const x = i * (w / WX); const wy = wlx[Math.round(i * (iw - 1) / WX) ?? 0]; i === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy); }
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      const wg = ctx.createLinearGradient(0, baseY - 10, 0, h);
      if (lt) { wg.addColorStop(0,'rgba(160,210,240,0.11)'); wg.addColorStop(0.3,'rgba(130,190,230,0.25)'); wg.addColorStop(0.7,'rgba(80,140,210,0.39)'); wg.addColorStop(1,'rgba(40,80,160,0.53)'); }
      else { wg.addColorStop(0,'rgba(160,210,240,0.17)'); wg.addColorStop(0.2,'rgba(130,190,230,0.42)'); wg.addColorStop(0.6,'rgba(80,140,210,0.7)'); wg.addColorStop(1,'rgba(40,80,160,0.7)'); }
      ctx.fillStyle = wg; ctx.fill(); ctx.restore();

      ctx.beginPath();
      for (let i = 0; i <= WX; i++) { const x = i * (w / WX); const wy = baseY + waterlineAt(state, i) * 12; i === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy); }
      ctx.strokeStyle = lt ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2.5; ctx.stroke();

      // 光晕
      ctx.save(); ctx.beginPath();
      for (let i = 0; i <= WX; i++) { const x = i * (w / WX); const wy = baseY + waterlineAt(state, i) * 12; i===0?ctx.moveTo(x,wy-4):ctx.lineTo(x,wy-4); }
      for (let i = WX; i>=0; i--) { const x = i*(w/WX); const wy=baseY+waterlineAt(state,i)*12; ctx.lineTo(x,wy+4); }
      ctx.closePath();
      const gg = ctx.createLinearGradient(0, baseY-8, 0, baseY+8);
      gg.addColorStop(0,'rgba(100,150,220,0)'); gg.addColorStop(0.5,'rgba(100,150,220,0.25)'); gg.addColorStop(1,'rgba(100,150,220,0)');
      ctx.fillStyle=gg; ctx.fill(); ctx.restore();

      // 彩蛋：陨石
      if (meteor?.alive) {
        const mt = meteor;
        mt.trail.push({ x: mt.x, y: mt.y });
        if (mt.trail.length > 30) mt.trail.shift();
        mt.x += mt.vx; mt.y += mt.vy;
        mt.vy += 0.15; // 重力

        // 撞击水面检测
        const impactY = wlY() + waterlineAt(state, Math.round(clamp(mt.x / w, 0, 1) * WX)) * 12;
        if (mt.y >= impactY && mt.vy > 0) {
          // 巨量冲击波
          const ix = Math.round(clamp(mt.x / w, 0, 1) * WX);
          rippleAt(state, ix, 0, 8, 30);  // 主冲击
          rippleAt(state, ix, 3, 5, 22);  // 次级
          rippleAt(state, ix, 8, 3, 16);  // 深层
          for (let p = 0; p < 20; p++) rippleAt(state, Math.round(Math.random()*WX), Math.floor(Math.random()*10), 1.5+Math.random()*3, 10+Math.random()*12);
          rageEnd = performance.now() + 5000;
          mt.alive = false;
        }

        // 绘制拖尾
        ctx.save();
        for (let i = 0; i < mt.trail.length; i++) {
          const t = mt.trail[i];
          const alpha = i / mt.trail.length * 0.6;
          ctx.fillStyle = `rgba(255,160,30,${alpha})`;
          ctx.beginPath(); ctx.arc(t.x, t.y, 4 + i * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        // 陨石本体 — 加大
        const grad = ctx.createRadialGradient(mt.x, mt.y, 0, mt.x, mt.y, 40);
        grad.addColorStop(0, '#fff'); grad.addColorStop(0.2, '#fef3c7'); grad.addColorStop(0.5, '#f59e0b'); grad.addColorStop(1, 'rgba(220,38,38,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(mt.x, mt.y, 40, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // 彩蛋：Konami 粒子
      for (const p of konamiParticles) {
        p.x += p.vx; p.y += p.vy; p.life -= 0.015; p.vy += 0.05;
        if (p.life <= 0) continue;
        ctx.fillStyle = p.c; ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      konamiParticles = konamiParticles.filter(p => p.life > 0);

      swapBuffers(state);
    };
    render();

    const obs = new IntersectionObserver(([e]) => { if (!e.isIntersecting) cancelAnimationFrame(animId); else { cancelAnimationFrame(animId); animId = requestAnimationFrame(render); } }, { threshold: 0 });
    obs.observe(canvas);

    return () => {
      cancelAnimationFrame(animId); clearInterval(bgTimer);
      obs.disconnect(); themeObs.disconnect();
      window.removeEventListener('mousemove', onMM); window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('deviceorientation', onGyro);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onWindowClick);
      window.removeEventListener('click', onWindowClick2);
      window.removeEventListener('resize', resize); window.removeEventListener('resize', drawBg);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-3]" />;
}

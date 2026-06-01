// ─── Three.js 半杯水晃荡 — MeshPhysicalMaterial + 阻尼正弦波 ───
// 规格文档: 首页·.md
// Iteration 2: 放大杯子、增强可见度、水面倾斜可视化

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** 玻璃杯轮廓（右手半截面，LatheGeometry 绕 Y 轴旋转生成杯体） */
const PROFILE = [
  new THREE.Vector2(0.00, -0.70),
  new THREE.Vector2(0.50, -0.70),
  new THREE.Vector2(0.50, -0.65),
  new THREE.Vector2(0.44, -0.30),
  new THREE.Vector2(0.42, 0.10),
  new THREE.Vector2(0.45, 0.40),
  new THREE.Vector2(0.48, 0.65),
  new THREE.Vector2(0.52, 0.70),
  new THREE.Vector2(0.00, 0.70),
];

/** 棋盘格背景纹理（折射扭曲清晰可见） */
function createCheckerTexture(): THREE.CanvasTexture {
  const s = 512, grid = 32;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d')!;
  const cols = ['#1e1b4b', '#312e81', '#4338ca', '#6366f1'];
  for (let y = 0; y < s; y += grid) {
    for (let x = 0; x < s; x += grid) {
      ctx.fillStyle = cols[((x / grid) + (y / grid)) % cols.length];
      ctx.fillRect(x, y, grid, grid);
    }
  }
  // 白色分割线增强折射可见度
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= s; i += grid) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function WaterGlass() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── 场景 + 相机（更近，杯子占视口 ~60%） ───
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 15);
    camera.position.set(0.15, 0.05, 3.5);
    camera.lookAt(0, -0.02, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ─── 灯光 ───
    scene.add(new THREE.AmbientLight('#ccddff', 0.5));
    const key = new THREE.DirectionalLight('#ffffff', 4);
    key.position.set(5, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#aaccff', 3);
    rim.position.set(-3, 0, -1);
    scene.add(rim);
    // 顶光 — 照亮水面
    const top = new THREE.DirectionalLight('#ffffff', 2);
    top.position.set(0, 5, 0);
    scene.add(top);

    // ─── 环境贴图（亮色 → 玻璃表面可见高光反射） ───
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#d0ddf8');   // 亮蓝灰色，非暗紫
    scene.environment = pmrem.fromScene(envScene).texture;
    scene.background = new THREE.Color('#0d0b1a');

    // ─── 背景折射板（棋盘格，透过玻璃可见扭曲） ───
    const bgTex = createCheckerTexture();
    const bgPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({ map: bgTex }),
    );
    bgPlane.position.z = -2;
    scene.add(bgPlane);

    // ─── 玻璃杯（外层） ───
    const glassGeom = new THREE.LatheGeometry(PROFILE, 72);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      metalness: 0.05,         // 微金属感增强边缘可见
      roughness: 0.02,
      transmission: 1,
      ior: 1.5,
      thickness: 0.6,
      transparent: true,
      opacity: 1,
      envMapIntensity: 1.0,    // 增强环境反射
      specularIntensity: 1.2,
    });
    const glass = new THREE.Mesh(glassGeom, glassMat);
    scene.add(glass);

    // ─── 水体 ───
    const waterGeom = new THREE.CylinderGeometry(0.38, 0.36, 0.65, 64);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#d0e8ff'),
      metalness: 0,
      roughness: 0.03,
      transmission: 1,
      ior: 1.333,
      attenuationColor: new THREE.Color('#99ccff'),
      attenuationDistance: 0.25,
      transparent: true,
      opacity: 1,
      envMapIntensity: 0.9,
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = -0.03;
    scene.add(water);

    // ─── 水面（有厚度的圆盘，倾斜动画目标） ───
    const surfaceGroup = new THREE.Group();
    surfaceGroup.position.y = 0.30;
    // 水面圆盘（带厚度更真实）
    const surfaceGeom = new THREE.CylinderGeometry(0.37, 0.37, 0.03, 64);
    const surfaceMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#e8f4ff'),
      metalness: 0,
      roughness: 0.01,
      transmission: 0.6,
      ior: 1.333,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 1.2,
      specularIntensity: 1.5,
    });
    const surface = new THREE.Mesh(surfaceGeom, surfaceMat);
    surfaceGroup.add(surface);
    scene.add(surfaceGroup);

    // ─── 阻尼晃荡动画 ───
    const k = 10, d = 3.5;      // 刚度/阻尼
    let targetZ = 0, curZ = 0, velZ = 0;
    let lastMX = 0, lastT = performance.now(), animId = 0;

    const onMouse = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.1);
      if (dt <= 0) { lastT = now; lastMX = e.clientX; return; }
      const vx = (e.clientX - lastMX) / dt;
      // 速度映射：快速划动 → ±0.3 rad (±17°)
      targetZ = THREE.MathUtils.clamp(vx * 0.001, -0.30, 0.30);
      lastMX = e.clientX;
      lastT = now;
    };
    window.addEventListener('mousemove', onMouse);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      // 阻尼弹簧
      velZ += (targetZ - curZ) * k * dt - velZ * d * dt;
      curZ += velZ * dt;

      // 目标衰减 → 自然停稳
      targetZ *= 0.94;

      surfaceGroup.rotation.z = curZ;
      // 同步微微旋转玻璃（视觉联动）
      glass.rotation.z = curZ * 0.3;

      renderer.render(scene, camera);
    };

    // ─── IntersectionObserver ───
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { lastT = performance.now(); animate(); } else cancelAnimationFrame(animId); },
      { threshold: 0 },
    );
    observer.observe(container);

    // ─── 响应式 ───
    const resize = () => {
      const { width: w, height: h } = container.getBoundingClientRect();
      renderer.setSize(w || window.innerWidth, h || window.innerHeight);
      camera.aspect = (w || 1) / Math.max(h || 1, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      [glassGeom, glassMat, waterGeom, waterMat, surfaceGeom, surfaceMat, bgTex].forEach(o => o.dispose());
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-[-3] pointer-events-none" />;
}

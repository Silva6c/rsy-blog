// ─── Three.js 半杯水晃荡 — MeshPhysicalMaterial + 阻尼正弦波 ───
// 规格文档: 首页·.md

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** 玻璃杯轮廓（LatheGeometry 用，右侧半截面） */
const GLASS_PROFILE: THREE.Vector2[] = [
  new THREE.Vector2(0.00, -0.55), // 杯底中心
  new THREE.Vector2(0.38, -0.55), // 杯底
  new THREE.Vector2(0.38, -0.50),
  new THREE.Vector2(0.34, -0.20), // 杯身收窄
  new THREE.Vector2(0.36, 0.10),  // 杯身
  new THREE.Vector2(0.42, 0.40),  // 杯口微微外扩
  new THREE.Vector2(0.44, 0.55),  // 杯口
  new THREE.Vector2(0.00, 0.55),  // 杯口中心（封顶）
];

/** 玻璃厚度（杯壁偏移量） */
const GLASS_THICKNESS = 0.04;

/** 生成程序化背景纹理 — 彩色渐变条纹，方便透过玻璃观察折射扭曲 */
function createBackgroundTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 深色底
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  // 彩色条纹
  const colors = ['#6366f1', '#a855f7', '#06b6d4', '#ec4899', '#8b5cf6'];
  for (let i = 0; i < 12; i++) {
    const y = (i / 12) * size;
    const h = size / 12 + 4;
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, y, size, h);
  }
  ctx.globalAlpha = 1;

  // 白色圆点
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 6;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function WaterGlass() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── 1. 基本场景 ───
    const scene = new THREE.Scene();

    // 相机：略俯视
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(0, 0.15, 4.5);
    camera.lookAt(0, -0.05, 0);

    // 渲染器
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // 像素比限制
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ─── 2. 灯光 ───
    // 环境光
    scene.add(new THREE.AmbientLight('#ffffff', 0.6));
    // 主方向光（产生高光反射）
    const key = new THREE.DirectionalLight('#ffffff', 2.5);
    key.position.set(3, 4, 5);
    scene.add(key);
    // 补光
    const fill = new THREE.DirectionalLight('#8899cc', 1.2);
    fill.position.set(-2, 1, -1);
    scene.add(fill);

    // ─── 3. 环境贴图（transmission 必须） ───
    const pmrem = new THREE.PMREMGenerator(renderer);
    // 用简单的颜色场景生成 env map
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#1a1a2e');
    envScene.add(new THREE.AmbientLight('#ffffff', 1));
    scene.environment = pmrem.fromScene(envScene).texture;
    scene.background = new THREE.Color('#0d0b1a');

    // ─── 4. 背景折射板（放在杯子后方，透过玻璃可见扭曲） ───
    const bgTex = createBackgroundTexture();
    const bgPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshBasicMaterial({ map: bgTex }),
    );
    bgPlane.position.z = -1.5;
    scene.add(bgPlane);

    // ─── 5. 玻璃杯（LatheGeometry + MeshPhysicalMaterial） ───
    // 外层杯壁
    const glassGeom = new THREE.LatheGeometry(GLASS_PROFILE, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      metalness: 0,
      roughness: 0,
      // ---- 透光参数（实现真实感的核心） ----
      transmission: 1,        // 完全透光
      ior: 1.5,              // 玻璃折射率
      thickness: 0.5,        // 壁厚（影响折射强度）
      // ---- ----
      transparent: true,
      opacity: 1,
      envMapIntensity: 0.6,
      clearcoat: 0.1,
    });
    const glass = new THREE.Mesh(glassGeom, glassMat);
    glass.position.y = 0;
    scene.add(glass);

    // ─── 6. 水体（略小于杯内径的圆柱） ───
    const waterGeom = new THREE.CylinderGeometry(0.31, 0.28, 0.48, 64);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#e0f0ff'),
      metalness: 0,
      roughness: 0.05,
      // ---- 透光参数 ----
      transmission: 1,                  // 完全透光
      ior: 1.333,                       // 水折射率
      attenuationColor: new THREE.Color('#c8e0ff'),  // 微蓝色衰减
      attenuationDistance: 0.3,         // 衰减距离（体现深度感）
      // ---- ----
      transparent: true,
      opacity: 1,
      envMapIntensity: 0.8,
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = -0.04;   // 水在杯子下半部
    scene.add(water);

    // ─── 7. 水面（CircleGeometry, 独立网格用于倾斜动画） ───
    const surfaceGroup = new THREE.Group();
    surfaceGroup.position.y = 0.20; // 水面高度（半杯位置）
    const surfaceGeom = new THREE.CircleGeometry(0.31, 64);
    const surfaceMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      metalness: 0,
      roughness: 0.02,
      transmission: 0.9,
      ior: 1.333,
      transparent: true,
      opacity: 0.85,
      envMapIntensity: 1.0,
    });
    const surface = new THREE.Mesh(surfaceGeom, surfaceMat);
    surface.rotation.x = -Math.PI / 2; // CircleGeometry 默认在 XY，翻到 XZ
    surfaceGroup.add(surface);
    scene.add(surfaceGroup);

    // ─── 8. 动画系统 — 鼠标速度驱动的阻尼晃荡 ───
    // 阻尼弹簧参数
    const stiffness = 8;    // 刚度：越大晃动越快
    const damping = 3;      // 阻尼：越大衰减越快

    // 动画状态
    let targetRotZ = 0;       // 水面目标倾斜角 (绕 Z 轴)
    let currentRotZ = 0;      // 水面当前倾斜角
    let angularVelocity = 0;  // 角速度
    let lastMouseX = 0;
    let lastTime = performance.now();
    let animId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1); // 秒，上限防跳帧
      if (dt <= 0) { lastTime = now; return; }

      // 水平速度 (px/s) → 映射为目标倾斜角
      const vx = (e.clientX - lastMouseX) / dt;
      // 速度映射：快速划动 → 倾斜角 ±0.25 rad (±14°)
      targetRotZ = THREE.MathUtils.clamp(vx * 0.0008, -0.25, 0.25);

      lastMouseX = e.clientX;
      lastTime = now;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 阻尼弹簧公式：a = -k*x - d*v
      const springForce = (targetRotZ - currentRotZ) * stiffness;
      const dampingForce = angularVelocity * damping;
      angularVelocity += (springForce - dampingForce) * delta;
      currentRotZ += angularVelocity * delta;

      // 鼠标不动时，目标归零，弹簧自然衰减晃荡
      targetRotZ *= 0.95;

      // 应用旋转到水面组
      surfaceGroup.rotation.z = currentRotZ;

      renderer.render(scene, camera);
    };

    // ─── 9. IntersectionObserver — 离开视口暂停渲染 ───
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          lastTime = performance.now();
          animate();
        } else {
          cancelAnimationFrame(animId);
        }
      },
      { threshold: 0 },
    );
    observer.observe(container);

    // ─── 10. 响应式大小 ───
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── 11. 清理 ───
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      glassGeom.dispose();
      glassMat.dispose();
      waterGeom.dispose();
      waterMat.dispose();
      surfaceGeom.dispose();
      surfaceMat.dispose();
      bgTex.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[-3] pointer-events-none"
    />
  );
}

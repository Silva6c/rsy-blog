// ─── WebGL Water 风格 — 下半屏水面晃荡 ───
// 波方程模拟 + 鼠标涟漪 + 半透明蓝色水体

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** 水面网格分辨率 */
const GRID = 100;
/** 波速系数（0~0.5，越大越快，>0.5 不稳定） */
const WAVE_SPEED = 0.18;
/** 阻尼系数（越接近 1 波浪越持久） */
const DAMPING = 0.985;

export default function WaterPool() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── 场景 ───
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d0b1a');
    scene.fog = new THREE.Fog('#0d0b1a', 5, 15);

    // 相机：略俯视水面
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 30);
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, -0.3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ─── 光照 ───
    scene.add(new THREE.AmbientLight('#4466aa', 0.6));
    const sun = new THREE.DirectionalLight('#ffeedd', 3);
    sun.position.set(5, 8, -2);
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#8899cc', 1);
    fill.position.set(-3, 2, 4);
    scene.add(fill);

    // ─── 环境（反射用） ───
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#4466aa');
    scene.environment = pmrem.fromScene(envScene).texture;

    // ─── 水面几何体 ───
    const size = 12, half = size / 2;
    const geom = new THREE.PlaneGeometry(size, size, GRID, GRID);
    geom.rotateX(-Math.PI / 2); // 水平放置
    const positions = geom.attributes.position.array as Float32Array;
    const vertCount = positions.length / 3;

    // 水面材质 — 半透明蓝色玻璃
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#4488cc'),
      metalness: 0.05,
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 0.8,
      specularIntensity: 0.6,
      specularColor: new THREE.Color('#ffffff'),
      clearcoat: 0.3,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = -1.5;
    scene.add(mesh);

    // 水下底色平面（加深深度感）
    const floorGeom = new THREE.PlaneGeometry(size, size);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a2a44'),
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -2.5;
    scene.add(floor);

    // ─── 高度场 ───
    // 三缓冲区：前一帧 / 当前 / 后一帧
    const N = GRID + 1; // 顶点数 = 网格+1
    let h0 = new Float32Array(N * N); // prev
    let h1 = new Float32Array(N * N); // current
    let h2 = new Float32Array(N * N); // next

    // ─── 鼠标涟漪 ───
    const raycaster = new THREE.Raycaster();
    const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.5); // y=-1.5

    const onMouse = (e: MouseEvent) => {
      // 屏幕坐标 → NDC → 射线
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
      raycaster.setFromCamera(mouse, camera);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(waterPlane, pt);
      if (!pt) return;

      // 世界坐标 → 网格索引
      const ix = Math.round((pt.x + half) / size * GRID);
      const iy = Math.round((pt.z + half) / size * GRID);
      if (ix < 1 || ix >= N - 1 || iy < 1 || iy >= N - 1) return;

      // 在点击点产生涟漪脉冲
      const impulse = 0.25;
      const spread = 3;
      for (let di = -spread; di <= spread; di++) {
        for (let dj = -spread; dj <= spread; dj++) {
          const ni = ix + di, nj = iy + dj;
          if (ni < 0 || ni >= N || nj < 0 || nj >= N) continue;
          const dist = Math.sqrt(di * di + dj * dj);
          const val = impulse * Math.exp(-dist * dist / 4);
          h1[ni * N + nj] += val;
        }
      }
    };
    window.addEventListener('mousemove', onMouse);

    // ─── 动画循环 ───
    let animId = 0, lastT = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((performance.now() - lastT) / 1000, 0.05);
      lastT = performance.now();

      // 波方程时间步
      const c = WAVE_SPEED;
      for (let i = 1; i < N - 1; i++) {
        for (let j = 1; j < N - 1; j++) {
          const idx = i * N + j;
          // 离散波方程核心
          const laplacian =
            h1[idx - N] + h1[idx + N] + h1[idx - 1] + h1[idx + 1] - 4 * h1[idx];
          h2[idx] = (2 * h1[idx] - h0[idx] + c * laplacian) * DAMPING;
        }
      }

      // 更新顶点 Y 坐标
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const idx3 = (i * N + j) * 3;
          positions[idx3 + 1] = h2[i * N + j];
        }
      }
      geom.attributes.position.needsUpdate = true;
      geom.computeVertexNormals();

      // 缓冲区轮转
      [h0, h1, h2] = [h1, h2, h0];
      // 清零新 h2
      h2.fill(0);

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
      geom.dispose();
      mat.dispose();
      floorGeom.dispose();
      floorMat.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-[-3]" />;
}

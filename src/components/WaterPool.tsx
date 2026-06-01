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

    // 相机：向下俯视，水面占下半屏
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30);
    camera.position.set(0, 3, 5);
    camera.lookAt(0, -1.2, 0);  // 视线向下，水面在半屏以下

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

    // 水面材质 — 高透明海洋蓝
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#44aadd'),
      metalness: 0.03,
      roughness: 0.06,
      transparent: true,
      opacity: 0.35,             // 更透
      envMapIntensity: 1.2,
      specularIntensity: 1.0,
      specularColor: new THREE.Color('#ffffff'),
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = -1.8;  // 更靠下，占下半屏
    scene.add(mesh);

    // 水下底色平面（加深深度感）
    const floorGeom = new THREE.PlaneGeometry(size, size);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a2a44'),
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -3.0;
    scene.add(floor);

    // 天际线光晕 — 水面远端 + 上方天空渐变
    const glowGeom = new THREE.PlaneGeometry(size, 1.5);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#8899dd'),
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.set(0, -1.5, -half + 0.5);
    glow.rotation.x = -Math.PI / 3;
    scene.add(glow);

    // 天空渐变面（水面上方淡蓝过渡）
    const skyGeom = new THREE.PlaneGeometry(size, 3);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          float t = 1.0 - vUv.y;
          gl_FragColor = vec4(mix(vec3(0.05,0.04,0.1), vec3(0.15,0.2,0.4), t*t), t*0.3);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeom, skyMat);
    sky.position.set(0, 2, -half + 0.5);
    sky.rotation.x = -Math.PI / 4;
    scene.add(sky);

    // ─── 高度场 ───
    // 三缓冲区：前一帧 / 当前 / 后一帧
    const N = GRID + 1; // 顶点数 = 网格+1
    let h0 = new Float32Array(N * N); // prev
    let h1 = new Float32Array(N * N); // current
    let h2 = new Float32Array(N * N); // next

    // ─── 鼠标涟漪 ───
    const raycaster = new THREE.Raycaster();
    const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.8); // y=-1.8

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

      // 大范围涟漪脉冲 — 鼠标划过激起明显波纹
      const impulse = 0.5;
      const spread = 8;
      for (let di = -spread; di <= spread; di++) {
        for (let dj = -spread; dj <= spread; dj++) {
          const ni = ix + di, nj = iy + dj;
          if (ni < 0 || ni >= N || nj < 0 || nj >= N) continue;
          const dist = Math.sqrt(di * di + dj * dj);
          const val = impulse * Math.exp(-dist * dist / 12);
          h1[ni * N + nj] += val;
        }
      }
    };
    window.addEventListener('mousemove', onMouse);
    // 触摸支持
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onMouse({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as MouseEvent);
      }
    };
    window.addEventListener('touchmove', onTouch);

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

      // 随机微扰 — 水面始终有细微波动，不死寂
      if (Math.random() < 0.03) {
        const rx = 1 + Math.floor(Math.random() * (N - 2));
        const ry = 1 + Math.floor(Math.random() * (N - 2));
        const ri = 0.04;
        for (let di = -2; di <= 2; di++) {
          for (let dj = -2; dj <= 2; dj++) {
            const ni = rx + di, nj = ry + dj;
            if (ni < 0 || ni >= N || nj < 0 || nj >= N) continue;
            const d2 = di * di + dj * dj;
            h1[ni * N + nj] += ri * Math.exp(-d2 / 2);
          }
        }
      }

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
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      geom.dispose(); mat.dispose();
      floorGeom.dispose(); floorMat.dispose();
      glowGeom.dispose(); glowMat.dispose();
      skyGeom.dispose(); skyMat.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-[-3]" />;
}

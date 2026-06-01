// ─── 水体渲染引擎 ───
// 纯函数，与 React 无关。可独立测试和修改。

/* ── 类型 ── */
export interface WaterParams {
  wx: number;           // X 采样数
  wz: number;           // Z 采样数
  waveC: number;        // 波速
  damping: number;      // 阻尼
  refractX: number;     // X折射系数
  refractZ: number;     // Z折射系数
  tiltK: number;        // 弹簧刚度
  tiltD: number;        // 弹簧阻尼
}

export interface WaterState {
  h0: Float32Array;
  h1: Float32Array;
  h2: Float32Array;
  nx: number;
  nz: number;
  zTilt: number;
  zTiltVel: number;
  zTiltTarget: number;
}

export function createWaterState(params: WaterParams): WaterState {
  const nx = params.wx + 1, nz = params.wz + 1;
  return {
    h0: new Float32Array(nx * nz),
    h1: new Float32Array(nx * nz),
    h2: new Float32Array(nx * nz),
    nx, nz,
    zTilt: 0, zTiltVel: 0, zTiltTarget: 0,
  };
}

const clamp = (v: number, lo: number, hi: number) => v < lo ? lo : v > hi ? hi : v;

/** 波方程时间步 */
export function stepWaves(s: WaterState, params: WaterParams): void {
  const { nx, nz, h0, h1, h2 } = s;
  const c = params.waveC;
  for (let i = 1; i < nx - 1; i++) {
    for (let j = 0; j < nz; j++) {
      const idx = i * nz + j;
      const xp = h1[idx - nz], xn = h1[idx + nz];
      const zp = j > 0 ? h1[idx - 1] : h1[idx + 1];
      const zn = j < nz - 1 ? h1[idx + 1] : h1[idx - 1];
      const lap = xp + xn + zp + zn - 4 * h1[idx];
      h2[idx] = (2 * h1[idx] - h0[idx] + c * lap) * params.damping;
    }
  }
}

/** 旋转缓冲区 */
export function swapBuffers(s: WaterState): void {
  [s.h0, s.h1, s.h2] = [s.h1, s.h2, s.h0];
  s.h2.fill(0);
}

/** 更新 Z 倾斜弹簧 */
export function stepTilt(s: WaterState, params: WaterParams, dt: number): void {
  s.zTiltVel += (s.zTiltTarget - s.zTilt) * params.tiltK * dt - s.zTiltVel * params.tiltD * dt;
  s.zTilt += s.zTiltVel * dt;
  s.zTiltTarget *= 0.95;
}

/** 注入涟漪脉冲 */
export function rippleAt(s: WaterState, ix: number, iz: number, impulse: number, spread: number): void {
  const { nx, nz, h1 } = s;
  for (let di = -spread; di <= spread; di++) {
    for (let dj = -spread; dj <= spread; dj++) {
      const ni = ix + di, nj = iz + dj;
      if (ni >= 0 && ni < nx && nj >= 0 && nj < nz) {
        const d2 = di * di + dj * dj;
        h1[ni * nz + nj] += impulse * Math.exp(-d2 / (spread * 0.6));
      }
    }
  }
}

/** 随机微扰 */
export function microPerturb(s: WaterState): void {
  const { nx, nz, h1 } = s;
  if (Math.random() < 0.03) {
    const ri = 1 + Math.floor(Math.random() * (nx - 2));
    const rj = 1 + Math.floor(Math.random() * (nz - 2));
    for (let di = -2; di <= 2; di++)
      for (let dj = -2; dj <= 2; dj++) {
        const ni = ri + di, nj = rj + dj;
        if (ni >= 0 && ni < nx && nj >= 0 && nj < nz)
          h1[ni * nz + nj] += 0.03 * Math.exp(-(di * di + dj * dj) / 3);
      }
  }
}

/** 计算梯度 */
export function gradient(s: WaterState, iCell: number, jCell: number): { dx: number; dz: number } {
  const { nx, nz, h1 } = s;
  const il = clamp(iCell - 1, 0, nx - 1), ir = clamp(iCell + 1, 0, nx - 1);
  const jl = clamp(jCell - 1, 0, nz - 1), jr = clamp(jCell + 1, 0, nz - 1);
  return {
    dx: il !== ir ? (h1[ir * nz + jCell] - h1[il * nz + jCell]) / (ir - il) : 0,
    dz: jl !== jr ? (h1[iCell * nz + jr] - h1[iCell * nz + jl]) / (jr - jl) : 0,
  };
}

/** 水面线某列高度 */
export function waterlineAt(s: WaterState, iCell: number): number {
  return s.h2[clamp(iCell, 0, s.nx - 1) * s.nz + 0];
}

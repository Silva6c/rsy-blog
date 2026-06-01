// ─── 首页视频背景 ───
import { BASE, SITE_NAME, SITE_TAGLINE, CHROME_HEIGHT } from '@/lib/constants';

export default function HeroScene() {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: `calc(100vh - ${CHROME_HEIGHT}px)` }}
    >
      {/* 全屏视频 — 放大裁切边界 */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-1/2 left-1/2 min-w-[120%] min-h-[120%] -translate-x-1/2 -translate-y-1/2 object-cover"
      >
        <source src={`${BASE}video/bg.mp4`} type="video/mp4" />
      </video>

      {/* 径向暗角 — 融入背景 */}
      <div className="hero-vignette absolute inset-0" />

      {/* 居中内容 */}
      <div className="relative z-10 text-center px-4">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight font-serif-sc text-glow-brand animate-fade-up delay-300">
          <span className="text-gradient-brand">
            {SITE_NAME}
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg tracking-widest text-[hsl(var(--muted-foreground))] animate-fade-in delay-1500">
          {SITE_TAGLINE}
        </p>
      </div>
    </div>
  );
}

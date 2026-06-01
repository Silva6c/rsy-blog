// ─── 全局光标光晕 ───
import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current, glow = glowRef.current;
    if (!dot || !glow) return;

    let x = 0, y = 0, tx = 0, ty = 0;
    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      dot.style.transform = `translate(${x - 2}px, ${y - 2}px)`;
      glow.style.transform = `translate(${x - 60}px, ${y - 60}px)`;
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);

    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={dotRef} className="hidden sm:block fixed top-0 left-0 w-1 h-1 rounded-full bg-[hsl(var(--primary))] pointer-events-none z-[9998]" />
      <div ref={glowRef} className="hidden sm:block fixed top-0 left-0 w-[120px] h-[120px] rounded-full pointer-events-none z-[9997]"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
    </>
  );
}

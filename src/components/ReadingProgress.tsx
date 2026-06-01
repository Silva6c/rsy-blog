// ─── 阅读进度条 ───

import { useState, useEffect } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(100, (scrollTop / docHeight) * 100));
    };

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
      <div
        className="progress-bar h-full rounded-r-sm transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
      <style>{`
        .progress-bar {
          background: linear-gradient(to right, #6366f1, #a855f7, #06b6d4, #ec4899, #6366f1);
          background-size: 300% 100%;
          animation: progress-hue 4s linear infinite;
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
        }
        [data-theme='light'] .progress-bar {
          background: linear-gradient(to right, #4f46e5, #7c3aed, #0891b2, #db2777, #4f46e5);
          background-size: 300% 100%;
          box-shadow: 0 0 10px rgba(79, 70, 229, 0.6);
        }
        @keyframes progress-hue {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </div>
  );
}

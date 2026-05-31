import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Shadcn UI 样式合并工具 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 估算文章阅读时间（分钟）
 *
 * 中英文混合：中文约 400 字/分钟，英文约 200 词/分钟
 * 这里按平均每字符 0.7 个"有效字"计算
 */
export function estimateReadingTime(text: string): number {
  // 去除空白字符
  const cleaned = text.replace(/\s+/g, '');
  // 纯中文计数（每个汉字 ≈ 1 个阅读单位）
  const chineseChars = (cleaned.match(/[一-鿿]/g) || []).length;
  // 非中文字符（英文单词、数字、代码等）
  const nonChinese = cleaned.length - chineseChars;
  // 中文字符 400/分钟，非中文 200/分钟
  const minutes = chineseChars / 400 + nonChinese / 200;
  return Math.max(1, Math.ceil(minutes));
}

/**
 * 格式化日期为中文格式
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

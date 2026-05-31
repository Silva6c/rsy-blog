import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius)] text-sm font-medium',
          'transition-all duration-200 ease-out',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',

          // 变体
          variant === 'default' &&
            'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 shadow-lg shadow-[hsl(var(--primary))/0.25]',
          variant === 'destructive' &&
            'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90',
          variant === 'outline' &&
            'border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
          variant === 'ghost' &&
            'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
          variant === 'link' &&
            'text-[hsl(var(--primary))] underline-offset-4 hover:underline',

          // 尺寸
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-9 rounded-[calc(var(--radius)-0.125rem)] px-3 text-xs',
          size === 'lg' && 'h-11 rounded-[var(--radius)] px-8 text-base',
          size === 'icon' && 'h-10 w-10',

          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };

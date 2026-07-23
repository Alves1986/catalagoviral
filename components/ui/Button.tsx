'use client';
import { clsx } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-soft hover:brightness-110 active:brightness-95',
  secondary:
    'bg-white text-ink-800 border border-ink-300/40 shadow-sm hover:bg-ink-50',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-900/5',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
  outline: 'bg-transparent border border-brand-500 text-brand-700 hover:bg-brand-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-4 text-sm rounded-2xl',
  lg: 'h-13 px-6 text-base rounded-2xl',
};

export function Button({
  variant = 'primary', size = 'md', loading, iconLeft, iconRight, fullWidth, className, children, disabled, ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant], sizes[size], fullWidth && 'w-full', className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

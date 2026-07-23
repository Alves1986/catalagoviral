import { clsx } from '@/lib/cn';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 text-sm text-ink-800 outline-none transition',
        'placeholder:text-ink-400 focus:border-brand-400 focus:ring-brand',
        className,
      )}
      {...rest}
    />
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-sm text-ink-800 outline-none transition resize-none',
        'placeholder:text-ink-400 focus:border-brand-400 focus:ring-brand',
        className,
      )}
      {...rest}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink-700 mb-1.5">{children}</label>;
}

export function Select({ className, children, ...rest }: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={clsx(
        'h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 text-sm text-ink-800 outline-none transition',
        'focus:border-brand-400 focus:ring-brand appearance-none', className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

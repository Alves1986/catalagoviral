import { clsx } from '@/lib/cn';
import type { ReactNode } from 'react';

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode; [k: string]: unknown }) {
  return (
    <div className={clsx('rounded-3xl bg-white shadow-card border border-ink-900/5', className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>
      {children}
    </span>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
        {subtitle && <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-3xl border border-dashed border-ink-300/50 bg-white/50">
      {icon && <div className="mb-3 text-ink-300">{icon}</div>}
      <p className="font-semibold text-ink-700">{title}</p>
      {description && <p className="text-sm text-ink-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-2xl bg-ink-900/5', className)} />;
}

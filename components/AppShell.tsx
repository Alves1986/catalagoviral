'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from './AuthProvider';
import { clsx } from '@/lib/cn';
import { isDemoMode } from '@/lib/config';

const NAV = [
  { href: '/', label: 'Catálogo' },
  { href: '/whatsapp', label: 'WhatsApp' },
  { href: '/dispatch', label: 'Disparar' },
  { href: '/dashboard', label: 'Meus Links' },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white font-display font-extrabold shadow-soft">
        CV
      </span>
      <span className="font-display text-lg font-extrabold text-ink-900">
        Catálogo<span className="text-brand-gradient">Viral</span>
      </span>
    </Link>
  );
}

function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/5 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  'rounded-xl px-3 py-2 text-sm font-semibold transition',
                  active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-900/5',
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {isDemoMode() && (
            <span className="hidden sm:inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Modo Demo
            </span>
          )}
          {user && (
            <button
              onClick={async () => { await logout(); window.location.assign('/login'); }}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-500 hover:bg-ink-900/5"
            >
              Sair
            </button>
          )}
        </div>
      </div>
      {/* nav mobile */}
      <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-2 no-scrollbar md:hidden">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                'whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition',
                active ? 'bg-brand-50 text-brand-700' : 'text-ink-600',
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-ink-900/5 py-6 text-center text-xs text-ink-400">
        Catálogo Viral · divulgue produtos que convertem 🚀
      </footer>
    </AuthProvider>
  );
}

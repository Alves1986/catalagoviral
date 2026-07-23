'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchTopProducts } from '@/lib/data';
import type { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { RequireAuth } from '@/components/RequireAuth';
import { Skeleton, EmptyState } from '@/components/ui/primitives';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link2 } from '@/components/icons';

function CatalogInner() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [sort, setSort] = useState<'commission' | 'sales'>('commission');

  useEffect(() => {
    let alive = true;
    setProducts(null);
    fetchTopProducts({ limit: 60, sortBy: sort }).then((p) => { if (alive) setProducts(p); });
    return () => { alive = false; };
  }, [sort]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-7 text-white shadow-soft sm:p-9">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Afiliados de e-commerce</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Produtos quentes, copy pronta e divulgação em 1 clique.
          </h1>
          <p className="mt-2 text-white/85">
            Centralize ofertas de alta comissão, gere links rastreáveis e espalhe nos grupos do WhatsApp.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl animate-floaty" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-accent-500/40 blur-2xl" />
      </section>

      {/* FILTROS */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-500">Ordenar por</span>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'commission' | 'sales')}
            className="h-10 w-44"
          >
            <option value="commission">Maior comissão</option>
            <option value="sales">Mais recentes</option>
          </Select>
        </div>
        <span className="text-sm text-ink-400">{products ? `${products.length} produtos` : 'carregando…'}</span>
      </div>

      {/* GRID */}
      {!products ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-8 w-8" />}
          title="Catálogo vazio"
          description="Importe produtos pelo painel admin para começar a divulgar."
        />
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </motion.div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <CatalogInner />
    </RequireAuth>
  );
}

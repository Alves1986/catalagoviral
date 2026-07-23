'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchTopProducts, countProducts, type ProductFilter } from '@/lib/data';
import type { Product, ProductSource } from '@/types';
import { CATEGORIAS } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { RequireAuth } from '@/components/RequireAuth';
import { Skeleton, EmptyState, Pagination } from '@/components/ui/primitives';
import { Select, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link2, Search } from '@/components/icons';
import { clsx } from '@/lib/cn';

const PAGE_SIZE = 24;

const PLATFORMS: { value: ProductSource | 'all'; label: string; cls: string }[] = [
  { value: 'all', label: 'Todas', cls: 'bg-brand-gradient text-white' },
  { value: 'shopee', label: 'Shopee', cls: 'bg-orange-500 text-white' },
  { value: 'tiktok', label: 'TikTok', cls: 'bg-pink-500 text-white' },
  { value: 'manual', label: 'Manual', cls: 'bg-ink-600 text-white' },
];

function CatalogInner() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<ProductFilter>({ sortBy: 'hot', source: 'all', category: 'all', search: '', page: 1 });

  const load = useCallback(async () => {
    setProducts(null);
    const [items, count] = await Promise.all([
      fetchTopProducts({ ...filter, pageSize: PAGE_SIZE }),
      countProducts(filter),
    ]);
    setProducts(items);
    setTotal(count);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
            Escolha a plataforma, filtre por categoria e gere o link de afiliado pronto para disparar no WhatsApp.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl animate-floaty" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-accent-500/40 blur-2xl" />
      </section>

      {/* FILTROS: plataforma (tabs) */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => {
          const active = filter.source === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setFilter((f) => ({ ...f, source: p.value, page: 1 }))}
              className={clsx(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                active ? p.cls : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* CATEGORIAS (chips fixos) */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter((f) => ({ ...f, category: 'all', page: 1 }))}
          className={clsx(
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            filter.category === 'all' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500 hover:bg-ink-50',
          )}
        >
          Todas categorias
        </button>
        {CATEGORIAS.map((c) => {
          const active = filter.category === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setFilter((f) => ({ ...f, category: c.value, page: 1 }))}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500 hover:bg-ink-50',
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* BUSCA + ORDENAÇÃO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
            placeholder="Buscar produto…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter.sortBy} onChange={(e) => setFilter((f) => ({ ...f, sortBy: e.target.value as ProductFilter['sortBy'], page: 1 }))} className="h-10 w-48">
            <option value="hot">🔥 Mais quentes</option>
            <option value="commission">Maior comissão</option>
            <option value="sales">Mais recentes</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </Select>
        </div>
      </div>

      <span className="text-sm text-ink-400">{products ? `${total} produto(s)` : 'carregando…'}</span>

      {/* GRID */}
      {!products ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-8 w-8" />}
          title="Nenhum produto encontrado"
          description="Ajuste a busca, a plataforma ou a categoria. Importe produtos pelo painel admin."
        />
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </motion.div>
      )}

      {totalPages > 1 && (
        <Pagination
          page={filter.page ?? 1}
          totalPages={totalPages}
          onChange={(p) => setFilter((f) => ({ ...f, page: p }))}
        />
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

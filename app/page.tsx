'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchTopProducts, countProducts, type ProductFilter } from '@/lib/data';
import type { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { RequireAuth } from '@/components/RequireAuth';
import { Skeleton, EmptyState, Pagination } from '@/components/ui/primitives';
import { Select, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link2, Search } from '@/components/icons';

const PAGE_SIZE = 24;

function CatalogInner() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<ProductFilter>({ sortBy: 'commission', source: 'all', search: '', page: 1 });

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
            Centralize ofertas de alta comissão, gere links rastreáveis e espalhe nos grupos do WhatsApp.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl animate-floaty" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-accent-500/40 blur-2xl" />
      </section>

      {/* FILTROS */}
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
          <Select value={filter.source} onChange={(e) => setFilter((f) => ({ ...f, source: e.target.value as ProductFilter['source'], page: 1 }))} className="h-10 w-36">
            <option value="all">Todas</option>
            <option value="shopee">Shopee</option>
            <option value="tiktok">TikTok</option>
            <option value="manual">Manual</option>
          </Select>
          <Select value={filter.sortBy} onChange={(e) => setFilter((f) => ({ ...f, sortBy: e.target.value as ProductFilter['sortBy'], page: 1 }))} className="h-10 w-44">
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
          description="Ajuste a busca ou importe produtos pelo painel admin."
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

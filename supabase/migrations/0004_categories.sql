-- Catálogo Viral — 0004: categorias fixas + selo "quente"
-- Aplicar no SQL Editor do Supabase ou via Management API.

-- Categorias fixas de curadoria (Opção A): o afiliado marca no cadastro.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_category') then
    create type product_category as enum (
      'eletronicos', 'moda', 'casa', 'beleza', 'pets', 'esportes', 'infantil', 'livros', 'automotivo', 'geral'
    );
  end if;
end $$;

alter table products add column if not exists category product_category default 'geral';
alter table products add column if not exists hot boolean default false;
alter table products add column if not exists sales_rank int default 0; -- usado para ordenar "mais vendidos"

-- Índices para os filtros do catálogo
create index if not exists idx_products_category on products (category);
create index if not exists idx_products_hot on products (hot);
create index if not exists idx_products_sales_rank on products (sales_rank desc);

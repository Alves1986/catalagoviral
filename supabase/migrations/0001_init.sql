-- Catálogo Viral — schema inicial (Supabase / Postgres)
-- Rode no SQL Editor do Supabase ou via supabase db push.

create extension if not exists "pgcrypto";

-- organizações (unidade de isolamento)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_super_admin boolean default false,
  created_at timestamptz default now()
);

-- perfis (complementa auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id),
  affiliate_id_shopee text,
  affiliate_id_tiktok text,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  name text not null,
  image_url text,
  original_price numeric,
  promo_price numeric,
  commission_pct numeric,
  original_link text not null,
  source text check (source in ('shopee','tiktok','manual')) default 'manual',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists generated_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  user_id uuid references profiles(id),
  product_id uuid references products(id),
  short_link text,
  clicks int default 0,
  created_at timestamptz default now()
);

create table if not exists copy_generations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  product_id uuid references products(id),
  user_id uuid references profiles(id),
  copy_text text,
  video_script text,
  created_at timestamptz default now()
);

create table if not exists whatsapp_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  user_id uuid references profiles(id) not null,
  evolution_instance_name text not null,
  status text check (status in ('pending_qr','connected','disconnected')) default 'pending_qr',
  created_at timestamptz default now()
);

create table if not exists whatsapp_groups (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid references whatsapp_instances(id) not null,
  group_jid text not null,
  group_name text,
  is_active boolean default true
);

create table if not exists dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  user_id uuid references profiles(id) not null,
  copy_text text,
  group_ids uuid[],
  status text check (status in ('queued','sending','sent','failed')) default 'queued',
  scheduled_at timestamptz,
  sent_at timestamptz
);

-- RLS
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table generated_links enable row level security;
alter table copy_generations enable row level security;
alter table whatsapp_instances enable row level security;
alter table whatsapp_groups enable row level security;
alter table dispatch_queue enable row level security;

create or replace function current_org_id()
returns uuid language sql stable as $$
  select organization_id from profiles where id = auth.uid()
$$;

-- organizations
create policy org_select on organizations for select using (id = current_org_id());
create policy org_super on organizations for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.organization_id is null)
);

-- profiles
create policy prof_select on profiles for select using (id = auth.uid());
create policy prof_update on profiles for update using (id = auth.uid());

-- products (leitura compartilhada na org; escrita só super admin)
create policy prod_select on products for select using (organization_id = current_org_id());
create policy prod_admin on products for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.organization_id is null)
) with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.organization_id is null)
);

-- generated_links (só do próprio usuário)
create policy gl_select on generated_links for select using (user_id = auth.uid() and organization_id = current_org_id());
create policy gl_insert on generated_links for insert with check (user_id = auth.uid() and organization_id = current_org_id());
create policy gl_update on generated_links for update using (user_id = auth.uid());
create policy gl_delete on generated_links for delete using (user_id = auth.uid());

-- copy_generations (só do próprio usuário)
create policy cg_select on copy_generations for select using (user_id = auth.uid() and organization_id = current_org_id());
create policy cg_insert on copy_generations for insert with check (user_id = auth.uid() and organization_id = current_org_id());
create policy cg_delete on copy_generations for delete using (user_id = auth.uid());

-- whatsapp
create policy wi_all on whatsapp_instances for all using (user_id = auth.uid() and organization_id = current_org_id());
create policy wg_all on whatsapp_groups for all using (
  instance_id in (select id from whatsapp_instances where user_id = auth.uid()));
create policy dq_all on dispatch_queue for all using (user_id = auth.uid() and organization_id = current_org_id());

-- incremento atômico de cliques (evita race condition)
create or replace function increment_link_clicks(link_id uuid)
returns void language sql as $$
  update generated_links set clicks = clicks + 1 where id = link_id;
$$;

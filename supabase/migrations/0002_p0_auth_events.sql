-- Catálogo Viral — P0: signup automático (org + profile) + eventos de link
-- Rode no SQL Editor do Supabase (acrescenta ao schema inicial).

-- 1) Trigger: a cada novo auth.users, cria organization + profile vinculado.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  org_id uuid;
begin
  insert into public.organizations (name) values (coalesce(new.raw_user_meta_data->>'org_name', 'Minha Organização'))
    returning id into org_id;
  insert into public.profiles (id, organization_id)
    values (new.id, org_id)
    on conflict (id) do update set organization_id = excluded.organization_id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Tabela de eventos de link (clique e conversão) — base p/ CTR e comissão real.
create table if not exists public.link_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references public.generated_links(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) not null,
  event_type text check (event_type in ('click','conversion')) not null,
  value numeric default 0,            -- valor da conversão (opcional)
  created_at timestamptz default now()
);

create index if not exists link_events_link_idx on public.link_events(link_id);
create index if not exists link_events_org_idx on public.link_events(organization_id);

-- 3) RPC: registra evento e retorna o link original (valida existência ANTES de contar).
--    Evita incrementar cliques de link inexistente (bug anterior).
create or replace function public.register_link_event(
  p_link_id uuid,
  p_event_type text,
  p_value numeric default 0
)
returns table (original_link text, found boolean) language plpgsql security definer set search_path = public as $$
declare
  v_link record;
  v_org uuid;
begin
  -- valida existência do link
  select gl.id, gl.organization_id, p.original_link
    into v_link
    from public.generated_links gl
    join public.products p on p.id = gl.product_id
   where gl.id = p_link_id;

  if v_link.id is null then
    return query select null::text, false;
    return;
  end if;

  v_org := v_link.organization_id;

  insert into public.link_events (link_id, organization_id, event_type, value)
    values (p_link_id, v_org, p_event_type, p_value);

  -- mantém contador de cliques na tabela (só para event_type='click')
  if p_event_type = 'click' then
    update public.generated_links set clicks = clicks + 1 where id = p_link_id;
  end if;

  return query select v_link.original_link, true;
end;
$$;

-- 4) RLS para link_events (só a própria org)
alter table public.link_events enable row level security;
create policy le_all on public.link_events for all using (
  organization_id = (select organization_id from public.profiles where id = auth.uid())
) with check (
  organization_id = (select organization_id from public.profiles where id = auth.uid())
);

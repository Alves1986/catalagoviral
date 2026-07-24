-- Catálogo Viral — SaaS: assinaturas + purge de inadimplentes
-- Aplicar no SQL Editor do Supabase ou via supabase db push.

-- Tabela de assinaturas (uma por organização; plano anual único)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  plan text not null default 'annual' check (plan in ('annual')),
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subscriptions_org on subscriptions(organization_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

-- organizations: controle de purge (soft delete após 6 meses de inadimplência)
alter table organizations add column if not exists deleted_at timestamptz;
alter table organizations add column if not exists purge_after timestamptz;

-- Função: assinatura ativa da org atual
create or replace function current_subscription()
returns table (
  id uuid, status text, starts_at timestamptz, ends_at timestamptz, plan text
) language sql stable as $$
  select s.id, s.status, s.starts_at, s.ends_at, s.plan
  from subscriptions s
  where s.organization_id = current_org_id()
  order by s.created_at desc
  limit 1;
$$;

-- RLS para subscriptions (só a própria org)
alter table subscriptions enable row level security;
create policy sub_select on subscriptions for select using (organization_id = current_org_id());
create policy sub_all on subscriptions for all using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

-- Função de purge: marca deleted_at e purge_after = ends_at + 6 meses para
-- orgs sem assinatura ativa cuja vigência terminou há mais de 6 meses.
create or replace function mark_expired_for_purge()
returns int language plpgsql as $$
declare n int;
begin
  update organizations o
  set deleted_at = now(),
      purge_after = coalesce(
        (select ends_at + interval '6 months' from subscriptions s where s.organization_id = o.id order by s.created_at desc limit 1),
        now() + interval '6 months'
      )
  where o.deleted_at is null
    and not exists (
      select 1 from subscriptions s
      where s.organization_id = o.id and s.status = 'active' and s.ends_at > now()
    )
    and exists (
      select 1 from subscriptions s2
      where s2.organization_id = o.id
        and s2.status <> 'active'
        and s2.ends_at < now() - interval '6 months'
    );
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Função de purge real: apaga dados de orgs cujo purge_after já passou.
-- CUIDADO: destrutivo. Só roda após o aviso de 6 meses.
create or replace function purge_expired_orgs()
returns int language plpgsql as $$
declare n int := 0;
begin
  -- remove em cascata (FK on delete cascade cuida das tabelas filhas)
  delete from organizations o where o.deleted_at is not null and o.purge_after <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

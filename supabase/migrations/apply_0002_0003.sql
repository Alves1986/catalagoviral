-- Catálogo Viral — aplica 0002 + 0003 de uma vez
-- Cole e execute este SQL no SQL Editor do Supabase (https://app.supabase.com/project/xeqrzaeisuzsluaznhip/sql)

-- ============ 0002: eventos de conversão + deep link ============
alter table products add column if not exists affiliate_link text;
alter table generated_links add column if not exists utm_source text;
alter table generated_links add column if not exists affiliate_link text;

create table if not exists link_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  link_id uuid references generated_links(id) on delete cascade,
  product_id uuid references products(id),
  user_id uuid references profiles(id),
  event_type text check (event_type in ('click','conversion')) not null,
  commission_amount numeric,
  occurred_at timestamptz default now()
);

alter table link_events enable row level security;
create policy le_select on link_events for select using (organization_id = current_org_id());
create policy le_insert_click on link_events for insert with check (event_type = 'click');
create policy le_insert_conv on link_events for insert with check (
  event_type = 'conversion' and organization_id = current_org_id()
);

create or replace function register_conversion(
  p_link_id uuid,
  p_commission numeric
) returns void language plpgsql security definer as $$
declare
  v_org uuid;
  v_uid uuid;
  v_pid uuid;
begin
  select organization_id, user_id, product_id
    into v_org, v_uid, v_pid
    from generated_links where id = p_link_id;
  if v_org is null then return; end if;
  insert into link_events (organization_id, link_id, product_id, user_id, event_type, commission_amount)
  values (v_org, p_link_id, v_pid, v_uid, 'conversion', p_commission);
end;
$$;

-- ============ 0003: campos de cadastro do perfil ============
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists whatsapp text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists state text;
alter table profiles add column if not exists pix_key text;
alter table profiles add column if not exists instagram text;

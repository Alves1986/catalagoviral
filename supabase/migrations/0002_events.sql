-- Catálogo Viral — migration 0002
-- Adiciona eventos de conversão (comissão), campos de link de afiliado e UTM.

-- 1) Link de afiliado real no produto (deep link Shopee/TikTok)
alter table products add column if not exists affiliate_link text;

-- 2) UTM usado no link gerado + deep link de afiliado real (Shopee/TikTok)
alter table generated_links add column if not exists utm_source text;
alter table generated_links add column if not exists affiliate_link text;

-- 3) Eventos de clique/conversão (para CTR e comissão real)
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

-- 4) RLS para link_events (leitura pela org; escrita permite insert anônimo de 'click'
--    para não depender de sessão no pixel de redirecionamento)
alter table link_events enable row level security;

create policy le_select on link_events for select using (organization_id = current_org_id());
-- insert anônimo permitido apenas para eventos de clique (sem dados sensíveis)
create policy le_insert_click on link_events for insert with check (event_type = 'click');
-- conversões só podem ser inseridas por quem pertence à org (via service role / backend)
create policy le_insert_conv on link_events for insert with check (
  event_type = 'conversion' and organization_id = current_org_id()
);

-- 5) RPC para registrar conversão com comissão (usado pelo backend/service role)
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

-- Catálogo Viral — campos de cadastro do perfil (0003)
-- Adiciona informações de cadastro do afiliado à tabela profiles.

alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists whatsapp text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists state text;
alter table profiles add column if not exists pix_key text;
alter table profiles add column if not exists instagram text;

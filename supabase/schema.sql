-- Executar uma vez no SQL Editor do projeto Supabase.
-- A interface nunca recebe acesso a estas tabelas. Somente a Edge Function.
begin;
create table if not exists public.frota_rooms (
 code text primary key check (code ~ '^[A-F0-9]{8}$'),
 version integer not null default 0,
 state jsonb not null,
 expires_at timestamptz not null default now()+interval '24 hours'
);
create index if not exists frota_rooms_expiry on public.frota_rooms(expires_at);
alter table public.frota_rooms enable row level security;
revoke all on public.frota_rooms from public,anon,authenticated;
grant select,insert,update,delete on public.frota_rooms to service_role;
create table if not exists public.frota_limits (
 bucket text primary key,
 hits integer not null default 1,
 expires_at timestamptz not null
);
create index if not exists frota_limits_expiry on public.frota_limits(expires_at);
alter table public.frota_limits enable row level security;
revoke all on public.frota_limits from public,anon,authenticated;
grant select,insert,update,delete on public.frota_limits to service_role;
create or replace function public.frota_consume_limit(p_bucket text,p_max integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_hits integer;
begin
 insert into public.frota_limits(bucket,hits,expires_at)
 values(p_bucket,1,now()+interval '2 minutes')
 on conflict(bucket) do update set hits=public.frota_limits.hits+1
 returning hits into v_hits;
 return v_hits<=p_max;
end;$$;
revoke all on function public.frota_consume_limit(text,integer) from public,anon,authenticated;
grant execute on function public.frota_consume_limit(text,integer) to service_role;
commit;

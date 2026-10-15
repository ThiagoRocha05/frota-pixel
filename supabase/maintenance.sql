-- Salas expiram logicamente após 30 minutos sem ação.
-- Limpeza física a cada cinco minutos, sem chamadas de Edge Function.
create extension if not exists pg_cron;
create or replace function public.frota_cleanup()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare rooms_deleted integer; limits_deleted integer;
begin
 delete from public.frota_rooms where expires_at <= now();
 get diagnostics rooms_deleted = row_count;
 delete from public.frota_limits where expires_at <= now();
 get diagnostics limits_deleted = row_count;
 return jsonb_build_object('rooms',rooms_deleted,'limits',limits_deleted);
end;$$;
revoke all on function public.frota_cleanup() from public,anon,authenticated;
grant execute on function public.frota_cleanup() to service_role;
select cron.schedule('frota-idle-cleanup','*/5 * * * *','select public.frota_cleanup();');
-- Reter somente sete dias do histórico destes jobs.
select cron.schedule('frota-cron-history-cleanup','17 3 * * *',
 $$delete from cron.job_run_details where jobid in
 (select jobid from cron.job where jobname in ('frota-idle-cleanup','frota-cron-history-cleanup'))
 and end_time < now()-interval '7 days';$$);

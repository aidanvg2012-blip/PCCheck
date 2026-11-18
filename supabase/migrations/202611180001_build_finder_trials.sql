-- PCCheck Build Finder: three free full build plans per account, then Plus access.
create table if not exists public.build_finder_trials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  used_count integer not null default 0 check (used_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.build_finder_trials enable row level security;

create or replace function public.consume_build_finder_trial(p_user_id uuid, p_limit integer default 3)
returns table(allowed boolean, used_count integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
begin
  if p_limit < 1 or p_limit > 10 then
    raise exception 'Invalid trial limit';
  end if;

  insert into public.build_finder_trials as trial (user_id, used_count, created_at, updated_at)
  values (p_user_id, 1, now(), now())
  on conflict (user_id) do update
    set used_count = trial.used_count + 1,
        updated_at = now()
    where trial.used_count < p_limit
  returning build_finder_trials.used_count into v_used;

  if v_used is not null then
    return query select true, v_used, greatest(p_limit - v_used, 0);
  else
    select trial.used_count into v_used
      from public.build_finder_trials as trial
      where trial.user_id = p_user_id;
    return query select false, coalesce(v_used, p_limit), 0;
  end if;
end;
$$;

revoke all on function public.consume_build_finder_trial(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_build_finder_trial(uuid, integer) to service_role;

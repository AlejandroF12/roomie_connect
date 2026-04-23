-- ============================================================
-- Backfill: insertar en public.users los usuarios que ya
-- existen en auth.users pero no tienen perfil todavía.
-- Ejecutar UNA SOLA VEZ en el SQL Editor de Supabase.
-- ============================================================
insert into public.users (id, username)
select
  au.id,
  coalesce(
    nullif(trim(au.raw_user_meta_data->>'username'), ''),
    split_part(au.email, '@', 1)
  )
from auth.users au
where not exists (
  select 1 from public.users pu where pu.id = au.id
)
on conflict (id) do nothing;

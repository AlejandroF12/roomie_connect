-- ============================================================
-- Roomie Connect — Storage buckets y políticas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─── Bucket: room-images ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('room-images', 'room-images', true)
on conflict (id) do update set public = true;

-- ─── Bucket: avatars ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- ============================================================
-- Políticas de Storage
-- ============================================================

-- ─── room-images: lectura pública ────────────────────────────
create policy "room-images: lectura pública"
  on storage.objects for select
  using (bucket_id = 'room-images');

-- ─── room-images: subida solo autenticados ───────────────────
create policy "room-images: subida autenticada"
  on storage.objects for insert
  with check (
    bucket_id = 'room-images'
    and auth.role() = 'authenticated'
  );

-- ─── room-images: eliminar solo el propietario ───────────────
create policy "room-images: eliminar autenticado"
  on storage.objects for delete
  using (
    bucket_id = 'room-images'
    and auth.role() = 'authenticated'
  );

-- ─── avatars: lectura pública ────────────────────────────────
create policy "avatars: lectura pública"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ─── avatars: subida solo el propio usuario ──────────────────
create policy "avatars: subida autenticada"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- ─── avatars: actualizar solo el propio usuario ──────────────
create policy "avatars: actualizar autenticado"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

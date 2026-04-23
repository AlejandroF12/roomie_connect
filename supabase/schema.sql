-- ============================================================
-- Roomie Connect — Schema SQL
-- Ejecutar en Supabase SQL Editor (en orden)
-- ============================================================

-- ─── Tabla: users ────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  bio         text,
  phone       text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- ─── Tabla: rooms ────────────────────────────────────────────
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.users(id) on delete cascade,
  title       text not null,
  description text not null,
  price       numeric not null check (price >= 0),
  city        text not null,
  zone        text,
  latitude    numeric,
  longitude   numeric,
  room_type   text not null check (room_type in ('private', 'shared')),
  available   boolean not null default true,
  status      text not null default 'active' check (status in ('active', 'paused', 'deleted')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Tabla: room_images ──────────────────────────────────────
create table if not exists public.room_images (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms(id) on delete cascade,
  url           text not null,
  is_main       boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- ─── Tabla: favorites ────────────────────────────────────────
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  room_id    uuid not null references public.rooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, room_id)
);

-- ─── Tabla: reports ──────────────────────────────────────────
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.users(id) on delete cascade,
  target_type   text not null check (target_type in ('room', 'user')),
  target_id     uuid not null,
  reason        text not null check (reason in ('spam', 'inappropriate_content', 'fake_listing', 'harassment', 'other')),
  status        text not null default 'pending' check (status in ('pending', 'review', 'resolved', 'rejected')),
  admin_comment text,
  created_at    timestamptz not null default now()
);

-- ─── Trigger: crear perfil automáticamente al registrarse ────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Trigger: actualizar updated_at en rooms ─────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_rooms_updated on public.rooms;
create trigger on_rooms_updated
  before update on public.rooms
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.users       enable row level security;
alter table public.rooms       enable row level security;
alter table public.room_images enable row level security;
alter table public.favorites   enable row level security;
alter table public.reports     enable row level security;

-- ─── Políticas: users ────────────────────────────────────────
create policy "users: lectura pública"
  on public.users for select
  using (true);

create policy "users: actualizar propio perfil"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── Políticas: rooms ────────────────────────────────────────
create policy "rooms: lectura pública de rooms activos"
  on public.rooms for select
  using (status = 'active' or owner_id = auth.uid());

create policy "rooms: crear autenticado"
  on public.rooms for insert
  with check (auth.uid() = owner_id);

create policy "rooms: actualizar propio"
  on public.rooms for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─── Políticas: room_images ──────────────────────────────────
create policy "room_images: lectura pública"
  on public.room_images for select
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id and (r.status = 'active' or r.owner_id = auth.uid())
    )
  );

create policy "room_images: gestionar propietario"
  on public.room_images for insert
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_id and r.owner_id = auth.uid()
    )
  );

create policy "room_images: eliminar propietario"
  on public.room_images for delete
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id and r.owner_id = auth.uid()
    )
  );

create policy "room_images: actualizar propietario"
  on public.room_images for update
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id and r.owner_id = auth.uid()
    )
  );

-- ─── Políticas: favorites ────────────────────────────────────
create policy "favorites: gestionar propios"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Políticas: reports ──────────────────────────────────────
create policy "reports: crear autenticado"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reports: admin lectura"
  on public.reports for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "reports: admin actualizar"
  on public.reports for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

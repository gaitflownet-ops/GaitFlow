create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  role text not null default 'Palafrenero',
  token text not null unique default md5(random()::text),
  status text not null default 'pendiente', -- pendiente, aceptada, revocada, expirada
  expires_at timestamp with time zone not null,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.invitations enable row level security;

-- Políticas de seguridad
drop policy if exists "Los dueños y admins pueden ver invitaciones de su org" on public.invitations;
create policy "Los dueños y admins pueden ver invitaciones de su org"
  on public.invitations for select
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = invitations.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('Owner', 'Propietario', 'Administrador / Mayordomo', 'Farm')
    )
  );

drop policy if exists "Los dueños y admins pueden crear invitaciones" on public.invitations;
create policy "Los dueños y admins pueden crear invitaciones"
  on public.invitations for insert
  with check (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = invitations.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('Owner', 'Propietario', 'Administrador / Mayordomo', 'Farm')
    )
  );

drop policy if exists "Los dueños y admins pueden actualizar invitaciones" on public.invitations;
create policy "Los dueños y admins pueden actualizar invitaciones"
  on public.invitations for update
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = invitations.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('Owner', 'Propietario', 'Administrador / Mayordomo', 'Farm')
    )
  );

-- Cualquiera puede ver una invitación si tiene el token válido
drop policy if exists "Cualquiera puede ver invitaciones por token" on public.invitations;
create policy "Cualquiera puede ver invitaciones por token"
  on public.invitations for select
  using (status = 'pendiente');

-- Cualquiera (incluso no autenticados o recién creados) puede actualizar a 'aceptada'
drop policy if exists "Usuarios pueden aceptar su propia invitación" on public.invitations;
create policy "Usuarios pueden aceptar su propia invitación"
  on public.invitations for update
  using (status = 'pendiente');


-- ============================================================================
-- ESQUEMA SQL DEFINITIVO PARA SUPABASE (PROYECTO: kripphmingdxnkwkpglo)
-- Clínica de Rehabilitación Dental y Ortodoncia - Dra. Liseth Guevara Muñoz
-- ============================================================================

-- Habilitar extensión para IDs únicos
create extension if not exists "uuid-ossp";

-- 1. TABLA DE PACIENTES (Datos Generales, Historia Clínica y Firmas)
create table if not exists public.patients (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    full_name text not null,
    age integer not null,
    phone text,
    email text,
    referring_doctor text default 'Dra. Liseth Guevara Muñoz',
    avatar_url text,
    
    -- Historia Clínica y Antecedentes (JSON flexible pero estructurado)
    medical_history jsonb default '{}'::jsonb,
    
    -- Firmas Digitales (Guardadas como Base64 o URL de Storage)
    patient_signature text,
    doctor_signature text,
    signed_at timestamp with time zone
);

-- 2. TABLA DE ESTUDIOS Y PLANES ORTODÓNTICOS (1 Paciente puede tener N revisiones)
create table if not exists public.ortho_studies (
    id uuid default uuid_generate_v4() primary key,
    patient_id uuid references public.patients(id) on delete cascade not null,
    study_date date default current_date not null,
    center_name text default 'IDI Mérida',
    
    -- Archivos Multimedia en Supabase Storage (URLs)
    rx_panoramic_url text,
    rx_lateral_url text,
    photos_urls jsonb default '{}'::jsonb, -- Ej: {"frontal": "url", "oclusal_sup": "url"}
    stl_upper_url text, -- URL del archivo .STL superior real
    stl_lower_url text, -- URL del archivo .STL inferior real
    
    -- Diagnóstico IA, Odontograma (IPR Mesial/Distal) y Ruta de 18 Meses
    clinical_data jsonb not null
);

-- Habilitar Row Level Security (RLS) y políticas para acceso desde la app
alter table public.patients enable row level security;
alter table public.ortho_studies enable row level security;

drop policy if exists "Permitir lectura de pacientes" on public.patients;
create policy "Permitir lectura de pacientes" on public.patients for select using (true);

drop policy if exists "Permitir insercion de pacientes" on public.patients;
create policy "Permitir insercion de pacientes" on public.patients for insert with check (true);

drop policy if exists "Permitir actualizacion de pacientes" on public.patients;
create policy "Permitir actualizacion de pacientes" on public.patients for update using (true);

drop policy if exists "Permitir lectura de estudios" on public.ortho_studies;
create policy "Permitir lectura de estudios" on public.ortho_studies for select using (true);

drop policy if exists "Permitir insercion de estudios" on public.ortho_studies;
create policy "Permitir insercion de estudios" on public.ortho_studies for insert with check (true);

drop policy if exists "Permitir actualizacion de estudios" on public.ortho_studies;
create policy "Permitir actualizacion de estudios" on public.ortho_studies for update using (true);

-- Políticas para el Bucket de Storage "ortho-clinical-files"
insert into storage.buckets (id, name, public)
values ('ortho-clinical-files', 'ortho-clinical-files', true)
on conflict (id) do nothing;

drop policy if exists "Acceso publico lectura ortho-clinical-files" on storage.objects;
create policy "Acceso publico lectura ortho-clinical-files"
on storage.objects for select
using ( bucket_id = 'ortho-clinical-files' );

drop policy if exists "Subida publica ortho-clinical-files" on storage.objects;
create policy "Subida publica ortho-clinical-files"
on storage.objects for insert
with check ( bucket_id = 'ortho-clinical-files' );

drop policy if exists "Actualizacion publica ortho-clinical-files" on storage.objects;
create policy "Actualizacion publica ortho-clinical-files"
on storage.objects for update
using ( bucket_id = 'ortho-clinical-files' );

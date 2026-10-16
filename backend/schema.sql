-- Habilitar extensión UUID si no está activa
create extension if not exists "uuid-ossp";

-- Tabla principal de casos clínicos de ortodoncia
create table if not exists public.ortho_cases (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    patient_name text not null,
    patient_age integer not null,
    referring_doctor text default 'Dra. Liseth Guevara Muñoz',
    study_date date default current_date,
    
    -- URLs de los archivos en Supabase Storage (bucket: 'ortho-media')
    rx_panoramic_url text not null,
    rx_lateral_url text not null,
    intraoral_photos_urls text[] not null default '{}',
    
    -- Todo el análisis biomecánico estructurado devuelto por Gemini Vision
    clinical_analysis jsonb not null,
    
    -- Estado del caso
    status text default 'active' check (status in ('draft', 'active', 'completed'))
);

-- Índices para búsqueda rápida por paciente
create index if not exists idx_ortho_cases_patient on public.ortho_cases using btree (patient_name);
create index if not exists idx_ortho_cases_created on public.ortho_cases using btree (created_at desc);

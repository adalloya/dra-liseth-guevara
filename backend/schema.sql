-- ============================================================================
-- ESQUEMA DEFINITIVO SUPABASE: CRD ORTHOAI SUITE (MODULAR ARCHITECTURE)
-- ============================================================================
create extension if not exists "uuid-ossp";

-- 1. Tabla de Pacientes e Historia Clínica (Módulo 1)
create table if not exists public.patients (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default now() not null,
    full_name text not null,
    age integer not null,
    phone text,
    email text,
    referring_doctor text default 'Dra. Liseth Guevara Muñoz',
    avatar_url text,
    
    -- Historia Clínica y Antecedentes (JSON estructurado)
    medical_history jsonb default '{
        "chief_complaint": "",
        "previous_ortho": false,
        "allergies": "Ninguna",
        "systemic_conditions": "Ninguna",
        "habits": ["Interposición lingual"],
        "periodontal_status": "Leve pérdida ósea horizontal"
    }'::jsonb,
    
    -- Firmas Digitales en Base64 o URL de Storage
    patient_signature text,
    doctor_signature text,
    signed_at timestamp with time zone
);

-- 2. Tabla de Estudios Ortodónticos y Plan Biomecánico (Módulos 2, 3 y 4)
create table if not exists public.ortho_studies (
    id uuid default uuid_generate_v4() primary key,
    patient_id uuid references public.patients(id) on delete cascade not null,
    study_date date default current_date not null,
    center_name text default 'IDI Mérida',
    
    -- Archivos Multimedia (URLs de Supabase Storage bucket: 'ortho-records')
    rx_panoramic_url text,
    rx_lateral_url text,
    photos_urls jsonb default '{
        "frontal": "",
        "overjet": "",
        "right_lateral": "",
        "left_lateral": "",
        "upper_occlusal": "",
        "lower_occlusal": ""
    }'::jsonb,
    
    -- Escaneos Intraorales Reales (Opcionales)
    stl_upper_url text,
    stl_lower_url text,
    
    -- Diagnóstico IA, Odontograma Mesial/Distal y Cronograma Mes a Mes
    clinical_data jsonb not null
);

-- Políticas RLS permisivas para uso con Anon Key en clínica
alter table public.patients enable row level security;
alter table public.ortho_studies enable row level security;

drop policy if exists "Allow anon access to patients" on public.patients;
create policy "Allow anon access to patients" on public.patients
    for all using (true) with check (true);

drop policy if exists "Allow anon access to ortho_studies" on public.ortho_studies;
create policy "Allow anon access to ortho_studies" on public.ortho_studies
    for all using (true) with check (true);

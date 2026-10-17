"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface PatientRecord {
  id: string;
  full_name: string;
  age: number;
  phone: string;
  referring_doctor: string;
  created_at: string;
  case_summary: string;
  complexity: "Alta" | "Moderada" | "Baja" | "Por determinar";
  has_stl: boolean;
}

const DEMO_PATIENTS: PatientRecord[] = [
  {
    id: "martha-zuniga-0912",
    full_name: "Martha Gabriela Zúñiga Núñez",
    age: 40,
    phone: "999-241-5129",
    referring_doctor: "Dra. Liseth Guevara Muñoz",
    created_at: "2026-09-12",
    case_summary: "Mordida Abierta Anterior (-4.5 mm) • Clase II Dolicofacial • Retratamiento",
    complexity: "Alta",
    has_stl: true,
  },
  {
    id: "fatima-escamilla-1016",
    full_name: "Fátima Escamilla",
    age: 26,
    phone: "999-112-8900",
    referring_doctor: "Dra. Liseth Guevara Muñoz",
    created_at: "2026-10-16",
    case_summary: "Escaneo Dual .STL Inicial Cargado • Apiñamiento Leve",
    complexity: "Moderada",
    has_stl: true,
  },
];

export default function PatientsDashboardPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRecord[]>(DEMO_PATIENTS);
  const [search, setSearch] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Formulario de Nuevo Paciente (Solo datos de admisión del paciente)
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newComplaint, setNewComplaint] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchPatients() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: PatientRecord[] = data.map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          age: p.age,
          phone: p.phone || "Sin teléfono",
          referring_doctor: p.referring_doctor,
          created_at: new Date(p.created_at).toISOString().split("T")[0],
          case_summary: p.medical_history?.chief_complaint || "Valoración inicial — Pendiente de carga de fotos, Rx y análisis",
          complexity: p.medical_history?.complexity || "Por determinar",
          has_stl: false,
        }));
        setPatients([...DEMO_PATIENTS, ...mapped]);
      }
    }
    fetchPatients();
  }, []);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const newRecord: PatientRecord = {
      id: `pac-${Date.now()}`,
      full_name: newName,
      age: Number(newAge),
      phone: newPhone,
      referring_doctor: "Dra. Liseth Guevara Muñoz",
      created_at: new Date().toISOString().split("T")[0],
      case_summary: `${newComplaint || "Valoración inicial"} — Pendiente de carga de fotos, Rx y análisis`,
      complexity: "Por determinar",
      has_stl: false,
    };

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data } = await supabase
        .from("patients")
        .insert([
          {
            full_name: newName,
            age: Number(newAge),
            phone: newPhone,
            medical_history: {
              chief_complaint: newComplaint || "Valoración inicial",
              complexity: "Por determinar",
            },
          },
        ])
        .select()
        .single();
      if (data) newRecord.id = data.id;
    }

    setPatients([newRecord, ...patients]);
    setNewName("");
    setNewAge("");
    setNewPhone("");
    setNewComplaint("");
    setIsSaving(false);
    setIsNewModalOpen(false);
    router.push(`/pacientes/${newRecord.id}?tab=multimedia&new=1`);
  };

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      {/* Top Bar Estilo macOS / iPadOS */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🦷
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CRD OrthoAI Suite</h1>
              <p className="text-xs text-slate-500">
                Administrador Clínico de Pacientes • Dra. Liseth Guevara Muñoz
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar paciente por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm whitespace-nowrap transition"
            >
              + Nuevo Paciente
            </button>
          </div>
        </div>
      </header>

      {/* Lista de Expedientes */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((patient) => (
            <Link
              key={patient.id}
              href={`/pacientes/${patient.id}`}
              className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {patient.full_name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {patient.age} años • Tel: {patient.phone} • Estudio: {patient.created_at}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      patient.complexity === "Por determinar"
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : patient.complexity === "Alta"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {patient.complexity === "Por determinar"
                      ? "⏳ Pendiente de Análisis"
                      : `Complejidad ${patient.complexity}`}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-4">
                  {patient.case_summary}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  {patient.has_stl && (
                    <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                      Escaneo 3D .STL
                    </span>
                  )}
                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                    {patient.complexity === "Por determinar" ? "Listo para Argon IA" : "Odontograma IPR"}
                  </span>
                </div>
                <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition">
                  {patient.complexity === "Por determinar" ? "Cargar Estudios →" : "Abrir Expediente →"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Modal para Crear Paciente (Solo Datos del Paciente) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePatient}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Paso 1 de 2 • Admisión
                </span>
                <h3 className="font-bold text-base mt-1">Datos del Nuevo Paciente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Nombre Completo del Paciente *
              </label>
              <input
                required
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Ana Sofía Méndez"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Edad *
                </label>
                <input
                  required
                  type="number"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  placeholder="28"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="999-000-0000"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Motivo de Visita (Opcional - Palabras del Paciente)
              </label>
              <input
                type="text"
                value={newComplaint}
                onChange={(e) => setNewComplaint(e.target.value)}
                placeholder="Ej. Valoración inicial / Quiero alinear mis dientes"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-950 leading-relaxed">
              <strong>Siguiente paso:</strong> Al guardar los datos personales, pasarás directamente a <strong>2. Fotos, Rx y STL</strong> para subir los estudios y analizar con <strong>Gemini 4 Argon</strong> (o capturar el diagnóstico manualmente).
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition"
            >
              {isSaving ? "Guardando datos..." : "Guardar y Continuar a Carga de Fotos / Rx →"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

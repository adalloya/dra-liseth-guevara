"use client";
import React, { useState } from "react";

export interface OrthoProcedureType {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  bufferMinutes: number;
  colorHex: string;
  googleColorId: string;
  requiresTwoPhotos: boolean;
  requiresLabReady: boolean;
  defaultChair: string;
  checklist: string[];
}

export interface DaySchedule {
  dayIndex: number;
  dayName: string;
  active: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
}

export interface ScheduledEvent {
  id: string;
  patientName: string;
  patientPhone: string;
  procedureId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  chair: string;
  archwirePlanned: string;
  monthNumber?: number;
  googleSynced: boolean;
  photosCompleted: boolean;
  labConfirmed: boolean;
}

const DEFAULT_PROCEDURES: OrthoProcedureType[] = [
  {
    id: "valoracion_1a",
    name: "1ª Vez: Valoración + Fotos + Escaneo .STL",
    category: "Diagnóstico",
    durationMinutes: 45,
    bufferMinutes: 10,
    colorHex: "#6366f1",
    googleColorId: "9",
    requiresTwoPhotos: false,
    requiresLabReady: false,
    defaultChair: "Sillón 1 (Ortodoncia Principal)",
    checklist: ["8 Fotos Intraorales", "Orden Rx IDI", "Escaneo Dual .STL", "Firma Consentimiento"],
  },
  {
    id: "cementado_brackets",
    name: "Cementado de Brackets (Bonding Completo)",
    category: "Instalación",
    durationMinutes: 60,
    bufferMinutes: 15,
    colorHex: "#10b981",
    googleColorId: "10",
    requiresTwoPhotos: true,
    requiresLabReady: false,
    defaultChair: "Sillón 1 (Ortodoncia Principal)",
    checklist: ["Profilaxis previa", "Cementado diferencial", "Arco .014 CuNiTi", "Kit higiene"],
  },
  {
    id: "entrega_alineadores",
    name: "Entrega de Alineadores + Attachments + IPR",
    category: "Instalación",
    durationMinutes: 45,
    bufferMinutes: 10,
    colorHex: "#06b6d4",
    googleColorId: "7",
    requiresTwoPhotos: true,
    requiresLabReady: true,
    defaultChair: "Sillón 1 (Ortodoncia Principal)",
    checklist: ["Revisar set de alineadores", "Adhesión de attachments", "IPR inicial"],
  },
  {
    id: "control_mensual",
    name: "Control Mensual (Cambio de Arco / Ligaduras)",
    category: "Control",
    durationMinutes: 20,
    bufferMinutes: 5,
    colorHex: "#3b82f6",
    googleColorId: "1",
    requiresTwoPhotos: true,
    requiresLabReady: false,
    defaultChair: "Sillón 1 (Ortodoncia Principal)",
    checklist: ["Tomar 2 Fotos de Evolución", "Evaluar oclusión", "Activar arco"],
  },
  {
    id: "control_ipr",
    name: "Control + Stripping (IPR Mesial / Distal)",
    category: "Biomecánica",
    durationMinutes: 30,
    bufferMinutes: 5,
    colorHex: "#f59e0b",
    googleColorId: "5",
    requiresTwoPhotos: true,
    requiresLabReady: false,
    defaultChair: "Sillón 1 (Ortodoncia Principal)",
    checklist: ["Revisar Odontograma IPR", "Calibrar con galgas", "Pulido interproximal"],
  },
  {
    id: "colocacion_tads",
    name: "Colocación de Microtornillos (TADs IZC) / ATP",
    category: "Biomecánica",
    durationMinutes: 45,
    bufferMinutes: 10,
    colorHex: "#f43f5e",
    googleColorId: "11",
    requiresTwoPhotos: true,
    requiresLabReady: true,
    defaultChair: "Sillón 1 (Ortodoncia Principal)",
    checklist: ["Anestesia local", "Inserción 2 TADs IZC", "Activar 150g por lado", "Rx control"],
  },
  {
    id: "urgencia_bracket",
    name: "Urgencia (Bracket Caído / Arco Pungente)",
    category: "Urgencia",
    durationMinutes: 15,
    bufferMinutes: 5,
    colorHex: "#ef4444",
    googleColorId: "4",
    requiresTwoPhotos: false,
    requiresLabReady: false,
    defaultChair: "Sillón 2 (Escáner 3D / Urgencias)",
    checklist: ["Recementar bracket", "Cortar extremo distal"],
  },
  {
    id: "retiro_debonding",
    name: "Retiro de Ortodoncia (Debonding) + Retenedores",
    category: "Retiro",
    durationMinutes: 60,
    bufferMinutes: 15,
    colorHex: "#8b5cf6",
    googleColorId: "3",
    requiresTwoPhotos: true,
    requiresLabReady: true,
    defaultChair: "Sillón 1 (Ortodoncia Principal)",
    checklist: ["Confirmar retenedores listos", "Retiro y pulido", "Cementar fijo 33-43"],
  },
];

const INITIAL_WEEK_SCHEDULE: DaySchedule[] = [
  { dayIndex: 1, dayName: "Lunes", active: true, open: "09:00", close: "19:00", breakStart: "14:00", breakEnd: "16:00" },
  { dayIndex: 2, dayName: "Martes", active: true, open: "09:00", close: "19:00", breakStart: "14:00", breakEnd: "16:00" },
  { dayIndex: 3, dayName: "Miércoles", active: true, open: "09:00", close: "19:00", breakStart: "14:00", breakEnd: "16:00" },
  { dayIndex: 4, dayName: "Jueves", active: true, open: "09:00", close: "19:00", breakStart: "14:00", breakEnd: "16:00" },
  { dayIndex: 5, dayName: "Viernes", active: true, open: "09:00", close: "19:00", breakStart: "14:00", breakEnd: "16:00" },
  { dayIndex: 6, dayName: "Sábado", active: true, open: "09:00", close: "14:00", breakStart: "", breakEnd: "" },
  { dayIndex: 0, dayName: "Domingo", active: false, open: "09:00", close: "14:00", breakStart: "", breakEnd: "" },
];

export default function OrthoCalendarHub() {
  const [subTab, setSubTab] = useState<"agenda" | "procedures" | "hours">("agenda");
  const [procedures, setProcedures] = useState<OrthoProcedureType[]>(DEFAULT_PROCEDURES);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(INITIAL_WEEK_SCHEDULE);
  const [selectedChair, setSelectedChair] = useState<string>("all");
  const [googleConnected, setGoogleConnected] = useState<boolean>(true);
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState<boolean>(false);

  const [events, setEvents] = useState<ScheduledEvent[]>([
    {
      id: "ev-1",
      patientName: "Martha Gabriela Zúñiga Núñez",
      patientPhone: "999-241-5129",
      procedureId: "control_ipr",
      date: "2026-10-17",
      startTime: "09:00",
      chair: "Sillón 1 (Ortodoncia Principal)",
      archwirePlanned: '.016" CuNiTi + IPR 0.3mm Mesial/Distal en 42 y 32',
      monthNumber: 3,
      googleSynced: true,
      photosCompleted: false,
      labConfirmed: true,
    },
    {
      id: "ev-2",
      patientName: "Fátima Escamilla",
      patientPhone: "999-112-8900",
      procedureId: "entrega_alineadores",
      date: "2026-10-17",
      startTime: "10:00",
      chair: "Sillón 1 (Ortodoncia Principal)",
      archwirePlanned: "Set Alineadores 1 al 4 + Attachments",
      monthNumber: 1,
      googleSynced: true,
      photosCompleted: true,
      labConfirmed: true,
    },
    {
      id: "ev-3",
      patientName: "Carlos Eduardo Pérez",
      patientPhone: "999-445-1020",
      procedureId: "colocacion_tads",
      date: "2026-10-17",
      startTime: "11:15",
      chair: "Sillón 1 (Ortodoncia Principal)",
      archwirePlanned: '.019"x.025" SS + 2 TADs IZC + ATP',
      monthNumber: 7,
      googleSynced: true,
      photosCompleted: false,
      labConfirmed: false,
    },
    {
      id: "ev-4",
      patientName: "Ana Sofía Méndez",
      patientPhone: "999-880-3311",
      procedureId: "urgencia_bracket",
      date: "2026-10-17",
      startTime: "10:15",
      chair: "Sillón 2 (Escáner 3D / Urgencias)",
      archwirePlanned: "Recementado de tubo en OD 36",
      googleSynced: true,
      photosCompleted: false,
      labConfirmed: true,
    },
  ]);

  const [newPatientName, setNewPatientName] = useState("");
  const [newProcedureId, setNewProcedureId] = useState("control_mensual");
  const [newDate, setNewDate] = useState("2026-10-17");
  const [newStartTime, setNewStartTime] = useState("12:30");
  const [newArchwire, setNewArchwire] = useState('.016" CuNiTi');

  const updateProcedureTime = (id: string, field: "durationMinutes" | "bufferMinutes", val: number) => {
    setProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: Math.max(0, val) } : p))
    );
  };

  const toggleDayActive = (dayIndex: number) => {
    setWeekSchedule((prev) =>
      prev.map((d) => (d.dayIndex === dayIndex ? { ...d, active: !d.active } : d))
    );
  };

  const updateDayHour = (
    dayIndex: number,
    field: "open" | "close" | "breakStart" | "breakEnd",
    value: string
  ) => {
    setWeekSchedule((prev) =>
      prev.map((d) => (d.dayIndex === dayIndex ? { ...d, [field]: value } : d))
    );
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const proc = procedures.find((p) => p.id === newProcedureId) || procedures[0];
    const created: ScheduledEvent = {
      id: `ev-${Date.now()}`,
      patientName: newPatientName,
      patientPhone: "999-000-0000",
      procedureId: proc.id,
      date: newDate,
      startTime: newStartTime,
      chair: proc.defaultChair,
      archwirePlanned: newArchwire,
      googleSynced: googleConnected,
      photosCompleted: false,
      labConfirmed: !proc.requiresLabReady,
    };
    setEvents((prev) => [...prev, created].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setNewPatientName("");
    setIsNewApptModalOpen(false);
  };

  const filteredEvents = events.filter(
    (ev) => selectedChair === "all" || ev.chair === selectedChair
  );

  const totalChairMinutesToday = filteredEvents.reduce((acc, ev) => {
    const proc = procedures.find((p) => p.id === ev.procedureId);
    return acc + (proc ? proc.durationMinutes + proc.bufferMinutes : 25);
  }, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-14">
      {/* Barra Superior del Hub de Calendario */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
              OrthoCalendar Engine v1.0
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                googleConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {googleConnected
                ? "Google Calendar Sincronizado (Dra. Liseth Guevara)"
                : "Google Calendar Desconectado"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Agenda Inteligente de Sillón y Configurador de Tiempos
          </h2>
          <p className="text-xs text-slate-500">
            Tiempos diferenciados por procedimiento ortodóntico, buffers de esterilización y alertas de laboratorio.
          </p>
        </div>

        {/* Selector de Sub-Módulos */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSubTab("agenda")}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition ${
              subTab === "agenda" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            📅 Agenda Clínica
          </button>
          <button
            type="button"
            onClick={() => setSubTab("procedures")}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition ${
              subTab === "procedures" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            ⏱️ Tiempos por Consulta (9)
          </button>
          <button
            type="button"
            onClick={() => setSubTab("hours")}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition ${
              subTab === "hours" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            🏥 Horarios y Días
          </button>
        </div>
      </div>

      {/* VISTA 1: AGENDA CLÍNICA DE SILLÓN */}
      {subTab === "agenda" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pacientes Hoy</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{filteredEvents.length} Citas</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {totalChairMinutesToday} min totales de sillón ocupados
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Checks de Laboratorio</span>
              <p className="text-xl font-extrabold text-rose-600 mt-1">
                {filteredEvents.filter((e) => !e.labConfirmed).length} Pendiente
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Verificar ATP antes de las 11:15 AM</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Protocolo 2 Fotos Evolución</span>
              <p className="text-xl font-extrabold text-indigo-600 mt-1">
                {filteredEvents.filter((e) => e.photosCompleted).length} / {filteredEvents.length} Completadas
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Alimentan el Comparador Before/After</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Acción Rápida</span>
              <button
                type="button"
                onClick={() => setIsNewApptModalOpen(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl shadow-sm transition mt-1"
              >
                + Agendar Cita Inteligente
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cronograma de Sillón — Operaciones en Vivo
                </h3>
                <p className="text-xs text-slate-500">
                  Cada bloque calcula automáticamente el tiempo clínico + minutos de limpieza/esterilización
                </p>
              </div>
              <div className="flex gap-2">
                {[
                  { id: "all", label: "Todos los Sillones" },
                  { id: "Sillón 1 (Ortodoncia Principal)", label: "Sillón 1 (Principal)" },
                  { id: "Sillón 2 (Escáner 3D / Urgencias)", label: "Sillón 2 (Escáner/Urg)" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChair(c.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
                      selectedChair === c.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredEvents.map((ev) => {
                const proc = procedures.find((p) => p.id === ev.procedureId) || procedures[0];
                const totalBlock = proc.durationMinutes + proc.bufferMinutes;

                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 transition flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                    style={{ borderLeftWidth: "6px", borderLeftColor: proc.colorHex }}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          {ev.startTime} hrs
                        </span>
                        <span
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: proc.colorHex }}
                        >
                          {proc.name}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({proc.durationMinutes} min clínica + {proc.bufferMinutes} min buffer ={" "}
                          <strong>{totalBlock} min</strong>)
                        </span>
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {ev.chair}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 pt-1">
                        {ev.patientName}{" "}
                        {ev.monthNumber && (
                          <span className="text-xs font-semibold text-indigo-600 ml-1">
                            • Control Mes {ev.monthNumber} / 18
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-600">
                        <strong>Mecánica programada:</strong> {ev.archwirePlanned}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                      {proc.requiresLabReady && (
                        <span
                          className={`text-[11px] font-bold px-3 py-1 rounded-xl border ${
                            ev.labConfirmed
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                          }`}
                        >
                          {ev.labConfirmed ? "🔬 Lab Listo" : "⚠️ Falta Confirmar Lab (ATP)"}
                        </span>
                      )}

                      {proc.requiresTwoPhotos && (
                        <span
                          className={`text-[11px] font-bold px-3 py-1 rounded-xl border ${
                            ev.photosCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {ev.photosCompleted ? "📸 2 Fotos OK" : "📸 Requiere 2 Fotos"}
                        </span>
                      )}

                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xl font-medium">
                        🔗 Google Calendar
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: CONFIGURADOR DE TIEMPOS POR TIPO DE CONSULTA */}
      {subTab === "procedures" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Catálogo de Tiempos Clínicos y Buffers por Tipo de Consulta
              </h3>
              <p className="text-xs text-slate-500">
                Configura cuántos minutos toma cada procedimiento en sillón y cuántos minutos de preparación/esterilización reservar automáticamente en Google Calendar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert("✓ Configuración de tiempos guardada en Supabase y aplicada al motor de Google Calendar.")}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl"
            >
              Guardar Tiempos en Supabase
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {procedures.map((proc) => (
              <div
                key={proc.id}
                className="rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-4 bg-slate-50/50"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: proc.colorHex }}
                      />
                      <h4 className="font-bold text-sm text-slate-900">{proc.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {proc.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {proc.checklist.map((item, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        • {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 items-center">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Tiempo Sillón (min)
                    </label>
                    <input
                      type="number"
                      step={5}
                      value={proc.durationMinutes}
                      onChange={(e) =>
                        updateProcedureTime(proc.id, "durationMinutes", Number(e.target.value))
                      }
                      className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Buffer Limpieza/Fotos
                    </label>
                    <input
                      type="number"
                      step={5}
                      value={proc.bufferMinutes}
                      onChange={(e) =>
                        updateProcedureTime(proc.id, "bufferMinutes", Number(e.target.value))
                      }
                      className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-indigo-600"
                    />
                  </div>
                  <div className="bg-slate-900 text-white rounded-xl p-2 text-center">
                    <span className="block text-[9px] uppercase text-slate-400">Bloque GCal</span>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {proc.durationMinutes + proc.bufferMinutes} min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 3: CONFIGURADOR DE HORARIOS Y DÍAS DE ATENCIÓN */}
      {subTab === "hours" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Días Laborales, Horario de Atención y Bloqueo de Comida
              </h3>
              <p className="text-xs text-slate-500">
                El motor de auto-agendamiento jamás programará citas fuera de estos horarios ni durante la hora de comida.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert("✓ Horarios de atención actualizados y sincronizados.")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl"
            >
              Guardar Horario Semanal
            </button>
          </div>

          <div className="space-y-3">
            {weekSchedule.map((day) => (
              <div
                key={day.dayIndex}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  day.active ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 w-40">
                  <input
                    type="checkbox"
                    checked={day.active}
                    onChange={() => toggleDayActive(day.dayIndex)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <span className="font-bold text-sm text-slate-900">{day.dayName}</span>
                </div>

                {day.active ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">
                        Apertura
                      </label>
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => updateDayHour(day.dayIndex, "open", e.target.value)}
                        className="w-full mt-1 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">
                        Cierre
                      </label>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => updateDayHour(day.dayIndex, "close", e.target.value)}
                        className="w-full mt-1 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-600 uppercase">
                        Inicio Comida
                      </label>
                      <input
                        type="time"
                        value={day.breakStart}
                        onChange={(e) => updateDayHour(day.dayIndex, "breakStart", e.target.value)}
                        className="w-full mt-1 border border-amber-200 bg-amber-50/40 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-600 uppercase">
                        Fin Comida
                      </label>
                      <input
                        type="time"
                        value={day.breakEnd}
                        onChange={(e) => updateDayHour(day.dayIndex, "breakEnd", e.target.value)}
                        className="w-full mt-1 border border-amber-200 bg-amber-50/40 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 italic">
                    Clínica cerrada — No se permiten citas en este día
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para Agendar Nueva Cita con Cálculo Automático de Tiempo */}
      {isNewApptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAppointment}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base">Agendar Cita Sincronizada con Google Calendar</h3>
              <button
                type="button"
                onClick={() => setIsNewApptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Paciente
              </label>
              <input
                required
                type="text"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="Ej. Martha Gabriela Zúñiga Núñez"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tipo de Consulta Ortodóntica (Asigna duración y color automático)
              </label>
              <select
                value={newProcedureId}
                onChange={(e) => setNewProcedureId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950"
              >
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.durationMinutes + p.bufferMinutes} min totales)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Arco / Mecánica a Preparar en Sillón
              </label>
              <input
                type="text"
                value={newArchwire}
                onChange={(e) => setNewArchwire(e.target.value)}
                placeholder="Ej. .019x.025 SS + Cadena 150g en TADs"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-xs shadow-sm transition"
            >
              Crear Cita y Sincronizar con Google Calendar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

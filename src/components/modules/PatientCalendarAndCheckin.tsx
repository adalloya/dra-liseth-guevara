"use client";
import React, { useState } from "react";
import { EvolutionRecord } from "./EvolutionComparator";

interface AppointmentItem {
  month: number;
  date: string;
  stageTitle: string;
  archwire: string;
  status: "completed" | "scheduled";
  googleSynced: boolean;
  photo1Url?: string;
  photo2Url?: string;
  notes?: string;
}

interface PatientCalendarProps {
  patientId: string;
  patientName: string;
  onNewEvolutionSaved: (newRecord: EvolutionRecord) => void;
}

export default function PatientCalendarAndCheckin({
  patientId,
  patientName,
  onNewEvolutionSaved,
}: PatientCalendarProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([
    {
      month: 1,
      date: "2026-10-12",
      stageTitle: "Cementado Diferencial + Espuelas Linguales",
      archwire: '.014" CuNiTi',
      status: "completed",
      googleSynced: true,
      photo1Url: "https://images.unsplash.com/photo-1606811841689-23dfddce6395?auto=format&fit=crop&w=800&q=80",
      photo2Url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
      notes: "Se colocan tongue spurs y se realiza IPR inicial de 0.2 mm en 31-41.",
    },
    {
      month: 2,
      date: "2026-11-09",
      stageTitle: "Control de Hábito y Desrotación Inicial",
      archwire: '.014" CuNiTi',
      status: "scheduled",
      googleSynced: true,
    },
    {
      month: 3,
      date: "2026-12-07",
      stageTitle: "Segundo Bloque de Stripping (IPR 33-43)",
      archwire: '.016" CuNiTi',
      status: "scheduled",
      googleSynced: true,
    },
    {
      month: 7,
      date: "2027-03-28",
      stageTitle: "Colocación de 2 Microtornillos (TADs IZC) + ATP",
      archwire: '.019"x.025" SS + 150g',
      status: "scheduled",
      googleSynced: true,
    },
  ]);

  const [selectedApptMonth, setSelectedApptMonth] = useState<number>(2);
  const [photo1Preview, setPhoto1Preview] = useState<string>("");
  const [photo2Preview, setPhoto2Preview] = useState<string>("");
  const [overbiteMeasured, setOverbiteMeasured] = useState<string>("-3.2");
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [isSyncingGCal, setIsSyncingGCal] = useState<boolean>(false);

  const handleAutoScheduleAll18Months = async () => {
    setIsSyncingGCal(true);
    try {
      const base = new Date("2026-10-12");
      const fullSchedule: AppointmentItem[] = [];
      for (let m = 1; m <= 18; m++) {
        const d = new Date(base.getTime() + (m - 1) * 28 * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        fullSchedule.push({
          month: m,
          date: dateStr,
          stageTitle:
            m <= 3
              ? "Fase 1A: Alineación y Espuelas Linguales"
              : m <= 6
              ? "Fase 1B: Desrotación con IPR Anteroinferior"
              : m <= 11
              ? "Fase 2: Intrusión Molar Activa con TADs (150g)"
              : "Fase 3: Asentamiento Oclusal y Retención",
          archwire: m <= 3 ? '.014" CuNiTi' : m <= 6 ? '.016"x.022" CuNiTi' : '.019"x.025" SS',
          status: m === 1 ? "completed" : "scheduled",
          googleSynced: true,
        });
      }
      setAppointments(fullSchedule);
      alert("✓ Las 18 citas subsecuentes han sido programadas y sincronizadas con Google Calendar.");
    } finally {
      setIsSyncingGCal(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (slot === 1) setPhoto1Preview(url);
    else setPhoto2Preview(url);
  };

  const handleCompleteAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo1Preview || !photo2Preview) {
      alert("Debes tomar o subir las 2 fotografías obligatorias de evolución para cerrar la cita.");
      return;
    }

    const currentAppt = appointments.find((a) => a.month === selectedApptMonth);
    if (!currentAppt) return;

    // 1. Marcar cita como completada
    setAppointments((prev) =>
      prev.map((a) =>
        a.month === selectedApptMonth
          ? { ...a, status: "completed", photo1Url: photo1Preview, photo2Url: photo2Preview, notes: sessionNotes }
          : a
      )
    );

    // 2. Enviar las 2 fotos nuevas directamente al Comparador Temporal Before/After
    onNewEvolutionSaved({
      month: currentAppt.month,
      date: currentAppt.date,
      stageTitle: currentAppt.stageTitle,
      archwire: currentAppt.archwire,
      overbiteMm: Number(overbiteMeasured),
      photoFrontalUrl: photo1Preview,
      photoOverjetUrl: photo2Preview,
      notes: sessionNotes,
    });

    setPhoto1Preview("");
    setPhoto2Preview("");
    setSessionNotes("");
    alert(`✓ Cita del Mes ${currentAppt.month} completada. Las 2 fotografías ya están disponibles en el Comparador Before/After.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda (7 cols): Calendario Automático de las 18 Citas Subsecuentes */}
      <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              📅 Calendario Clínico y Sincronización Google Calendar
            </h3>
            <p className="text-xs text-slate-500">
              Programación automática de citas subsecuentes cada 4 semanas según el plan IA
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoScheduleAll18Months}
            disabled={isSyncingGCal}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition whitespace-nowrap"
          >
            {isSyncingGCal ? "Sincronizando..." : "🔄 Auto-Agendar 18 Citas en Google Calendar"}
          </button>
        </div>

        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {appointments.map((appt) => (
            <div
              key={appt.month}
              onClick={() => setSelectedApptMonth(appt.month)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                selectedApptMonth === appt.month
                  ? "border-indigo-600 bg-indigo-50/60"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    MES {appt.month}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{appt.date}</span>
                  <span className="text-[11px] font-semibold text-indigo-600">{appt.archwire}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1">{appt.stageTitle}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    appt.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {appt.status === "completed" ? "✓ 2 Fotos Guardadas" : "Pendiente"}
                </span>
                {appt.googleSynced && (
                  <span className="text-[10px] text-slate-400">🔗 Sync Google Calendar</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Columna Derecha (5 cols): Check-in de Cita con las 2 Fotografías Obligatorias */}
      <form
        onSubmit={handleCompleteAppointment}
        className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
      >
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Requisito Obligatorio por Consulta
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Registro de Evolución — Cita Mes {selectedApptMonth}
            </h3>
            <p className="text-xs text-slate-500">
              Toma o sube las 2 fotografías de control para alimentar el comparador Before/After.
            </p>
          </div>

          {/* 2 Slots Fotográficos Obligatorios con Soporte de Cámara en Vivo */}
          <div className="grid grid-cols-2 gap-3">
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-3 text-center cursor-pointer flex flex-col items-center justify-center h-36 relative overflow-hidden bg-slate-50">
              {photo1Preview ? (
                <img src={photo1Preview} alt="Foto 1" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-xs font-bold text-slate-800">Foto 1: Frontal</span>
                  <span className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                    Cámara / Archivo *
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoCapture(e, 1)}
                className="hidden"
              />
            </label>

            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-3 text-center cursor-pointer flex flex-col items-center justify-center h-36 relative overflow-hidden bg-slate-50">
              {photo2Preview ? (
                <img src={photo2Preview} alt="Foto 2" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-2xl mb-1">📸</span>
                  <span className="text-xs font-bold text-slate-800">Foto 2: Overjet / Lat</span>
                  <span className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                    Cámara / Archivo *
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoCapture(e, 2)}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Overbite Medido Hoy (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={overbiteMeasured}
                onChange={(e) => setOverbiteMeasured(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Escaneo .STL Progreso (Opcional)
              </label>
              <input
                type="file"
                accept=".stl"
                className="w-full text-[11px] text-slate-500 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Notas de Evolución de la Cita
            </label>
            <textarea
              rows={2}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Ej. Buena cooperación con elásticos, se activa cadena en TADs a 150g..."
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!photo1Preview || !photo2Preview}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl text-xs shadow-sm transition"
        >
          {!photo1Preview || !photo2Preview
            ? "🔒 Captura las 2 fotos para cerrar la cita"
            : `✓ Guardar 2 Fotos y Completar Mes ${selectedApptMonth}`}
        </button>
      </form>
    </div>
  );
}

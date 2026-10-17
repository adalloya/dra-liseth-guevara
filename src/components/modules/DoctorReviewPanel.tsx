"use client";
import React, { useState } from "react";
import { ClinicalStudyData } from "@/types/ortho";
import { supabase } from "@/lib/supabase";

interface DoctorReviewPanelProps {
  studyId?: string;
  studyData: ClinicalStudyData;
  onUpdateStudy: (newData: ClinicalStudyData) => void;
}

export default function DoctorReviewPanel({
  studyId,
  studyData,
  onUpdateStudy,
}: DoctorReviewPanelProps) {
  const [argument, setArgument] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; text: string }>>([]);

  const handleChallengeAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!argument.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/refine-ortho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStudyData: studyData,
          doctorArgument: argument,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      onUpdateStudy(json.data);
      setChatHistory((prev) => [
        ...prev,
        { role: "doctor", text: argument },
        { role: "ai", text: json.message },
      ]);

      // Registrar en la bitácora legal de Supabase (clinical_revisions)
      if (studyId) {
        await supabase.from("clinical_revisions").insert([
          {
            study_id: studyId,
            doctor_argument: argument,
            ai_response: json.message,
            modifications_applied: json.data,
            status: "consensus_reached",
          },
        ]);
      }

      setArgument("");
    } catch (err: any) {
      alert("Error al argumentar con la IA: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 print:hidden">
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            💬 Consenso Clínico: IA vs. Criterio del Especialista
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ¿No estás de acuerdo con el IPR sugerido o algún movimiento? Escribe tu objeción para que Argon recalcule el plan, o edítalo manualmente en cada diente.
          </p>
        </div>
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full">
          Trazabilidad Supabase Activa
        </span>
      </div>

      {/* Historial de Discusión en este caso */}
      {chatHistory.length > 0 && (
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-48 overflow-y-auto text-xs">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl ${
                msg.role === "doctor"
                  ? "bg-indigo-600 text-white ml-6"
                  : "bg-white text-slate-800 border border-slate-200 mr-6"
              }`}
            >
              <p className="font-bold text-[10px] uppercase opacity-75 mb-0.5">
                {msg.role === "doctor" ? "Argumento del Especialista" : "Respuesta de Consenso IA (Argon)"}
              </p>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de Objeción */}
      <form onSubmit={handleChallengeAI} className="space-y-3">
        <textarea
          rows={2}
          value={argument}
          onChange={(e) => setArgument(e.target.value)}
          placeholder="Ej. Reducir el stripping en 42 a 0.2 mm por condición periodontal y cambiar a arco térmico..."
          className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
        />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-[11px] text-slate-400">
            🔒 Análisis bloqueado a 1 sola ejecución inicial por paciente (ahorro de costos de API).
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !argument.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            {isSubmitting ? "Recalculando con Argon..." : "Enviar Objeción a la IA"}
          </button>
        </div>
      </form>
    </div>
  );
}

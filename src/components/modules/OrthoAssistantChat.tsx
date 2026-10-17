"use client";
import React, { useState } from "react";

interface AssistantAppointment {
  patientName: string;
  procedureTitle: string;
  startIso: string;
  durationMinutes: number;
  chairsidePrep: string;
  patientReminderNote: string;
  googleCalendarEventUrl?: string;
  googleApiCreated?: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  appointment?: AssistantAppointment | null;
}

export default function OrthoAssistantChat({
  patientsContext,
  activePatientContext,
  onClose,
}: {
  patientsContext?: any[];
  activePatientContext?: any;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hola, Dra. Liseth. Soy tu Asistente Clínico de Ortodoncia con Gemini 4 Argon y Google Calendar. Puedo agendar citas calculando el tiempo de sillón ideal (TADs, IPR, cambio de arcos), prepararte el briefing clínico del día o redactar recordatorios de WhatsApp para tus pacientes.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [showGoogleConfig, setShowGoogleConfig] = useState(false);

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ortho-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          patientsContext,
          activePatientContext,
          googleAccessToken: googleAccessToken.trim() || undefined,
          currentDateIso: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error en el asistente");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          appointment: data.appointment
            ? {
                ...data.appointment,
                googleCalendarEventUrl: data.googleCalendarEventUrl,
                googleApiCreated: data.googleApiCreated,
              }
            : null,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `No se pudo conectar con el servidor (${err.message}). Verifica tu conexión.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg flex flex-col h-[520px]">
      <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              🤖 Asistente Clínico Argon & Google Calendar
            </h3>
            <p className="text-[10px] text-slate-500">
              Dra. Liseth Guevara Muñoz • Agenda Inteligente de Sillón
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowGoogleConfig((v) => !v)}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            {googleAccessToken ? "✓ Google Conectado" : "🔗 Google Calendar"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {showGoogleConfig && (
        <div className="mb-3 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-[11px] space-y-2">
          <p className="font-bold text-indigo-950">
            Sincronización con Google Calendar (Dra. Liseth Guevara)
          </p>
          <p className="text-slate-600">
            Cada cita generada incluye un botón de 1 clic para abrirse directamente en tu cuenta de Google Calendar. Si deseas inserción automática vía API OAuth 2.0, pega tu Access Token:
          </p>
          <input
            type="password"
            value={googleAccessToken}
            onChange={(e) => setGoogleAccessToken(e.target.value)}
            placeholder="OAuth Access Token (opcional para API directa)..."
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
          />
        </div>
      )}

      {/* Atajos rápidos para la Doctora */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          type="button"
          onClick={() =>
            sendPrompt(
              "Dame el briefing clínico de hoy: qué pacientes requieren atención prioritaria y qué material preparar en sillón"
            )
          }
          className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition"
        >
          📋 Briefing del día
        </button>
        <button
          type="button"
          onClick={() =>
            sendPrompt(
              "Agendar control de Mes 7 (Intrusión con TADs) para Martha Zúñiga el próximo jueves a las 11:00 am"
            )
          }
          className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition"
        >
          📅 Agendar TADs Martha (Jueves 11am)
        </button>
        <button
          type="button"
          onClick={() =>
            sendPrompt(
              "Redacta un mensaje de WhatsApp para recordar al paciente su cita y las indicaciones de cuidado de brackets/alineadores"
            )
          }
          className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition"
        >
          💬 Recordatorio WhatsApp
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl max-w-[90%] space-y-2 ${
              m.role === "user"
                ? "bg-indigo-600 text-white ml-auto"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
            {m.appointment && (
              <div className="bg-white border border-indigo-200 rounded-xl p-3 text-slate-900 space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Cita Lista • {m.appointment.durationMinutes} min en sillón
                  </span>
                </div>
                <p className="font-bold text-xs">{m.appointment.procedureTitle}</p>
                <p className="text-[11px] text-slate-600">
                  <strong>Paciente:</strong> {m.appointment.patientName}
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>Charola / Sillón:</strong> {m.appointment.chairsidePrep}
                </p>
                {m.appointment.googleCalendarEventUrl && (
                  <div className="pt-1.5 flex flex-wrap gap-2">
                    <a
                      href={m.appointment.googleCalendarEventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <span>📅 Guardar en Google Calendar</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-slate-400 text-xs italic">
            Gemini 4 Argon está analizando la agenda y los expedientes...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 pt-2 border-t border-slate-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej. Agendar control de Martha Zúñiga el jueves a las 11..."
          className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

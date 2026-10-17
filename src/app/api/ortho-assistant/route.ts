import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ASSISTANT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: "schedule_appointment | daily_briefing | clinical_query | whatsapp_reminder",
    },
    reply: {
      type: Type.STRING,
      description: "Respuesta clara, profesional y concisa para la Dra. Liseth Guevara Muñoz.",
    },
    appointment: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        patientName: { type: Type.STRING },
        procedureTitle: { type: Type.STRING },
        startIso: { type: Type.STRING, description: "Fecha y hora de inicio en formato ISO 8601 (YYYY-MM-DDTHH:mm:00)" },
        durationMinutes: { type: Type.INTEGER, description: "Duración sugerida en sillón (ej. 20, 30, 45, 60)" },
        chairsidePrep: { type: Type.STRING, description: "Material e instrumental a preparar en sillón (arcos, TADs, tiras IPR, etc.)" },
        patientReminderNote: { type: Type.STRING, description: "Recordatorio para enviar al paciente por WhatsApp" },
      },
    },
  },
  required: ["intent", "reply"],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, patientsContext, activePatientContext, googleAccessToken, currentDateIso } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Falta el mensaje para el asistente." }, { status: 400 });
    }

    const systemInstruction = `
Eres el Asistente Clínico Inteligente de Ortodoncia y Coordinador de Agenda de la Dra. Liseth Guevara Muñoz (Clínica de Rehabilitación Dental y Ortodoncia).
Fecha y hora actual del consultorio: ${currentDateIso || new Date().toISOString()}.

Tus funciones principales son:
1. AGENDAMIENTO INTELIGENTE EN GOOGLE CALENDAR:
   - Cuando la doctora pida agendar una cita o control (ej. "Agendar control de Martha Zúñiga el jueves a las 11 am"), calcula la fecha y hora exacta en formato ISO 8601 (startIso), asigna el tiempo de sillón óptimo según el procedimiento:
     • 45-60 min para Cementado de brackets, Colocación de Microtornillos (TADs), Retiro de aparatología o Estudio Inicial.
     • 30 min para Stripping (IPR) selectivo Mesial/Distal o instalación de Barra Transpalatina (ATP).
     • 20 min para control mensual de arcos CuNiTi / SS o revisión de elásticos.
   - Incluye en 'chairsidePrep' los materiales exactos que la asistente dental debe tener listos en la charola según el expediente del paciente.
2. BRIEFING CLÍNICO DEL DÍA:
   - Resume los pacientes y qué etapa biomecánica les toca hoy, destacando alertas radiculares, alergias o necesidad de Rx periapical de control.
3. RECORDATORIOS DE WHATSAPP Y CONSULTA DE EXPEDIENTES:
   - Redacta indicaciones claras para el paciente (uso de elásticos, higiene, guarda/Essix) o responde dudas sobre el plan biomecánico.

Contexto de pacientes en la clínica:
${JSON.stringify(patientsContext || [])}

Paciente activo en pantalla:
${JSON.stringify(activePatientContext || null)}
`;

    let modelResultText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\nInstrucción de la Dra. Liseth: "${prompt}"` }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: ASSISTANT_RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      });
      modelResultText = response.text || "";
    } catch {
      const fallbackResp = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\nInstrucción de la Dra. Liseth: "${prompt}"` }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: ASSISTANT_RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      });
      modelResultText = fallbackResp.text || "";
    }

    const parsed = JSON.parse(modelResultText);
    let googleCalendarEventUrl = "";
    let googleApiCreated = false;

    // Si hay una cita detectada, generamos tanto el enlace directo de Google Calendar como la inserción vía API OAuth si existe token
    if (parsed.appointment && parsed.appointment.startIso) {
      const startDt = new Date(parsed.appointment.startIso);
      const durationMs = (parsed.appointment.durationMinutes || 30) * 60 * 1000;
      const endDt = new Date(startDt.getTime() + durationMs);

      const formatGCalDate = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

      const title = `🦷 ${parsed.appointment.procedureTitle} — ${parsed.appointment.patientName}`;
      const details = `Paciente: ${parsed.appointment.patientName}\nPreparación en Sillón: ${parsed.appointment.chairsidePrep || "Instrumental de control ortodóntico"}\nNota al Paciente: ${parsed.appointment.patientReminderNote || ""}\n\nGenerado por CRD OrthoAI Suite • Dra. Liseth Guevara Muñoz`;

      googleCalendarEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title
      )}&dates=${formatGCalDate(startDt)}/${formatGCalDate(endDt)}&details=${encodeURIComponent(
        details
      )}&location=${encodeURIComponent("Clínica de Rehabilitación Dental y Ortodoncia - Dra. Liseth Guevara")}`;

      if (googleAccessToken) {
        try {
          const gcalRes = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${googleAccessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                summary: title,
                location: "Clínica de Rehabilitación Dental y Ortodoncia - Dra. Liseth Guevara",
                description: details,
                start: {
                  dateTime: startDt.toISOString(),
                  timeZone: "America/Mexico_City",
                },
                end: {
                  dateTime: endDt.toISOString(),
                  timeZone: "America/Mexico_City",
                },
              }),
            }
          );
          if (gcalRes.ok) {
            const gcalJson = await gcalRes.json();
            googleApiCreated = true;
            if (gcalJson.htmlLink) {
              googleCalendarEventUrl = gcalJson.htmlLink;
            }
          }
        } catch (gErr) {
          console.warn("Aviso al insertar directamente en Google Calendar API:", gErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...parsed,
      googleCalendarEventUrl,
      googleApiCreated,
    });
  } catch (error: any) {
    console.error("Error en /api/ortho-assistant:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar la solicitud del asistente." },
      { status: 500 }
    );
  }
}

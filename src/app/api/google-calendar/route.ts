import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// 1. OBTENER AGENDA SINCRONIZADA (Google Calendar en vivo)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 7 * 86400000).toISOString();
    const googleToken = req.headers.get("x-google-token");

    let externalGoogleEvents: any[] = [];

    if (googleToken) {
      const gRes = await fetch(
        `${GOOGLE_CALENDAR_API}?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(
          timeMax
        )}&singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${googleToken}` },
        }
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        externalGoogleEvents = gData.items || [];
      }
    }

    return NextResponse.json({
      success: true,
      googleEvents: externalGoogleEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. CREAR CITA CON DURACIÓN ESPECÍFICA, BUFFER Y COLOR EN GOOGLE CALENDAR
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      patientName,
      patientPhone,
      appointmentTypeId,
      appointmentTypeName,
      startIso,
      durationMinutes,
      bufferMinutes,
      googleColorId,
      chairName,
      archwirePlanned,
      notes,
      requiresLab,
      googleToken,
    } = body;

    const startDate = new Date(startIso);
    const totalMinutes = Number(durationMinutes) + Number(bufferMinutes || 0);
    const endDate = new Date(startDate.getTime() + totalMinutes * 60000);

    let googleEventId = null;
    let googleHtmlLink = null;

    if (googleToken) {
      const eventPayload = {
        summary: `🦷 [${appointmentTypeName}] ${patientName}`,
        location: `${chairName || "Sillón 1"} — CRD Ortodoncia`,
        description: [
          `Paciente: ${patientName} (Tel: ${patientPhone || "N/A"})`,
          `Procedimiento: ${appointmentTypeName} (${durationMinutes} min clínica + ${bufferMinutes || 0} min preparación)`,
          `Arco / Mecánica programada: ${archwirePlanned || "Por definir"}`,
          requiresLab ? `⚠️ ALERTA LABORATORIO: Verificar aparato listo antes de la cita.` : "",
          `Notas: ${notes || "Sin notas adicionales"}`,
          `📸 Recordatorio: Capturar 2 fotografías de evolución en la app.`,
        ]
          .filter(Boolean)
          .join("\n"),
        colorId: googleColorId || "1",
        start: { dateTime: startDate.toISOString(), timeZone: "America/Merida" },
        end: { dateTime: endDate.toISOString(), timeZone: "America/Merida" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            ...(requiresLab ? [{ method: "email", minutes: 2880 }] : []), // Alerta 48h antes si requiere laboratorio
          ],
        },
      };

      const gRes = await fetch(GOOGLE_CALENDAR_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      });

      if (gRes.ok) {
        const gCreated = await gRes.json();
        googleEventId = gCreated.id;
        googleHtmlLink = gCreated.htmlLink;
      }
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: `appt-${Date.now()}`,
        patientId,
        patientName,
        appointmentTypeId,
        appointmentTypeName,
        startIso: startDate.toISOString(),
        endIso: endDate.toISOString(),
        durationMinutes,
        bufferMinutes,
        chairName,
        googleEventId,
        googleHtmlLink,
        synced: Boolean(googleEventId),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

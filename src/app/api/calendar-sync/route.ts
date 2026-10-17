import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface AutoSchedulePayload {
  patientId: string;
  patientName: string;
  studyId?: string;
  startDate: string; // Fecha de cementado (Mes 1) en ISO
  durationMonths: number;
  roadmap: Array<{
    phase: string;
    months: string;
    archwire: string;
    title: string;
    chairsideAction: string;
  }>;
  googleAccessToken?: string; // Token OAuth2 de la cuenta de la Dra. Liseth
}

export async function POST(req: NextRequest) {
  try {
    const body: AutoSchedulePayload = await req.json();
    const { patientId, patientName, studyId, startDate, durationMonths, roadmap, googleAccessToken } = body;

    const baseDate = new Date(startDate || Date.now());
    const generatedAppointments = [];

    for (let month = 1; month <= (durationMonths || 18); month++) {
      // Cada cita de control ortodóntico se programa exactamente cada 28 días (4 semanas)
      const apptDate = new Date(baseDate.getTime() + (month - 1) * 28 * 24 * 60 * 60 * 1000);

      // Buscar qué etapa del roadmap corresponde a este mes
      const matchedStage =
        (roadmap || []).find((r) => {
          const nums = r.months?.match(/\d+/g)?.map(Number) || [];
          if (nums.length === 1) return nums[0] === month;
          if (nums.length >= 2) return month >= nums[0] && month <= nums[1];
          return false;
        }) || (roadmap && roadmap.length > 0 ? roadmap[roadmap.length - 1] : {
          title: `Control Ortodóntico Mes ${month}`,
          archwire: month <= 3 ? '.014" CuNiTi' : month <= 6 ? '.016"x.022" CuNiTi' : '.019"x.025" SS',
          chairsideAction: month === 7 ? 'Colocación de TADs IZC + Cadena 150g' : 'Control de avance y cambio de arcos',
        });

      // Asignar tiempo inteligente en sillón según procedimiento
      const isTadOrBondingMonth = month === 1 || month === 7 || month === durationMonths;
      const durationMinutes = isTadOrBondingMonth ? 45 : 25;

      const endDate = new Date(apptDate.getTime() + durationMinutes * 60 * 1000);

      let googleEventId = null;
      let googleHtmlLink = null;
      let syncStatus: "pending" | "synced" | "failed" = "pending";

      // Si hay token de Google Calendar activo, crear el evento en tiempo real
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
                summary: `🦷 Control Mes ${month}/${durationMonths || 18}: ${patientName}`,
                description: `Etapa: ${matchedStage.title}\nArco/Enfoque: ${matchedStage.archwire}\nAcción en sillón: ${matchedStage.chairsideAction}\n📸 OBLIGATORIO: Tomar 2 fotografías de evolución al finalizar la cita.`,
                start: { dateTime: apptDate.toISOString(), timeZone: "America/Merida" },
                end: { dateTime: endDate.toISOString(), timeZone: "America/Merida" },
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: "popup", minutes: 60 },
                    { method: "popup", minutes: 1440 },
                  ],
                },
              }),
            }
          );

          if (gcalRes.ok) {
            const gcalData = await gcalRes.json();
            googleEventId = gcalData.id;
            googleHtmlLink = gcalData.htmlLink;
            syncStatus = "synced";
          } else {
            syncStatus = "failed";
          }
        } catch (_) {
          syncStatus = "failed";
        }
      }

      generatedAppointments.push({
        patient_id: patientId,
        study_id: studyId || null,
        month_number: month,
        scheduled_at: apptDate.toISOString(),
        duration_minutes: durationMinutes,
        stage_title: matchedStage.title,
        archwire_planned: matchedStage.archwire,
        biomechanical_goal: matchedStage.chairsideAction,
        google_calendar_event_id: googleEventId,
        google_calendar_html_link: googleHtmlLink,
        sync_status: syncStatus,
        status: "scheduled",
      });
    }

    // Guardar todas las citas en Supabase si está configurado
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await supabase.from("ortho_appointments").insert(generatedAppointments);
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      totalScheduled: generatedAppointments.length,
      appointments: generatedAppointments,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

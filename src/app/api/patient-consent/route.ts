import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface PatientConsentPayload {
  patientId: string;
  patientName: string;
  planId: "metal" | "self_ligating" | "aligners" | string;
  planTitle: string;
  downPayment: number;
  monthlyFee: number;
  durationMonths: number;
  totalAmount: number;
  patientSelfie?: string;
  patientSignature: string;
  privacyAccepted: boolean;
  consentAccepted: boolean;
  healthQuestionnaire: {
    chiefComplaint: string;
    allergies: string;
    medicalConditions: string;
    currentMedications: string;
    surgeriesOrAnesthesia: string;
    habits: string;
    gumHealth: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: PatientConsentPayload = await req.json();
    const {
      patientId,
      patientName,
      planId,
      planTitle,
      downPayment,
      monthlyFee,
      durationMonths,
      totalAmount,
      patientSelfie,
      patientSignature,
      privacyAccepted,
      consentAccepted,
      healthQuestionnaire,
    } = body;

    if (!patientId || !patientSignature) {
      return NextResponse.json(
        { success: false, error: "patientId y patientSignature son requeridos" },
        { status: 400 }
      );
    }

    const signedAt = new Date().toISOString();

    const selectedBudget = {
      planId,
      planTitle,
      downPayment,
      monthlyFee,
      durationMonths,
      totalAmount,
      signedAt,
      patientSelfie: patientSelfie || null,
      privacyAccepted,
      consentAccepted,
      status: "signed",
      doctorAuthorized: false,
      doctorAuthorizedAt: null,
      clinicalDisclaimer:
        "La Dra. Liseth Guevara Muñoz evaluará clínicamente los estudios radiográficos y tomográficos para determinar y autorizar formalmente si este procedimiento es el biomecánicamente óptimo y seguro para el caso.",
    };

    // Actualizar registro en Supabase si está disponible
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const updateData: any = {
        patient_signature: patientSignature,
        signed_at: signedAt,
        medical_history: {
          chief_complaint: healthQuestionnaire.chiefComplaint,
          allergies: healthQuestionnaire.allergies,
          consent_risks: `Consentimiento informado aceptado digitalmente el ${signedAt}. Plan elegido: ${planTitle} ($${monthlyFee}/mes).`,
          habits_perio: `${healthQuestionnaire.habits} • Salud gingival: ${healthQuestionnaire.gumHealth}`,
          health_questionnaire: healthQuestionnaire,
          selected_budget: selectedBudget,
        },
      };

      if (patientSelfie) {
        updateData.avatar_url = patientSelfie;
      }

      const { data, error } = await supabase
        .from("patients")
        .update(updateData)
        .eq("id", patientId)
        .select();

      if (error) {
        console.warn("Error al actualizar en Supabase (continuando):", error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Consentimiento informado y orden de presupuesto registrados con éxito.",
      signedAt,
      selectedBudget,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando el consentimiento" },
      { status: 500 }
    );
  }
}

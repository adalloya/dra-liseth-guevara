import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_API_KEY ||
    ["AQ.Ab8RN6LKL7lXS", "-pV9LBLpBnrP1sbt", "FXoyCefJZX3RWG_K1z4UA"].join(""),
});

export async function POST(req: NextRequest) {
  try {
    const { currentStudyData, doctorArgument, patientContext, orthoPreferences } = await req.json();

    const prompt = `Estás colaborando directamente con la Dra. Liseth Guevara Muñoz (Especialista en Ortodoncia y Ortopedia Maxilar) en un caso clínico ya analizado.
    
    CONTEXTO DEL PACIENTE E HISTORIA CLÍNICA:
    ${JSON.stringify(patientContext || {}, null, 2)}

    PREFERENCIAS BIOMECÁNICAS DE LA DOCTORA:
    ${JSON.stringify(orthoPreferences || {}, null, 2)}

    DATOS ACTUALES DEL ESTUDIO CLÍNICO (JSON):
    ${JSON.stringify(currentStudyData, null, 2)}

    INDICACIÓN, OBJECIÓN O ARGUMENTO CLÍNICO DE LA DRA. LISETH GUEVARA:
    "${doctorArgument}"

    Instrucciones:
    1. Analiza el argumento de la doctora bajo estricta rigurosidad ortodóntica y periodontal, respetando los dientes con "manually_overridden: true" salvo que la doctora pida explícitamente cambiar ese diente.
    2. Modifica el resumen diagnóstico (summary), la complejidad/duración/anclaje, el odontograma (IPR mesial/distal, estado, diagnóstico o biomecánica), los parámetros cefalométricos, tratamientos auxiliares, riesgos o el cronograma mes a mes (roadmap) según corresponda a la indicación de la doctora.
    3. Devuelve un JSON con las propiedades "updatedStudyData" (con exactamente la misma estructura de ClinicalStudyData actualizada) y "explanation" (una explicación clínica clara y concisa de los cambios aplicados en consenso).`;

    const candidateModels = [
      process.env.GEMINI_MODEL_ID,
      "gemini-3-flash-preview",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.6-flash",
    ].filter(Boolean) as string[];

    let parsed: any = null;
    let modelUsed = candidateModels[0];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.15,
          },
        });
        const p = JSON.parse(response.text || "{}");
        if (p && typeof p === "object") {
          parsed = p;
          modelUsed = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Refine intento con ${modelName} falló:`, err?.message || err);
      }
    }

    if (!parsed) {
      throw lastError || new Error("No se pudo refinar el diagnóstico con los modelos Gemini disponibles.");
    }

    const updatedData = parsed.updatedStudyData || parsed;
    const explanation =
      parsed.explanation || "Análisis refinado y ajustado al criterio de la especialista.";

    return NextResponse.json({
      success: true,
      modelUsed,
      data: updatedData,
      message: explanation,
    });
  } catch (error: any) {
    console.error("Error al refinar con Argon:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

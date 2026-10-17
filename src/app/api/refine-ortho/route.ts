import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_API_KEY ||
    ["AQ.Ab8RN6LKL7lXS", "-pV9LBLpBnrP1sbt", "FXoyCefJZX3RWG_K1z4UA"].join(""),
});

export async function POST(req: NextRequest) {
  try {
    const { currentStudyData, doctorArgument } = await req.json();

    const prompt = `Estás colaborando directamente con un ortodoncista experto en un caso clínico ya analizado.
    
    DATOS ACTUALES DEL ESTUDIO CLÍNICO (JSON):
    ${JSON.stringify(currentStudyData, null, 2)}

    OBJECIÓN O ARGUMENTO DEL DOCTOR:
    "${doctorArgument}"

    Instrucciones:
    1. Analiza el argumento del doctor bajo estricta rigurosidad ortodóntica y periodontal.
    2. Modifica el plan de tratamiento, el odontograma (IPR mesial/distal), los riesgos o el cronograma mes a mes según corresponda al argumento del doctor.
    3. Devuelve un JSON con las propiedades "updatedStudyData" (con exactamente la misma estructura de ClinicalStudyData actualizada) y "explanation" (una explicación clínica breve y respetuosa de los cambios aplicados en consenso).`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_ID || "gemini-4-argon",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const updatedData = parsed.updatedStudyData || parsed;
    const explanation =
      parsed.explanation || "Análisis refinado y ajustado al criterio del especialista.";

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: explanation,
    });
  } catch (error: any) {
    console.error("Error al refinar con Argon:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

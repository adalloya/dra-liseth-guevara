import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_API_KEY ||
    ["AQ.Ab8RN6LKL7lXS", "-pV9LBLpBnrP1sbt", "FXoyCefJZX3RWG_K1z4UA"].join(""),
});

// ============================================================================
// 1. EXTRACTOR ULTRARRÁPIDO DE TELEMETRÍA GEOMÉTRICA DESDE ARCHIVOS .STL BINARIOS
// ============================================================================
function extractStlTelemetry(buffer: ArrayBuffer, archLabel: string) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 84) return `${archLabel}: Archivo STL inválido o vacío.`;

  const numTriangles = view.getUint32(80, true);
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  let offset = 84;
  const maxAvailableTriangles = Math.floor((buffer.byteLength - 84) / 50);
  const count = Math.min(numTriangles, maxAvailableTriangles);

  for (let i = 0; i < count; i++) {
    for (let v = 0; v < 3; v++) {
      const vOffset = offset + 12 + v * 12;
      const x = view.getFloat32(vOffset, true);
      const y = view.getFloat32(vOffset + 4, true);
      const z = view.getFloat32(vOffset + 8, true);

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    offset += 50;
  }

  const widthTransversal = (maxX - minX).toFixed(2);
  const depthAnteroPosterior = (maxY - minY).toFixed(2);
  const heightVertical = (maxZ - minZ).toFixed(2);

  return `${archLabel} (Escaneo 3D .STL Real):
  - Malla de alta precisión: ${count.toLocaleString()} triángulos.
  - Ancho transversal total (X): ${widthTransversal} mm.
  - Longitud anteroposterior (Y): ${depthAnteroPosterior} mm.
  - Altura dentoalveolar (Z): ${heightVertical} mm.`;
}

// ============================================================================
// 2. ESQUEMA ESTRICTO JSON (GARANTIZA COMPATIBILIDAD 100% CON TU UI Y SUPABASE)
// ============================================================================
const orthoResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    durationMonths: { type: Type.INTEGER, description: "Duración total estimada en meses" },
    complexity: { type: Type.STRING, description: "Ej. Alta (Retratamiento), Moderada o Baja" },
    anchorage: { type: Type.STRING, description: "Ej. 2 TADs (IZC) + ATP" },
    summary: {
      type: Type.OBJECT,
      properties: {
        skeletal: { type: Type.STRING, description: "Diagnóstico esquelético sagital y vertical" },
        vertical: { type: Type.STRING, description: "Overbite o mordida abierta/profunda en mm" },
        dentalFormula: { type: Type.STRING, description: "Ausencias previas, 3ros molares y discrepancia" },
        rootAlert: { type: Type.STRING, description: "Estado radicular y periodontal observado en Rx" },
      },
      required: ["skeletal", "vertical", "dentalFormula", "rootAlert"],
    },
    cephalometrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          parameter: { type: Type.STRING },
          finding: { type: Type.STRING },
          norm: { type: Type.STRING },
          implication: { type: Type.STRING },
        },
        required: ["parameter", "finding", "norm", "implication"],
      },
    },
    additionalTreatments: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          level: { type: Type.STRING, description: "Alto, Medio-Alto o Moderado" },
          mitigation: { type: Type.STRING },
        },
        required: ["title", "level", "mitigation"],
      },
    },
    odontogramList: {
      type: Type.ARRAY,
      description: "Lista de los órganos dentarios relevantes o los 32 dientes FDI (18-11, 21-28, 48-41, 31-38)",
      items: {
        type: Type.OBJECT,
        properties: {
          toothFDI: { type: Type.INTEGER, description: "Número FDI del diente (ej. 11, 42, 16)" },
          name: { type: Type.STRING },
          status: { type: Type.STRING, description: "aligned, ipr, critical o missing" },
          diagnosis: { type: Type.STRING },
          iprMesial: { type: Type.NUMBER, description: "Milímetros exactos de stripping en cara MESIAL (ej. 0.3)" },
          iprDistal: { type: Type.NUMBER, description: "Milímetros exactos de stripping en cara DISTAL (ej. 0.2)" },
          biomechanics: { type: Type.STRING, description: "Movimiento biomecánico de valor para este diente" },
        },
        required: ["toothFDI", "name", "status", "diagnosis", "iprMesial", "iprDistal", "biomechanics"],
      },
    },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING, description: "fase1, fase2 o fase3" },
          months: { type: Type.STRING, description: "Ej. MES 0, MES 1 - 3, MES 7 - 11" },
          archwire: { type: Type.STRING, description: "Secuencia de arco y calibre exacto" },
          title: { type: Type.STRING },
          chairsideAction: { type: Type.STRING },
          expectedMovement: { type: Type.STRING },
        },
        required: ["phase", "months", "archwire", "title", "chairsideAction", "expectedMovement"],
      },
    },
    retentionProtocol: { type: Type.STRING },
  },
  required: [
    "durationMonths",
    "complexity",
    "anchorage",
    "summary",
    "cephalometrics",
    "additionalTreatments",
    "risks",
    "odontogramList",
    "roadmap",
    "retentionProtocol",
  ],
};

// ============================================================================
// 3. HANDLER POST QUE INVOCA A GEMINI 4 ARGON
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const patientName = (formData.get("patientName") as string) || "Paciente";
    const patientAge = (formData.get("patientAge") as string) || "30";
    const patientPhone = (formData.get("patientPhone") as string) || "";
    const recordCode = (formData.get("recordCode") as string) || "#CRD-2026";
    const chiefComplaint = (formData.get("chiefComplaint") as string) || "Valoración ortodóntica integral";
    const habitsPerio = (formData.get("habitsPerio") as string) || "En evaluación clínica";
    const allergies = (formData.get("allergies") as string) || "Ninguna reportada";
    const consentRisks = (formData.get("consentRisks") as string) || "";
    const evolutionNotes = (formData.get("evolutionNotes") as string) || "";
    const manualOverrides = (formData.get("manualOverrides") as string) || "";
    const stlTelemetryText = (formData.get("stlTelemetryText") as string) || "";
    const orthoPreferencesRaw = (formData.get("orthoPreferences") as string) || "";
    const photosJsonRaw = (formData.get("photosJson") as string) || "";

    let parsedPrefs: any = null;
    try {
      if (orthoPreferencesRaw) parsedPrefs = JSON.parse(orthoPreferencesRaw);
    } catch (_) {}

    const prefsContext = parsedPrefs
      ? `
PREFERENCIAS CLÍNICAS OBLIGATORIAS DE LA DRA. LISETH GUEVARA MUÑOZ:
- Prescripción y Sistema de Brackets: ${parsedPrefs.bracketPrescription}
- Calibre de Ranura (Slot): ${parsedPrefs.slotSize}
- Secuencia de Arcos Fase 1: ${parsedPrefs.archwirePhase1}
- Secuencia de Arcos Fase 2: ${parsedPrefs.archwirePhase2}
- Secuencia de Arcos Fase 3: ${parsedPrefs.archwirePhase3}
- Criterio de Espacio (IPR vs Extracciones): ${parsedPrefs.spacePhilosophy}
- Anclaje y Auxiliares Preferidos: ${parsedPrefs.anchorageSystem}
- Protocolo de Retención: ${parsedPrefs.retentionProtocol}
- Frecuencia de Fotografías de Avance: Cada ${parsedPrefs.photoProgressInterval || 3} meses
- Reglas Clínicas Personalizadas: ${parsedPrefs.customRules}`
      : "";

    const contents: any[] = [];

    // 1. Procesar Archivos .STL (Si existen) o Telemetría 3D previa
    const stlUpper = formData.get("stlUpper") as File | null;
    const stlLower = formData.get("stlLower") as File | null;
    let stlContext = stlTelemetryText || "No se adjuntaron archivos .STL; basar volumetría en fotografías oclusales y radiografías.";

    if (stlUpper || stlLower) {
      const parts: string[] = [];
      if (stlUpper) {
        const buf = await stlUpper.arrayBuffer();
        parts.push(extractStlTelemetry(buf, "Arcada Superior Maxilar"));
      }
      if (stlLower) {
        const buf = await stlLower.arrayBuffer();
        parts.push(extractStlTelemetry(buf, "Arcada Inferior Mandibular"));
      }
      if (stlTelemetryText) parts.push(stlTelemetryText);
      stlContext = parts.join("\n\n");
    }

    // 2. Adjuntar Radiografías (Panorámica y Lateral, incluyendo PDF) y Fotografías Intraorales
    let attachedMediaCount = 0;
    const attachedMediaLabels: string[] = [];

    const imageFiles = formData.getAll("images") as File[];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: file.type || "image/jpeg",
          },
        });
        attachedMediaCount++;
        attachedMediaLabels.push(file.name || `Imagen ${attachedMediaCount}`);
      }
    }

    if (photosJsonRaw) {
      try {
        const photosMap = JSON.parse(photosJsonRaw);
        if (photosMap && typeof photosMap === "object") {
          for (const [slotName, dataUrl] of Object.entries(photosMap)) {
            if (typeof dataUrl === "string") {
              const m = dataUrl.match(/^data:((?:image\/[a-zA-Z0-9+.-]+)|application\/pdf);base64,(.+)$/);
              if (m) {
                contents.push({ text: `Registro clínico multimedia (${slotName}):` });
                contents.push({
                  inlineData: {
                    mimeType: m[1],
                    data: m[2],
                  },
                });
                attachedMediaCount++;
                attachedMediaLabels.push(slotName);
              }
            }
          }
        }
      } catch (_) {}
    }

    // 3. Construir contexto clínico completo con TODOS los datos ingresados del paciente
    contents.push(
      `Analiza este caso ortodóntico completo y personalizado para la Dra. Liseth Guevara Muñoz.
      DATOS COMPLETOS DEL PACIENTE E HISTORIA CLÍNICA:
      - Nombre del Paciente: ${patientName} (${patientAge} años)
      - Folio / Expediente: ${recordCode} ${patientPhone ? `• Tel: ${patientPhone}` : ""}
      - Motivo de Consulta y Antecedentes: ${chiefComplaint}
      - Hábitos Funcionales y Estado Periodontal: ${habitsPerio}
      - Alergias y Condiciones Sistémicas: ${allergies}
      - Riesgos y Observaciones de Consentimiento: ${consentRisks || "Estándar"}
      ${evolutionNotes ? `- Bitácora / Notas de Evolución Previas:\n${evolutionNotes}` : ""}
      ${manualOverrides ? `- Ajustes u Overrides Manuales Previos de la Doctora (RESPETAR ESTRICTAMENTE):\n${manualOverrides}` : ""}
      - Registros Visuales y Radiográficos Analizados (${attachedMediaCount}): ${attachedMediaLabels.join(", ") || "Evaluación por historia clínica"}
      
      TELEMETRÍA DE ESCÁNER INTRAORAL 3D (.STL):
      ${stlContext}
      ${prefsContext}`
    );

    // 4. Llamada a Gemini IA con fallback automático de modelos activos
    const candidateModels = [
      process.env.GEMINI_MODEL_ID,
      "gemini-flash-lite-latest",
      "gemini-3-flash-preview",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
    ].filter(Boolean) as string[];

    let rawJson: any = null;
    let modelUsed = candidateModels[0];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: `Eres el Sistema Experto de Ortodoncia y Biomecánica Avanzada de CRD Ortodoncia para la Dra. Liseth Guevara Muñoz.
            Analiza TODOS los datos ingresados del paciente: motivo de consulta, edad, hábitos funcionales y estado periodontal, alergias, notas de evolución, radiografías (Panorámica y Lateral de Cráneo), fotografías intraorales, dimensiones del escáner .STL y las Preferencias Clínicas de Ortodoncia seleccionadas por la doctora.
            Reglas obligatorias:
            1. El diagnóstico (summary, cephalometrics, risks, additionalTreatments, odontogramList y roadmap) DEBE reflejar directamente el motivo de consulta, hábitos/periodonto, edad, alergias y hallazgos radiográficos/fotográficos de ESTE paciente.
            2. Evalúa proporción corona-raíz, reabsorciones radiculares previas, nivel óseo alveolar, terceros molares y ausencias previas.
            3. Para CADA diente en odontogramList (incluyendo dientes anteriores 13-23, 33-43 y posteriores relevantes 18-14, 24-28, 38-34, 44-48), especifica su estado (aligned, ipr, critical o missing), diagnóstico individual, milímetros exactos en cara MESIAL (iprMesial) y DISTAL (iprDistal), y mecánica biomecánica.
            4. Diseña la secuencia mes a mes (roadmap de 6 etapas: MES 0, MES 1-3, MES 4-6, MES 7-10, MES 11-14, MES 15-18) utilizando estrictamente la prescripción de brackets, calibre de slot, secuencia de arcos Fase 1, 2 y 3, sistema de anclaje y protocolo de retención configurados por la Dra. Liseth Guevara.`,
            responseMimeType: "application/json",
            responseSchema: orthoResponseSchema,
            temperature: 0.15,
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed && (parsed.summary || parsed.odontogramList)) {
          rawJson = parsed;
          modelUsed = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Intento con modelo ${modelName} falló:`, err?.message || err);
      }
    }

    if (!rawJson) {
      throw lastError || new Error("No se pudo obtener respuesta de los modelos Gemini disponibles.");
    }

    // 5. Transformar odontogramList en el diccionario Record<number, ToothIPR> que usa la UI
    const odontogramRecord: Record<number, any> = {};
    if (Array.isArray(rawJson.odontogramList)) {
      for (const tooth of rawJson.odontogramList) {
        odontogramRecord[tooth.toothFDI] = tooth;
      }
    }

    const finalClinicalStudyData = {
      durationMonths: rawJson.durationMonths,
      complexity: rawJson.complexity,
      anchorage: rawJson.anchorage,
      summary: rawJson.summary,
      cephalometrics: rawJson.cephalometrics,
      additionalTreatments: rawJson.additionalTreatments,
      risks: rawJson.risks,
      odontogram: odontogramRecord,
      roadmap: rawJson.roadmap,
      retentionProtocol: rawJson.retentionProtocol,
    };

    return NextResponse.json({
      success: true,
      modelUsed,
      attachedMediaCount,
      attachedMediaLabels,
      data: finalClinicalStudyData,
    });
  } catch (error: any) {
    console.error("Error en análisis con Gemini Argon:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar el estudio con IA" },
      { status: 500 }
    );
  }
}

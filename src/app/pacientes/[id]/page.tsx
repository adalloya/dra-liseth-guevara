"use client";
import React, { useState } from "react";
import OrthoDiagnosis from "@/components/modules/OrthoDiagnosis";
import SignaturePad from "@/components/ui/SignaturePad";
import StlViewerModal from "@/components/modules/StlViewerModal";
import { ClinicalStudyData } from "@/types/ortho";

// Datos reales precargados del caso Martha Gabriela Zúñiga Núñez
const MARTHA_STUDY_DATA: ClinicalStudyData = {
  durationMonths: 18,
  complexity: "Alta (Retratamiento)",
  anchorage: "2 TADs (IZC) + ATP",
  summary: {
    skeletal: "Clase II Dolicofacial (Hiperdivergente)",
    vertical: "Mordida Abierta Anterior (-4.5 mm)",
    dentalFormula: "Ausencia previa de 14, 24, 34 y 44",
    rootAlert: "Raíces cortas (1:1.1) - Prohibido extruir",
  },
  cephalometrics: [
    {
      parameter: "Overbite (Vertical)",
      finding: "-4.5 mm (Mordida Abierta)",
      norm: "+2.0 mm",
      implication: "Intrusión molar posterior con TADs para autorrotar mandíbula.",
    },
    {
      parameter: "Discrepancia Inf. (33-43)",
      finding: "-5.5 mm (Apiñamiento severo)",
      norm: "0.0 mm",
      implication: "IPR selectivo Mesial/Distal de 33 a 43 para no proinclinar.",
    },
  ],
  additionalTreatments: [
    "Fase 0 Periodontal: Detartraje ultrasónico anteroinferior previo al cementado.",
    "Terapia Miofuncional + Espuelas linguales (bondable tongue spurs).",
    "Exodoncia de terceros molares (18, 28, 38 y 48) para eliminar efecto cuña.",
    "2 Microtornillos Infracigomáticos (IZC) + Barra Transpalatina separada 3 mm.",
  ],
  risks: [
    {
      title: "Reabsorción Radicular Apical",
      level: "Alto",
      mitigation: "Cerrar mordida por intrusión posterior con TADs, nunca con elásticos anteriores pesados.",
    },
    {
      title: "Dehiscencia Sinfisaria Inferior",
      level: "Medio-Alto",
      mitigation: "Ejecutar el stripping Mesial/Distal indicado antes de introducir arcos rectangulares.",
    },
  ],
  odontogram: {
    18: { toothFDI: 18, name: "3er Molar Sup. Der.", status: "missing", diagnosis: "Exodoncia Fase 0", iprMesial: 0, iprDistal: 0, biomechanics: "Eliminar efecto cuña posterior" },
    17: { toothFDI: 17, name: "2do Molar Sup. Der.", status: "critical", diagnosis: "Intrusión activa con TAD", iprMesial: 0, iprDistal: 0, biomechanics: "Intrusión pura de -2.0 mm (150g)" },
    16: { toothFDI: 16, name: "1er Molar Sup. Der.", status: "critical", diagnosis: "Anclaje a ATP + TAD IZC", iprMesial: 0, iprDistal: 0, biomechanics: "Intrusión de -2.0 mm con control de torque" },
    14: { toothFDI: 14, name: "1er Premolar Sup. Der.", status: "missing", diagnosis: "Ausencia previa cerrada", iprMesial: 0, iprDistal: 0, biomechanics: "Espacio 100% cerrado (13 contacta con 15)" },
    11: { toothFDI: 11, name: "Incisivo Central Sup. Der.", status: "ipr", diagnosis: "Rotación mesiolabial + diastema 0.6 mm", iprMesial: 0.1, iprDistal: 0.1, biomechanics: "Remodelado de punto de contacto y cierre" },
    21: { toothFDI: 21, name: "Incisivo Central Sup. Izq.", status: "ipr", diagnosis: "Rotación mesiolabial leve", iprMesial: 0.1, iprDistal: 0.1, biomechanics: "Nivelación de escalón incisal con 11" },
    24: { toothFDI: 24, name: "1er Premolar Sup. Izq.", status: "missing", diagnosis: "Ausencia previa cerrada", iprMesial: 0, iprDistal: 0, biomechanics: "Espacio cerrado previamente" },
    26: { toothFDI: 26, name: "1er Molar Sup. Izq.", status: "critical", diagnosis: "Anclaje a ATP + TAD IZC", iprMesial: 0, iprDistal: 0, biomechanics: "Intrusión de -2.0 mm para autorrotación" },
    27: { toothFDI: 27, name: "2do Molar Sup. Izq.", status: "critical", diagnosis: "Intrusión activa con TAD", iprMesial: 0, iprDistal: 0, biomechanics: "Intrusión pura de -2.0 mm" },
    28: { toothFDI: 28, name: "3er Molar Sup. Izq.", status: "missing", diagnosis: "Exodoncia Fase 0", iprMesial: 0, iprDistal: 0, biomechanics: "Habilitar espacio retromolar" },
    48: { toothFDI: 48, name: "3er Molar Inf. Der.", status: "missing", diagnosis: "Exodoncia Fase 0", iprMesial: 0, iprDistal: 0, biomechanics: "Eliminar contacto prematuro posterior" },
    44: { toothFDI: 44, name: "1er Premolar Inf. Der.", status: "missing", diagnosis: "Ausencia previa cerrada", iprMesial: 0, iprDistal: 0, biomechanics: "Espacio cerrado previamente" },
    43: { toothFDI: 43, name: "Canino Inferior Derecho", status: "ipr", diagnosis: "Compresión anterior", iprMesial: 0.2, iprDistal: 0.3, biomechanics: "Liberar contacto mesial para desrotar 42" },
    42: { toothFDI: 42, name: "Incisivo Lateral Inf. Der.", status: "critical", diagnosis: "Rotación mesiolingual severa (45°)", iprMesial: 0.3, iprDistal: 0.3, biomechanics: "IPR obligatorio para alinear dentro de la sínfisis" },
    41: { toothFDI: 41, name: "Incisivo Central Inf. Der.", status: "critical", diagnosis: "Extruido y lingualizado", iprMesial: 0.2, iprDistal: 0.3, biomechanics: "Nivelación e IPR para evitar recesión gingival" },
    31: { toothFDI: 31, name: "Incisivo Central Inf. Izq.", status: "critical", diagnosis: "Extruido formando escalón central", iprMesial: 0.3, iprDistal: 0.2, biomechanics: "Alineación sin proinclinación" },
    32: { toothFDI: 32, name: "Incisivo Lateral Inf. Izq.", status: "critical", diagnosis: "Rotación severa (28°)", iprMesial: 0.3, iprDistal: 0.3, biomechanics: "Desrotación con cuña elástica tras IPR" },
    33: { toothFDI: 33, name: "Canino Inferior Izquierdo", status: "ipr", diagnosis: "Apiñamiento anteroinferior", iprMesial: 0.3, iprDistal: 0.2, biomechanics: "Ganancia de espacio en arco inferior" },
    34: { toothFDI: 34, name: "1er Premolar Inf. Izq.", status: "missing", diagnosis: "Ausencia previa cerrada", iprMesial: 0, iprDistal: 0, biomechanics: "Espacio cerrado previamente" },
    38: { toothFDI: 38, name: "3er Molar Inf. Izq.", status: "missing", diagnosis: "Exodoncia Fase 0", iprMesial: 0, iprDistal: 0, biomechanics: "Exodoncia pre-ortodoncia" },
  },
  roadmap: [
    { phase: "fase1", months: "MES 0", archwire: "Pre-Ortodoncia", title: "Saneamiento y Exodoncias", chairsideAction: "Detartraje inferior y exodoncia de 18, 28, 38 y 48.", expectedMovement: "Desinflamación periodontal y cicatrización retromolar." },
    { phase: "fase1", months: "MES 1 - 3", archwire: ".014\" CuNiTi", title: "Cementado + Espuelas + IPR Inicial", chairsideAction: "Adhesión de tongue spurs. IPR inicial de 0.2-0.3 mm en 32-42.", expectedMovement: "Liberación de puntos de contacto y reeducación lingual." },
    { phase: "fase1", months: "MES 4 - 6", archwire: ".016\" x .022\" CuNiTi", title: "Desrotación Completa + Rx Control", chairsideAction: "Completar IPR Mesial/Distal en 33-43. Instalar ATP a 3 mm del paladar.", expectedMovement: "Alineación inferior sin proinclinación. Toma de Rx periapical." },
    { phase: "fase2", months: "MES 7 - 11", archwire: ".019\" x .025\" SS + TADs", title: "Intrusión Molar Activa (Cierre Vertical)", chairsideAction: "Colocar 2 TADs IZC. Cadena elástica de 150 g por lado hacia 16-17 y 26-27.", expectedMovement: "Intrusión molar de 2.0 mm y autorrotación mandibular antihoraria." },
    { phase: "fase3", months: "MES 12 - 18", archwire: ".019\"x.025\" TMA / Braided", title: "Asentamiento Oclusal y Retención", chairsideAction: "Elásticos nocturnos suaves si restan 0.5 mm. Retiro y retención fija 33-43.", expectedMovement: "Overbite positivo estable (+1.8 mm) y guía canina bilateral." },
  ],
  retentionProtocol: "Retenedor fijo lingual .0175\" de 33 a 43 + Essix superior con bloque oclusal molar y orificio recordatorio palatino.",
};

export default function PatientWorkspacePage() {
  const [activeTab, setActiveTab] = useState<"diagnostico" | "historia" | "multimedia">("diagnostico");
  const [patientSig, setPatientSig] = useState("");
  const [doctorSig, setDoctorSig] = useState("");
  const [upperStl, setUpperStl] = useState<File | null>(null);
  const [lowerStl, setLowerStl] = useState<File | null>(null);
  const [isStlViewerOpen, setIsStlViewerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900 pb-16">
      {/* Header Estilo Apple Cupertino */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                CRD Ortodoncia
              </span>
              <span className="text-xs text-slate-400">Expediente #IDI-2026-0912</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight mt-0.5">
              Martha Gabriela Zúñiga Núñez (40 años)
            </h1>
          </div>

          {/* Navegación Modular (1 solo objetivo por pantalla) */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("diagnostico")}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition ${
                activeTab === "diagnostico" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              1. Diagnóstico y Odontograma
            </button>
            <button
              onClick={() => setActiveTab("multimedia")}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition ${
                activeTab === "multimedia" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              2. Fotos, Rx y STL
            </button>
            <button
              onClick={() => setActiveTab("historia")}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition ${
                activeTab === "historia" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              3. Historia y Firmas
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            Exportar PDF
          </button>
        </div>
      </header>

      {/* Contenido Dinámico por Pestaña */}
      <main className="max-w-6xl mx-auto px-6 pt-6">
        {activeTab === "diagnostico" && <OrthoDiagnosis data={MARTHA_STUDY_DATA} />}

        {activeTab === "multimedia" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-base font-bold">Registros Fotográficos, Radiografías IDI y Escaneo .STL</h2>
                <p className="text-xs text-slate-500">
                  Sube las fotos desde cámara/archivo o carga los 2 archivos .STL (Superior e Inferior) si el caso cuenta con escaneo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">
                  + Subir STL Superior
                  <input
                    type="file"
                    accept=".stl"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUpperStl(e.target.files[0]);
                        setIsStlViewerOpen(true);
                      }
                    }}
                  />
                </label>
                <label className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">
                  + Subir STL Inferior
                  <input
                    type="file"
                    accept=".stl"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setLowerStl(e.target.files[0]);
                        setIsStlViewerOpen(true);
                      }
                    }}
                  />
                </label>
                {(upperStl || lowerStl) && (
                  <button
                    onClick={() => setIsStlViewerOpen(true)}
                    className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                  >
                    Abrir Visor 3D .STL
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Rx Panorámica (IDI)",
                "Rx Lateral de Cráneo",
                "Intraoral Frontal (Mordida Abierta)",
                "Sobremordida / Hábito Lingual",
                "Oclusal Superior",
                "Oclusal Inferior (Apiñamiento)",
                "Lateral Derecha",
                "Lateral Izquierda",
              ].map((label, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex flex-col justify-between h-44">
                  <span className="text-xs font-bold text-slate-700">{label}</span>
                  <div className="my-auto text-center">
                    <label className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">
                      Tomar foto / Subir archivo
                      <input type="file" accept="image/*" capture="environment" className="hidden" />
                    </label>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">✓ Registro vinculado al caso</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "historia" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold">Historia Clínica Ortodóntica y Consentimiento Informado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Motivo de Consulta y Antecedentes</p>
                <p className="text-slate-600">
                  Retratamiento ortodóntico. Ausencia previa de primeros premolares (14, 24, 34, 44). Mordida abierta anterior funcional con hábito activo de proyección lingual.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Consentimiento de Riesgos Explicados</p>
                <p className="text-slate-600">
                  Se explica a la paciente el acortamiento radicular previo, la necesidad obligatoria de terapia miofuncional, colocación de 2 microtornillos (TADs) y stripping anteroinferior.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <SignaturePad
                label="Firma de la Paciente"
                sublabel="Martha Gabriela Zúñiga Núñez — Acepto plan y consentimiento"
                initialSignature={patientSig}
                onSave={setPatientSig}
              />
              <SignaturePad
                label="Firma de la Ortodoncista"
                sublabel="Dra. Liseth Guevara Muñoz — Especialista en Ortodoncia"
                initialSignature={doctorSig}
                onSave={setDoctorSig}
              />
            </div>
          </div>
        )}
      </main>

      {isStlViewerOpen && (
        <StlViewerModal
          upperFile={upperStl}
          lowerFile={lowerStl}
          onClose={() => setIsStlViewerOpen(false)}
        />
      )}
    </div>
  );
}

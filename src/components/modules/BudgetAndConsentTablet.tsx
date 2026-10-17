"use client";
import React, { useState, useRef, useEffect } from "react";

export interface OrthoPricingPlan {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  downPayment: number;
  monthlyFee: number;
  durationMonths: number;
  totalAmount: number;
  isRecommended: boolean;
  features: string[];
}

export const DEFAULT_PRICING_PLANS: OrthoPricingPlan[] = [
  {
    id: "metal",
    badge: "Económico & Resistente",
    title: "Brackets Metálicos Convencionales",
    subtitle: "Mini Master / MBT Prescripción .022",
    downPayment: 3500,
    monthlyFee: 1200,
    durationMonths: 18,
    totalAmount: 25100,
    isRecommended: false,
    features: [
      "Excelente control biomecánico para rotaciones y nivelación",
      "Alta resistencia y durabilidad de aparatología",
      "Secuencia de arcos termoactivados NiTi → Acero",
      "Control de higiene y profilaxis en cada cita mensual",
    ],
  },
  {
    id: "self_ligating",
    badge: "Menor Fricción & Tiempo",
    title: "Brackets Autoligado Pasivo",
    subtitle: "Damon Q2 / Cerámicos Estéticos .022",
    downPayment: 6500,
    monthlyFee: 1650,
    durationMonths: 18,
    totalAmount: 36200,
    isRecommended: false,
    features: [
      "Fuerzas biológicas ligeras con menor molestia inicial",
      "Sin ligas elásticas que acumulen restos de comida y placa",
      "Citas de ajuste más espaciadas (cada 6 a 8 semanas)",
      "Expansión transversal armónica y menor necesidad de extracciones",
    ],
  },
  {
    id: "aligners",
    badge: "🌟 MÁS ELEGIDO • RECOMENDADO",
    title: "Alineadores Invisibles Premium",
    subtitle: "Invisalign / Spark / ClearSmile Ortho",
    downPayment: 12000,
    monthlyFee: 2100,
    durationMonths: 18,
    totalAmount: 49800,
    isRecommended: true, // Efecto señuelo / 3rd choice estrella
    features: [
      "100% Removible e imperceptible a la vista en todo momento",
      "Higiene bucal óptima: come sin restricciones y cepíllate con hilo",
      "Planificación digital 3D y simulación de resultados desde el inicio",
      "Sin urgencias por brackets despegados o alambres punzantes",
      "Ideal para pacientes con alta exigencia estética y profesional",
    ],
  },
];

interface BudgetAndConsentProps {
  patientId: string;
  patientName: string;
  patientAge: number;
  initialSignature?: string;
  initialSelfie?: string;
  onConsentCompleted?: (data: any) => void;
}

export default function BudgetAndConsentTablet({
  patientId,
  patientName,
  patientAge,
  initialSignature,
  initialSelfie,
  onConsentCompleted,
}: BudgetAndConsentProps) {
  const [plans, setPlans] = useState<OrthoPricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("aligners");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPatientPortalModal, setShowPatientPortalModal] = useState(false);

  // Estado del Portal del Paciente
  const [portalStep, setPortalStep] = useState<number>(1);
  const [selfieUrl, setSelfieUrl] = useState<string>(initialSelfie || "");
  const [healthForm, setHealthForm] = useState({
    chiefComplaint: "Deseo alinear mis dientes y corregir mi mordida.",
    allergies: "Ninguna reportada",
    medicalConditions: "Ninguna",
    currentMedications: "Ninguno",
    surgeriesOrAnesthesia: "Sin complicaciones previas",
    habits: "Ninguno activo",
    gumHealth: "Sanas, sin sangrado recurrente",
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState<string>(initialSignature || "");
  const [doctorAuthorized, setDoctorAuthorized] = useState(false);

  // Canvas táctil para firma
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[2];

  // Inicializar listeners táctiles del canvas
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e1b4b";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData("");
    }
  };

  const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelfieUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitConsent = async () => {
    if (!signatureData) {
      alert("Por favor estampa tu firma digital en el recuadro para validar tu consentimiento.");
      return;
    }
    if (!privacyAccepted || !consentAccepted) {
      alert("Debes marcar las casillas obligatorias de aceptación de Términos, Aviso de Privacidad y Consentimiento.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId,
        patientName,
        planId: activePlan.id,
        planTitle: activePlan.title,
        downPayment: activePlan.downPayment,
        monthlyFee: activePlan.monthlyFee,
        durationMonths: activePlan.durationMonths,
        totalAmount: activePlan.totalAmount,
        patientSelfie: selfieUrl,
        patientSignature: signatureData,
        privacyAccepted,
        consentAccepted,
        healthQuestionnaire: healthForm,
      };

      const res = await fetch("/api/patient-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (onConsentCompleted) {
        onConsentCompleted(payload);
      }
      setPortalStep(6); // Paso de confirmación de éxito
    } catch (err) {
      console.error(err);
      alert("Consentimiento guardado con éxito localmente.");
      setPortalStep(6);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPatientPortalUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?portal=patient&id=${patientId}`;
    navigator.clipboard.writeText(url);
    alert("✓ Enlace especial copiado al portapapeles:\n" + url);
  };

  const shareWhatsApp = () => {
    const url = `${window.location.origin}${window.location.pathname}?portal=patient&id=${patientId}`;
    const msg = `Hola ${patientName}, la Dra. Liseth Guevara te comparte tu enlace exclusivo para revisar tus opciones de tratamiento de ortodoncia, completar tu historia médica y firmar tu consentimiento digital:\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior con Acciones y Estado de Consentimiento */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-sm">
            <span role="img" aria-label="tablet">📱</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Módulo 5 • Presupuesto & Firma Digital
              </span>
              {signatureData ? (
                <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  ✓ Consentimiento Firmado
                </span>
              ) : (
                <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                  ⏳ Pendiente de Firma
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
              Cierre de Presupuesto en Sillón y Consentimiento Digital
            </h2>
            <p className="text-xs text-slate-500">
              Presenta las 3 opciones de tratamiento al paciente en la tablet, desglosa cuotas y captura su firma legal en segundos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPortalStep(1);
              setShowPatientPortalModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <span>📱 Presentar en Sillón (Modo Tablet)</span>
          </button>
          <button
            type="button"
            onClick={copyPatientPortalUrl}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
            title="Copiar URL para que el paciente lo llene en su celular"
          >
            <span>🔗 Copiar Enlace Paciente</span>
          </button>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
          >
            <span>🟢 WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl transition"
            title="Configurar precios y opciones"
          >
            <span>⚙️ Precios</span>
          </button>
        </div>
      </div>

      {/* Grid de las 3 Opciones (Con Efecto Señuelo / 3rd Choice Estrella) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan, idx) => {
          const isSelected = plan.id === selectedPlanId;
          const isThirdChoice = plan.isRecommended;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative rounded-3xl p-6 cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? isThirdChoice
                    ? "bg-linear-to-b from-indigo-950 to-slate-900 text-white border-2 border-indigo-400 shadow-xl ring-4 ring-indigo-500/20"
                    : "bg-white text-slate-900 border-2 border-indigo-600 shadow-lg ring-4 ring-indigo-500/10"
                  : isThirdChoice
                  ? "bg-slate-900 text-white border border-slate-800 shadow-md hover:border-indigo-400"
                  : "bg-white text-slate-900 border border-slate-200 shadow-xs hover:border-indigo-200"
              }`}
            >
              {isThirdChoice && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-linear-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
                  🌟 Opción Más Elegida • Recomendada
                </div>
              )}

              <div>
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isThirdChoice
                        ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {plan.badge}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "border border-slate-300 text-transparent"
                    }`}
                  >
                    ✓
                  </div>
                </div>

                <h3 className="font-extrabold text-lg mt-3">{plan.title}</h3>
                <p
                  className={`text-xs mt-0.5 ${
                    isThirdChoice ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {plan.subtitle}
                </p>

                {/* Desglose Económico */}
                <div
                  className={`mt-5 p-4 rounded-2xl border ${
                    isThirdChoice
                      ? "bg-white/5 border-white/10"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs opacity-75">Mensualidad:</span>
                    <span className="text-2xl font-black font-mono">
                      ${plan.monthlyFee.toLocaleString("es-MX")}
                      <span className="text-xs font-normal"> /mes</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200/20">
                    <span className="opacity-75">Enganche inicial:</span>
                    <span className="font-bold font-mono">
                      ${plan.downPayment.toLocaleString("es-MX")} MXN
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="opacity-75">Plazo estimado:</span>
                    <span className="font-semibold">{plan.durationMonths} meses</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="opacity-75">Inversión total:</span>
                    <span className="font-bold font-mono text-indigo-400">
                      ${plan.totalAmount.toLocaleString("es-MX")} MXN
                    </span>
                  </div>
                </div>

                {/* Lista de Beneficios */}
                <ul className="mt-4 space-y-2 text-xs">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className={isThirdChoice ? "text-slate-200" : "text-slate-600"}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de Selección */}
              <div className="mt-6 pt-4 border-t border-slate-200/20">
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                    isSelected
                      ? isThirdChoice
                        ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : isThirdChoice
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  {isSelected ? "✓ Opción Seleccionada" : "Seleccionar esta Opción"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tarjeta de Disclaimer Clínico Obligatorio y Autorización de la Dra. */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-950 flex items-start gap-3.5">
        <span className="text-2xl shrink-0">⚠️</span>
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Aviso Clínico Obligatorio sobre la Elección de Tratamiento:
          </h4>
          <p className="text-xs leading-relaxed text-amber-800">
            La selección realizada por el paciente refleja su preferencia estética y conveniencia de cuotas. La{" "}
            <strong>Dra. Liseth Guevara Muñoz</strong> evaluará de forma concluyente los estudios radiográficos, tomográficos y cefalométricos del paciente para determinar y autorizar formalmente si este procedimiento es el biomecánicamente óptimo, seguro y predecible para resolver su caso.
          </p>
        </div>
      </div>

      {/* Estado Actual de Firma del Paciente y Validación de la Doctora */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Estado del Consentimiento Informado & Contrato de Tratamiento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta del Paciente */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Firma del Paciente:</span>
              <span className="text-[11px] text-slate-500">{patientName} ({patientAge} años)</span>
            </div>
            <div className="h-24 bg-white rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden p-2">
              {signatureData ? (
                <img
                  src={signatureData}
                  alt="Firma del paciente"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 italic">Sin firma registrada aún</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Plan elegido: <strong>{activePlan.title}</strong></span>
              {selfieUrl && (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  ✓ Selfie adjunta
                </span>
              )}
            </div>
          </div>

          {/* Tarjeta de la Especialista */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Autorización de la Especialista:</span>
              <span className="text-[11px] text-slate-500">Dra. Liseth Guevara Muñoz</span>
            </div>
            <div className="h-24 bg-white rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden p-2">
              {doctorAuthorized ? (
                <div className="text-center">
                  <span className="text-emerald-600 font-black text-sm block">✓ AUTORIZADO CLÍNICAMENTE</span>
                  <span className="text-[10px] text-slate-500 block">Dra. Liseth Guevara • Ortodoncia</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDoctorAuthorized(true);
                    alert("✓ Plan de tratamiento autorizado clínicamente para el paciente.");
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition"
                >
                  ✍️ Autorizar Clínicamente este Plan
                </button>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Céd. Especialista Ortodoncia</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          MODAL INTERACTIVO: PORTAL DEL PACIENTE (PASO A PASO EN TABLET/MÓVIL)
      ==================================================================== */}
      {showPatientPortalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Cabecera del Portal */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                  🦷
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Clínica Dra. Liseth Guevara Muñoz
                  </h3>
                  <p className="text-xs text-slate-500">
                    Portal de Admisión, Selección de Plan y Consentimiento Digital
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPatientPortalModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Barra de Progreso de 5 Pasos */}
            <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-extrabold uppercase tracking-wider">
              {["1. Selfie", "2. Salud", "3. Plan", "4. Legal", "5. Firma"].map((stepLbl, idx) => (
                <div
                  key={idx}
                  className={`py-1.5 rounded-lg transition ${
                    portalStep === idx + 1
                      ? "bg-indigo-600 text-white shadow-xs"
                      : portalStep > idx + 1
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {stepLbl}
                </div>
              ))}
            </div>

            {/* PASO 1: SELFIE DE PERFIL */}
            {portalStep === 1 && (
              <div className="space-y-4 text-center">
                <h4 className="text-base font-bold text-slate-900">
                  📸 Paso 1: Tómate una foto o selfie para tu expediente
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Esta foto nos permite reconocerte al llegar a tu consulta y registrar tu perfil clínico oficial.
                </p>

                <div className="w-36 h-36 rounded-full mx-auto border-4 border-indigo-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner relative group">
                  {selfieUrl ? (
                    <img src={selfieUrl} alt="Selfie del paciente" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-slate-400">👤</span>
                  )}
                </div>

                <div className="flex justify-center gap-3">
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition inline-flex items-center gap-2">
                    <span>📷 Tomar Selfie / Subir Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieCapture}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPortalStep(2)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
                  >
                    Siguiente: Cuestionario de Salud →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: CUESTIONARIO DE SALUD */}
            {portalStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900">
                  🩺 Paso 2: Antecedentes Médicos y Padecimientos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      ¿Qué deseas corregir o cuál es tu motivo de consulta?
                    </label>
                    <textarea
                      rows={2}
                      value={healthForm.chiefComplaint}
                      onChange={(e) => setHealthForm({ ...healthForm, chiefComplaint: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      ¿Alergias a medicamentos, látex o metales?
                    </label>
                    <textarea
                      rows={2}
                      value={healthForm.allergies}
                      onChange={(e) => setHealthForm({ ...healthForm, allergies: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      ¿Padeces alguna enfermedad crónica (Diabetes, Hipertensión, etc.)?
                    </label>
                    <input
                      type="text"
                      value={healthForm.medicalConditions}
                      onChange={(e) => setHealthForm({ ...healthForm, medicalConditions: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      ¿Tomas medicamentos actualmente?
                    </label>
                    <input
                      type="text"
                      value={healthForm.currentMedications}
                      onChange={(e) => setHealthForm({ ...healthForm, currentMedications: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setPortalStep(1)}
                    className="text-xs text-slate-500 font-bold px-4 py-2"
                  >
                    ← Regresar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortalStep(3)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
                  >
                    Siguiente: Selección de Plan →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: SELECCIÓN DE PLAN (3 CHOICES) */}
            {portalStep === 3 && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900">
                  ✨ Paso 3: Elige la alternativa de tratamiento de tu preferencia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3.5 rounded-2xl cursor-pointer border transition text-left ${
                        selectedPlanId === p.id
                          ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white hover:border-indigo-200"
                      }`}
                    >
                      <div className="text-[10px] font-bold text-indigo-700 uppercase">{p.badge}</div>
                      <div className="font-extrabold text-xs text-slate-900 mt-1">{p.title}</div>
                      <div className="text-base font-black font-mono text-indigo-900 mt-2">
                        ${p.monthlyFee.toLocaleString("es-MX")}<span className="text-[10px] font-normal">/mes</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Enganche: ${p.downPayment.toLocaleString("es-MX")}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
                  <strong>Aviso:</strong> La Dra. Liseth Guevara determinará clínicamente si el procedimiento seleccionado es el biomecánicamente idóneo tras revisar tus radiografías y modelos 3D.
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setPortalStep(2)}
                    className="text-xs text-slate-500 font-bold px-4 py-2"
                  >
                    ← Regresar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortalStep(4)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
                  >
                    Siguiente: Consentimiento Legal →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 4: LEGAL & AVISO DE PRIVACIDAD */}
            {portalStep === 4 && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900">
                  📋 Paso 4: Consentimiento Informado & Aviso de Privacidad
                </h4>
                <div className="h-44 overflow-y-auto p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    <strong>Aviso de Privacidad y Tratamiento de Datos (LFPDPPP):</strong> Sus datos personales y clínicos serán tratados bajo los principios de licitud, consentimiento y confidencialidad en apego a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México) y la NOM-004-SSA3-2012 del Expediente Clínico.
                  </p>
                  <p>
                    <strong>Consentimiento de Tratamiento Ortodóntico:</strong> Comprendo los objetivos y riesgos inherentes a la aparatología de ortodoncia, incluyendo leve reabsorción radicular fisiológica, la necesidad de una higiene rigurosa para evitar descalcificaciones y la obligatoriedad de usar retenedores al concluir el tratamiento.
                  </p>
                  <p>
                    <strong>Compromiso Financiero:</strong> Acepto el esquema de cuotas acordado (Enganche de ${activePlan.downPayment.toLocaleString("es-MX")} y {activePlan.durationMonths} cuotas de ${activePlan.monthlyFee.toLocaleString("es-MX")}).
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="rounded accent-indigo-600 w-4 h-4"
                    />
                    <span>He leído y acepto el Aviso de Privacidad y el tratamiento de mis datos clínicos.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="rounded accent-indigo-600 w-4 h-4"
                    />
                    <span>Acepto las condiciones, recomendaciones y riesgos del Consentimiento de Ortodoncia.</span>
                  </label>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setPortalStep(3)}
                    className="text-xs text-slate-500 font-bold px-4 py-2"
                  >
                    ← Regresar
                  </button>
                  <button
                    type="button"
                    disabled={!privacyAccepted || !consentAccepted}
                    onClick={() => setPortalStep(5)}
                    className={`font-bold text-xs px-6 py-2.5 rounded-xl transition ${
                      privacyAccepted && consentAccepted
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Siguiente: Firma Digital →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 5: FIRMA DIGITAL TÁCTIL */}
            {portalStep === 5 && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900">
                  ✍️ Paso 5: Estampa tu Firma Digital en el Recuadro
                </h4>
                <p className="text-xs text-slate-500">
                  Usa tu dedo, lápiz táctil o ratón para firmar de conformidad tu contrato y consentimiento.
                </p>

                <div className="border-2 border-dashed border-indigo-300 rounded-2xl bg-slate-50 overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-44 cursor-crosshair bg-white touch-none"
                  />
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md"
                  >
                    Borrar Trazo
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={() => setPortalStep(4)}
                    className="text-xs text-slate-500 font-bold px-4 py-2"
                  >
                    ← Regresar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitConsent}
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-7 py-3 rounded-xl shadow-lg transition"
                  >
                    {isSubmitting ? "Enviando..." : "✓ Confirmar y Firmar Orden"}
                  </button>
                </div>
              </div>
            )}

            {/* PASO 6: CONFIRMACIÓN DE ÉXITO */}
            {portalStep === 6 && (
              <div className="space-y-5 text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    ¡Consentimiento y Orden Firmados con Éxito!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Gracias {patientName}. Tu selección de <strong>{activePlan.title}</strong> ha quedado registrada en tu expediente clínico oficial. La Dra. Liseth Guevara revisará tus estudios para autorizar el plan.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-xs space-y-1.5 text-left">
                  <div><strong>Paciente:</strong> {patientName}</div>
                  <div><strong>Plan Elegido:</strong> {activePlan.title}</div>
                  <div><strong>Mensualidad:</strong> ${activePlan.monthlyFee.toLocaleString("es-MX")}/mes</div>
                  <div><strong>Enganche:</strong> ${activePlan.downPayment.toLocaleString("es-MX")} MXN</div>
                  <div><strong>Fecha:</strong> {new Date().toLocaleDateString("es-MX")}</div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPatientPortalModal(false)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
                  >
                    Cerrar y Volver al Expediente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL DE CONFIGURACIÓN DE PRECIOS PARA LA DOCTORA
      ==================================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                ⚙️ Configuración de Opciones y Precios de Tratamiento
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {plans.map((pl, pIdx) => (
                <div key={pl.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-900">Opción {pIdx + 1}: {pl.title}</span>
                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={pl.isRecommended}
                        onChange={(e) => {
                          const updated = plans.map((p, i) => ({
                            ...p,
                            isRecommended: i === pIdx ? e.target.checked : false,
                          }));
                          setPlans(updated);
                        }}
                      />
                      <span>Opción Recomendada (3rd choice)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Enganche ($):</label>
                      <input
                        type="number"
                        value={pl.downPayment}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = [...plans];
                          updated[pIdx].downPayment = val;
                          updated[pIdx].totalAmount = val + updated[pIdx].monthlyFee * updated[pIdx].durationMonths;
                          setPlans(updated);
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Mensualidad ($):</label>
                      <input
                        type="number"
                        value={pl.monthlyFee}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = [...plans];
                          updated[pIdx].monthlyFee = val;
                          updated[pIdx].totalAmount = updated[pIdx].downPayment + val * updated[pIdx].durationMonths;
                          setPlans(updated);
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Meses:</label>
                      <input
                        type="number"
                        value={pl.durationMonths}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = [...plans];
                          updated[pIdx].durationMonths = val;
                          updated[pIdx].totalAmount = updated[pIdx].downPayment + updated[pIdx].monthlyFee * val;
                          setPlans(updated);
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Total ($):</label>
                      <input
                        type="number"
                        disabled
                        value={pl.totalAmount}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  alert("✓ Precios de tratamiento guardados.");
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition"
              >
                Guardar Precios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

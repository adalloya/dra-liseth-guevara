"use client";
import React, { useState } from "react";
import { ClinicalStudyData, ToothIPR } from "@/types/ortho";

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

export default function OrthoDiagnosis({ data }: { data: ClinicalStudyData }) {
  const [selectedFDI, setSelectedFDI] = useState<number>(42);
  const [phaseFilter, setPhaseFilter] = useState<string>("all");

  const activeTooth: ToothIPR = data.odontogram[selectedFDI] || {
    toothFDI: selectedFDI,
    name: `Órgano Dentario ${selectedFDI}`,
    status: "aligned",
    diagnosis: "Alineación y nivelación estándar",
    iprMesial: 0,
    iprDistal: 0,
    biomechanics: "Control pasivo de arco",
  };

  const getBadgeStyle = (status: ToothIPR["status"], isSelected: boolean) => {
    const ring = isSelected ? "ring-2 ring-indigo-600 scale-105 shadow-md" : "";
    switch (status) {
      case "critical":
        return `bg-rose-50 border-rose-300 text-rose-800 ${ring}`;
      case "ipr":
        return `bg-amber-50 border-amber-300 text-amber-800 ${ring}`;
      case "missing":
        return `bg-slate-100 border-slate-300 text-slate-400 opacity-60 ${ring}`;
      default:
        return `bg-emerald-50 border-emerald-300 text-emerald-800 ${ring}`;
    }
  };

  const renderQuadrant = (teeth: number[]) => (
    <div className="grid grid-cols-8 gap-1.5">
      {teeth.map((fdi) => {
        const t = data.odontogram[fdi];
        const status = t?.status || "aligned";
        const totalIPR = Number(((t?.iprMesial || 0) + (t?.iprDistal || 0)).toFixed(1));
        return (
          <button
            key={fdi}
            type="button"
            onClick={() => setSelectedFDI(fdi)}
            className={`border rounded-xl p-1.5 text-center transition-all ${getBadgeStyle(
              status,
              selectedFDI === fdi
            )}`}
          >
            <span className="block text-[10px] font-bold">{fdi}</span>
            <div className="w-6 h-6 mx-auto my-1 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
              {status === "missing" ? "✕" : totalIPR > 0 ? `.${Math.round(totalIPR * 10)}` : "✓"}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. Tarjetas de Resumen Diagnóstico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Patrón Esquelético</span>
          <p className="text-sm font-bold text-slate-900 mt-1">{data.summary.skeletal}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Problema Vertical</span>
          <p className="text-sm font-bold text-rose-600 mt-1">{data.summary.vertical}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Fórmula Dental</span>
          <p className="text-sm font-bold text-slate-900 mt-1">{data.summary.dentalFormula}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Alerta Radicular</span>
          <p className="text-sm font-bold text-amber-600 mt-1">{data.summary.rootAlert}</p>
        </div>
      </div>

      {/* 2. Odontograma Anatómico 2D por Cuadrantes con IPR Mesial/Distal */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Odontograma Biomecánico y Prescripción de Stripping (IPR)
            </h3>
            <p className="text-xs text-slate-500">
              Toca cualquier órgano dentario para consultar su desgaste Mesial y Distal exacto
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Alineado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Requiere IPR
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Crítico / TAD
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Ausente
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-5">
          <div className="text-center text-xs font-bold text-indigo-950 bg-indigo-50 py-1 rounded-lg uppercase">
            Maxilar Superior (Arcada Superior)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Cuadrante 1 (Derecha)</p>
              {renderQuadrant(UPPER_RIGHT)}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-1.5 text-right">Cuadrante 2 (Izquierda)</p>
              {renderQuadrant(UPPER_LEFT)}
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Cuadrante 4 (Derecha)</p>
              {renderQuadrant(LOWER_RIGHT)}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-1.5 text-right">Cuadrante 3 (Izquierda)</p>
              {renderQuadrant(LOWER_LEFT)}
            </div>
          </div>
          <div className="text-center text-xs font-bold text-indigo-950 bg-indigo-50 py-1 rounded-lg uppercase">
            Mandíbula (Arcada Inferior)
          </div>
        </div>

        {/* Panel de Detalle Mesial / Distal del Diente Seleccionado */}
        <div className="mt-5 bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                OD {activeTooth.toothFDI}
              </span>
              <h4 className="font-bold text-slate-900 text-sm">{activeTooth.name}</h4>
            </div>
            <p className="text-xs text-slate-700 mt-1.5">
              <strong>Diagnóstico:</strong> {activeTooth.diagnosis}
            </p>
            <p className="text-xs text-indigo-950 mt-1">
              <strong>Mecánica de Valor:</strong> {activeTooth.biomechanics}
            </p>
          </div>

          {/* Cajas de énfasis Mesial vs Distal */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:w-36 bg-white p-3 rounded-xl border border-amber-200 text-center shadow-sm">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Stripping MESIAL</span>
              <span className="text-lg font-extrabold text-amber-600">{activeTooth.iprMesial.toFixed(1)} mm</span>
            </div>
            <div className="flex-1 lg:w-36 bg-white p-3 rounded-xl border border-amber-200 text-center shadow-sm">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Stripping DISTAL</span>
              <span className="text-lg font-extrabold text-amber-600">{activeTooth.iprDistal.toFixed(1)} mm</span>
            </div>
            <div className="flex-1 lg:w-36 bg-slate-900 text-white p-3 rounded-xl text-center shadow-sm">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Diente</span>
              <span className="text-lg font-extrabold text-emerald-400">
                {(activeTooth.iprMesial + activeTooth.iprDistal).toFixed(1)} mm
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cronograma Mes a Mes */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Secuencia Biomecánica Mes a Mes ({data.durationMonths} Meses)
            </h3>
            <p className="text-xs text-slate-500">Hoja de ruta clínica para el expediente</p>
          </div>
          <div className="flex gap-1.5 print:hidden">
            {["all", "fase1", "fase2", "fase3"].map((f) => (
              <button
                key={f}
                onClick={() => setPhaseFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  phaseFilter === f
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Todas" : f === "fase1" ? "Alineación" : f === "fase2" ? "Intrusión TADs" : "Finalización"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.roadmap
            .filter((s) => phaseFilter === "all" || s.phase === phaseFilter)
            .map((stage, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                      {stage.months}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{stage.archwire}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1.5">{stage.title}</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    <strong>Sillón:</strong> {stage.chairsideAction}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-800">
                  <strong>Movimiento:</strong> {stage.expectedMovement}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

"use client";
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface EvolutionRecord {
  month: number;
  date: string;
  stageTitle: string;
  archwire: string;
  overbiteMm: number;
  photoFrontalUrl: string;
  photoOverjetUrl: string;
  notes: string;
}

interface EvolutionComparatorProps {
  patientName: string;
  records: EvolutionRecord[];
}

export default function EvolutionComparator({ patientName, records }: EvolutionComparatorProps) {
  const [viewMode, setViewMode] = useState<"photos" | "mesh3d">("photos");
  const [angleType, setAngleType] = useState<"frontal" | "overjet">("frontal");
  const [baseMonthIdx, setBaseMonthIdx] = useState<number>(0); // Siempre Mes 0 por defecto
  const [compareMonthIdx, setCompareMonthIdx] = useState<number>(Math.max(0, records.length - 1));
  const [sliderPos, setSliderPos] = useState<number>(50); // Porcentaje 0 - 100%
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.45);

  const canvas3dRef = useRef<HTMLDivElement | null>(null);

  const beforeRecord = records[baseMonthIdx] || records[0] || {
    month: 0,
    date: "Inicial",
    stageTitle: "Inicio",
    archwire: "Pre-Ortodoncia",
    overbiteMm: -4.5,
    photoFrontalUrl: "",
    photoOverjetUrl: "",
    notes: ""
  };
  const afterRecord = records[compareMonthIdx] || records[records.length - 1] || beforeRecord;

  const beforeImg = angleType === "frontal" ? beforeRecord.photoFrontalUrl : beforeRecord.photoOverjetUrl;
  const afterImg = angleType === "frontal" ? afterRecord.photoFrontalUrl : afterRecord.photoOverjetUrl;

  const overbiteDelta = (afterRecord.overbiteMm - beforeRecord.overbiteMm).toFixed(1);

  // Motor de Superposición 3D (Mes Base en Fantasma Ámbar vs Mes Comparado en Marfil)
  useEffect(() => {
    if (viewMode !== "mesh3d" || !canvas3dRef.current) return;
    const container = canvas3dRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#121214");

    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, -85, 45);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(30, -50, 70);
    scene.add(keyLight);

    // Materiales: Fantasma (Mes Base) vs Actual (Mes Comparado)
    const ghostMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f59e0b"), // Ámbar clínico para estado inicial
      transparent: true,
      opacity: ghostOpacity,
      roughness: 0.3,
    });

    const currentMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f6f2e6"), // Esmalte marfil para progreso actual
      roughness: 0.22,
      clearcoat: 0.85,
    });

    // Construcción de Arcada Comparativa Superpuesta (Simulación de cierre vertical e IPR)
    const buildArchGroup = (month: number, material: THREE.Material) => {
      const group = new THREE.Group();
      const progress = Math.min(1, month / 18);
      const openBiteGap = 4.5 * (1 - progress); // De 4.5mm abierto a 0mm (cerrado)

      for (let i = -6; i <= 6; i++) {
        const angle = (i / 6) * (Math.PI * 0.42);
        const x = Math.sin(angle) * 24;
        const y = -Math.cos(angle) * 26;

        const crownGeo = new THREE.BoxGeometry(3.1, 2.6, 4.2);
        // Diente Superior
        const upperTooth = new THREE.Mesh(crownGeo, material);
        const anteriorFactor = Math.max(0, 1 - Math.abs(i) / 4);
        upperTooth.position.set(x, y, 3.2 + anteriorFactor * openBiteGap * 0.5);
        group.add(upperTooth);

        // Diente Inferior (Con apiñamiento en Mes 0 que se alinea hacia el Mes 18)
        const lowerTooth = new THREE.Mesh(crownGeo, material);
        const crowdingOffset = Math.abs(i) <= 2 ? (i % 2 === 0 ? 1.8 : -1.8) * (1 - progress) : 0;
        lowerTooth.position.set(x, y + crowdingOffset, -3.2 - anteriorFactor * openBiteGap * 0.5);
        lowerTooth.rotation.z = Math.abs(i) === 1 ? 0.55 * (1 - progress) : 0;
        group.add(lowerTooth);
      }
      return group;
    };

    const ghostArch = buildArchGroup(beforeRecord.month, ghostMat);
    const currentArch = buildArchGroup(afterRecord.month, currentMat);
    scene.add(ghostArch);
    scene.add(currentArch);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, [viewMode, beforeRecord, afterRecord, ghostOpacity]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header del Comparador Temporal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
            Motivación y Adherencia del Paciente
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Comparador Temporal de Evolución (Before / After) • {patientName}
          </h2>
          <p className="text-xs text-slate-500">
            Desliza la cortina o superpón la malla 3D para demostrar el avance milimétrico mes a mes.
          </p>
        </div>

        {/* Selector de Modo: Fotos Intraorales vs Superposición Malla 3D */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("photos")}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
              viewMode === "photos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            📸 Cortina Fotográfica (Before / After)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mesh3d")}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
              viewMode === "mesh3d" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600"
            }`}
          >
            🧊 Superposición 3D (.STL Ghost)
          </button>
        </div>
      </div>

      {/* Controles de Selección de Mes Base (Antes) vs Mes de Evolución (Después) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Estado Inicial / Base (ANTES)
          </label>
          <select
            value={baseMonthIdx}
            onChange={(e) => setBaseMonthIdx(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
          >
            {records.map((rec, idx) => (
              <option key={rec.month} value={idx}>
                Mes {rec.month} ({rec.date}) — {rec.stageTitle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1">
            Cita de Evolución Comparada (DESPUÉS)
          </label>
          <select
            value={compareMonthIdx}
            onChange={(e) => setCompareMonthIdx(Number(e.target.value))}
            className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950"
          >
            {records.map((rec, idx) => (
              <option key={rec.month} value={idx}>
                Mes {rec.month} ({rec.date}) — {rec.stageTitle}
              </option>
            ))}
          </select>
        </div>

        {/* KPI de Avance Clínico Real para motivar al paciente */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-emerald-700 uppercase">
              Mejora Vertical (Overbite)
            </span>
            <span className="text-lg font-extrabold text-emerald-900">
              +{overbiteDelta} mm cerrados
            </span>
          </div>
          <div className="text-right text-[11px] text-emerald-800">
            <div>Antes: <strong>{beforeRecord.overbiteMm} mm</strong></div>
            <div>Ahora: <strong>{afterRecord.overbiteMm} mm</strong></div>
          </div>
        </div>
      </div>

      {/* MODO 1: CORTINA FOTOGRÁFICA INTERACTIVA BEFORE / AFTER */}
      {viewMode === "photos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAngleType("frontal")}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${
                  angleType === "frontal" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                Toma 1: Frontal en Oclusión
              </button>
              <button
                type="button"
                onClick={() => setAngleType("overjet")}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${
                  angleType === "overjet" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                Toma 2: Lateral / Sobremordida
              </button>
            </div>
            <span className="text-xs text-slate-500">
              Arrastra el control deslizante para comparar el avance
            </span>
          </div>

          {/* Contenedor Split-Screen con Clip-Path Dinámico */}
          <div className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 select-none">
            {/* Imagen DESPUÉS (Fondo completo) */}
            <img
              src={afterImg}
              alt="Después"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              DESPUÉS • Mes {afterRecord.month} ({afterRecord.archwire})
            </span>

            {/* Imagen ANTES (Recortada dinámicamente por sliderPos) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={beforeImg}
                alt="Antes"
                className="absolute inset-0 w-full h-full object-cover filter brightness-95"
              />
              <span className="absolute top-4 left-4 bg-amber-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                ANTES • Mes {beforeRecord.month} ({beforeRecord.date})
              </span>
            </div>

            {/* Línea Divisoria Vertical de la Cortina */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-9 h-9 rounded-full bg-white text-slate-900 shadow-lg border-2 border-indigo-600 flex items-center justify-center font-bold text-xs absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                ↔
              </div>
            </div>

            {/* Input Range Invisible sobre toda la imagen para soporte táctil perfecto en iPad/Mobile */}
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />
          </div>
        </div>
      )}

      {/* MODO 2: SUPERPOSICIÓN DE MALLAS 3D (GHOST SUPERIMPOSITION) */}
      {viewMode === "mesh3d" && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-3 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                Malla Fantasma: Mes {beforeRecord.month} (Antes)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#f6f2e6] inline-block" />
                Malla Sólida: Mes {afterRecord.month} (Actual)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>Opacidad Fantasma:</span>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={ghostOpacity}
                onChange={(e) => setGhostOpacity(Number(e.target.value))}
                className="w-28 accent-amber-500"
              />
            </div>
          </div>

          <div
            ref={canvas3dRef}
            className="w-full h-[400px] rounded-2xl overflow-hidden border border-slate-300 bg-[#121214]"
          />
        </div>
      )}
    </div>
  );
}

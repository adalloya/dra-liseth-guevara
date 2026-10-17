"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { supabase } from "@/lib/supabase";

interface StlClinicalViewerProps {
  patientId: string;
  initialUpperUrl?: string;
  initialLowerUrl?: string;
  onClose: () => void;
}

export default function StlClinicalViewer({
  patientId,
  initialUpperUrl,
  initialLowerUrl,
  onClose,
}: StlClinicalViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [archFilter, setArchFilter] = useState<"both" | "upper" | "lower">("both");
  const [currentMonth, setCurrentMonth] = useState<number>(0);
  const [showIpr, setShowIpr] = useState<boolean>(true);
  const [showTads, setShowTads] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const upperGroupRef = useRef<THREE.Group | null>(null);
  const lowerGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#121214"); // Fondo ClinCheck Pro Dark

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, -100, 70);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Iluminación de Estudio Clínico Avanzada
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(50, 100, 100);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0x90b0ff, 0.5);
    dirLight2.position.set(-50, -100, -50);
    scene.add(dirLight2);

    // Grupos contenedores para alinear superior e inferior sin romper su oclusión natural
    const upperGroup = new THREE.Group();
    const lowerGroup = new THREE.Group();
    scene.add(upperGroup);
    scene.add(lowerGroup);
    upperGroupRef.current = upperGroup;
    lowerGroupRef.current = lowerGroup;

    const loader = new STLLoader();
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f6f2e6"), // Tono marfil esmalte natural
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });

    const loadAndPositionStl = (
      urlOrFile: string | File,
      targetGroup: THREE.Group,
      isUpper: boolean
    ) => {
      const processBuffer = (buffer: ArrayBuffer) => {
        const geometry = loader.parse(buffer);
        // NOTA: No aplicamos .center() individual para preservar la mordida oclusal con la que viene el escaneo
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, material);
        targetGroup.add(mesh);

        // Auto-centrar el conjunto completo basado en el maxilar superior
        if (isUpper && upperGroup.children.length === 1) {
          const box = new THREE.Box3().setFromObject(upperGroup);
          const center = box.getCenter(new THREE.Vector3());
          upperGroup.position.sub(center);
          lowerGroup.position.sub(center);
        }
      };

      if (urlOrFile instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) processBuffer(e.target.result as ArrayBuffer);
        };
        reader.readAsArrayBuffer(urlOrFile);
      } else if (typeof urlOrFile === "string" && urlOrFile.length > 0) {
        fetch(urlOrFile)
          .then((res) => res.arrayBuffer())
          .then((buf) => processBuffer(buf))
          .catch((err) => console.error("Error cargando STL desde URL:", err));
      }
    };

    if (initialUpperUrl) loadAndPositionStl(initialUpperUrl, upperGroup, true);
    if (initialLowerUrl) loadAndPositionStl(initialLowerUrl, lowerGroup, false);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [initialUpperUrl, initialLowerUrl]);

  // Visibilidad de arcadas según filtro
  useEffect(() => {
    if (upperGroupRef.current) {
      upperGroupRef.current.visible = archFilter === "both" || archFilter === "upper";
    }
    if (lowerGroupRef.current) {
      lowerGroupRef.current.visible = archFilter === "both" || archFilter === "lower";
    }
  }, [archFilter]);

  // Simulación Biomecánica por Meses (Desplaza la mandíbula gradualmente según la progresión del tratamiento)
  useEffect(() => {
    if (!lowerGroupRef.current) return;
    // Progreso biomecánico: conforme avanza el mes, la mandíbula se desplaza en Z/Y para corregir la mordida abierta
    const progressFactor = currentMonth / 18;
    lowerGroupRef.current.position.z = progressFactor * 1.5;
    lowerGroupRef.current.rotation.x = progressFactor * 0.03;
  }, [currentMonth]);

  // Manejo de carga de archivos nuevos y persistencia en Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isUpper: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${patientId}_${isUpper ? "upper" : "lower"}_${Date.now()}.${fileExt}`;
      const filePath = `stl-scans/${fileName}`;

      // 1. Subir al Storage de Supabase (Bucket: 'ortho-media')
      const { error: uploadError } = await supabase.storage
        .from("ortho-media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from("ortho-media")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // 3. Guardar la referencia en la tabla 'ortho_studies' en Supabase
      const updatePayload = isUpper ? { stl_upper_url: fileUrl } : { stl_lower_url: fileUrl };

      await supabase
        .from("ortho_studies")
        .update(updatePayload)
        .eq("patient_id", patientId);

      alert(`Escaneo ${isUpper ? "Superior" : "Inferior"} guardado correctamente en el expediente.`);
      window.location.reload();
    } catch (err: any) {
      alert("Error al guardar el archivo STL: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const setViewAngle = (x: number, y: number, z: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(x, y, z);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div className="fixed inset-0 bg-[#121214] z-50 flex flex-col text-white font-sans">
      {/* Barra Superior ClinCheck Pro Dark Studio */}
      <header className="flex flex-wrap justify-between items-center px-6 py-3 border-b border-zinc-800 bg-zinc-900/95 gap-3">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs font-bold tracking-wide text-zinc-200">
            Visor 3D Clínico • Base de Escáner Intraoral
          </h2>
        </div>

        {/* Controles de Vista y Arcada */}
        <div className="flex items-center gap-1.5 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700">
          <button
            onClick={() => setArchFilter("both")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              archFilter === "both" ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            ═ Ambas
          </button>
          <button
            onClick={() => {
              setArchFilter("upper");
              setViewAngle(0, -110, 20);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              archFilter === "upper" ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            ∩ Sup
          </button>
          <button
            onClick={() => {
              setArchFilter("lower");
              setViewAngle(0, 110, 20);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              archFilter === "lower" ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            ∪ Inf
          </button>
          <span className="w-px h-4 bg-zinc-700 mx-1" />
          <button onClick={() => setViewAngle(0, -100, 70)} className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white">
            Frontal
          </button>
          <button onClick={() => setViewAngle(110, 0, 10)} className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white">
            Der
          </button>
          <button onClick={() => setViewAngle(-110, 0, 10)} className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white">
            Izq
          </button>
        </div>

        {/* Botones de Carga Persistente y Cierre */}
        <div className="flex items-center gap-2">
          <label className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium px-3.5 py-1.5 rounded-xl cursor-pointer transition">
            {isUploading ? "Subiendo..." : "+ Cargar .STL Sup"}
            <input type="file" accept=".stl" onChange={(e) => handleFileUpload(e, true)} className="hidden" />
          </label>
          <label className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium px-3.5 py-1.5 rounded-xl cursor-pointer transition">
            {isUploading ? "Subiendo..." : "+ Cargar .STL Inf"}
            <input type="file" accept=".stl" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
          </label>
          <button
            onClick={onClose}
            className="bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-xs px-3.5 py-1.5 rounded-xl transition font-semibold"
          >
            ✕ Cerrar Visor
          </button>
        </div>
      </header>

      {/* Lienzo WebGL 3D Principal */}
      <div ref={mountRef} className="flex-1 w-full relative cursor-grab active:cursor-grabbing" />

      {/* Barra Inferior de Herramientas ClinCheck & Línea de Tiempo (0 a 18 Meses) */}
      <footer className="bg-zinc-900/95 border-t border-zinc-800 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Toggles de Herramientas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIpr(!showIpr)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition ${
              showIpr ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-zinc-800 border-zinc-700 text-zinc-400"
            }`}
          >
            💎 IPR ({showIpr ? "Activo" : "Oculto"})
          </button>
          <button
            onClick={() => setShowTads(!showTads)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition ${
              showTads ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-zinc-800 border-zinc-700 text-zinc-400"
            }`}
          >
            📌 TADs + ATP ({showTads ? "Activo" : "Oculto"})
          </button>
        </div>

        {/* Simulador de Tiempo Mes a Mes (0 a 18 Meses) */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md mx-4">
          <span className="text-xs font-bold text-indigo-400 whitespace-nowrap">
            Mes {currentMonth} / 18
          </span>
          <input
            type="range"
            min="0"
            max="18"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
          />
          <span className="text-[11px] text-zinc-400 whitespace-nowrap">
            {currentMonth === 0 ? "Maloclusión Inicial" : currentMonth === 18 ? "Finalización" : "Progresión"}
          </span>
        </div>

        <div className="text-xs text-zinc-400">
          Rotación 360° • Zoom Táctil y Rueda
        </div>
      </footer>
    </div>
  );
}

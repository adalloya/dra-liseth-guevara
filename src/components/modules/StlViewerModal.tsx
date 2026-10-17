"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

interface StlViewerModalProps {
  upperFile: File | null;
  lowerFile: File | null;
  onClose: () => void;
}

export default function StlViewerModal({ upperFile, lowerFile, onClose }: StlViewerModalProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [archFilter, setArchFilter] = useState<"both" | "upper" | "lower">("both");
  const upperMeshRef = useRef<THREE.Mesh | null>(null);
  const lowerMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#18181b");

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 110);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Iluminación Clínica de Estudio
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const keyLight = new THREE.DirectionalLight(0xfffdf8, 1.3);
    keyLight.position.set(30, 50, 80);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.6);
    fillLight.position.set(-40, -30, 50);
    scene.add(fillLight);

    const loader = new STLLoader();
    const toothMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f5f1e6"),
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
    });

    const loadStlFile = (file: File, isUpper: boolean) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!ev.target?.result) return;
        const geometry = loader.parse(ev.target.result as ArrayBuffer);
        geometry.computeVertexNormals();
        geometry.center();

        const mesh = new THREE.Mesh(geometry, toothMaterial);
        mesh.position.y = isUpper ? 6 : -6;
        scene.add(mesh);

        if (isUpper) upperMeshRef.current = mesh;
        else lowerMeshRef.current = mesh;
      };
      reader.readAsArrayBuffer(file);
    };

    if (upperFile) loadStlFile(upperFile, true);
    if (lowerFile) loadStlFile(lowerFile, false);

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
  }, [upperFile, lowerFile]);

  // Filtro de Arcada Superior / Inferior
  useEffect(() => {
    if (upperMeshRef.current) {
      upperMeshRef.current.visible = archFilter === "both" || archFilter === "upper";
    }
    if (lowerMeshRef.current) {
      lowerMeshRef.current.visible = archFilter === "both" || archFilter === "lower";
    }
  }, [archFilter]);

  const setView = (x: number, y: number, z: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(x, y, z);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div className="fixed inset-0 bg-[#18181b] z-50 flex flex-col text-white">
      {/* Barra Minimalista Superior (Estilo ClinCheck Dark Studio) */}
      <div className="flex justify-between items-center px-6 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
        <span className="text-xs font-semibold text-zinc-300">
          Visor Escaneo Intraoral Dual .STL (Maxilar y Mandíbula)
        </span>

        {/* Iconos Ortodónticos de Vista */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setArchFilter("both")}
            title="Oclusión Completa"
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              archFilter === "both" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            ═ Ambas
          </button>
          <button
            onClick={() => {
              setArchFilter("upper");
              setView(0, -90, 20);
            }}
            title="Arcada Superior"
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              archFilter === "upper" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            ∩ Sup
          </button>
          <button
            onClick={() => {
              setArchFilter("lower");
              setView(0, 90, 20);
            }}
            title="Arcada Inferior"
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              archFilter === "lower" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            ∪ Inf
          </button>
          <button
            onClick={() => setView(0, 0, 110)}
            className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:bg-zinc-800"
          >
            Frontal
          </button>
          <button
            onClick={() => setView(110, 0, 10)}
            className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:bg-zinc-800"
          >
            Der
          </button>
          <button
            onClick={() => setView(-110, 0, 10)}
            className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:bg-zinc-800"
          >
            Izq
          </button>
        </div>

        <button
          onClick={onClose}
          className="border border-zinc-700 hover:bg-zinc-800 text-xs px-3 py-1.5 rounded-lg"
        >
          ✕ Cerrar Visor
        </button>
      </div>

      {/* Lienzo 3D */}
      <div ref={mountRef} className="flex-1 w-full relative" />
    </div>
  );
}

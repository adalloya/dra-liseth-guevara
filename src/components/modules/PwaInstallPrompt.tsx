"use client";
import React, { useState, useEffect } from "react";

interface PwaInstallPromptProps {
  appName?: string;
  appLogo?: string;
}

export default function PwaInstallPrompt({
  appName = "CRD OrthoAI Hub",
  appLogo = "/ortho-hub-logo.png",
}: PwaInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detectar si ya se está ejecutando como PWA standalone
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsStandalone(standalone);

    // 2. Detectar si es dispositivo iOS (iPhone / iPad / iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleMobile);

    // 3. Registrar Service Worker si está disponible
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("✓ Service Worker PWA activo:", reg.scope))
        .catch((err) => console.warn("Service Worker registro:", err));
    }

    // 4. Si es iOS y no está instalada, mostrar el botón
    if (isAppleMobile && !standalone) {
      setCanInstall(true);
    }

    // 5. Escuchar evento beforeinstallprompt para Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!standalone) {
        setCanInstall(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Disparo automático en Android / Chrome
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          setCanInstall(false);
        }
        setDeferredPrompt(null);
      });
    } else if (isIos) {
      // Mostrar tarjeta visual explicativa para iOS Safari
      setShowIosModal(true);
    } else {
      setShowIosModal(true);
    }
  };

  // Si ya está instalada o no cumple criterios, no renderizar el botón
  if (isStandalone || !canInstall) {
    return null;
  }

  return (
    <>
      {/* Botón de Instalación PWA (Apple Cupertino Style) */}
      <button
        type="button"
        onClick={handleInstallClick}
        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
        title="Instalar app en tu pantalla de inicio"
      >
        <span role="img" aria-label="download">📲</span>
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {/* Modal / Bottom Sheet para iOS Safari */}
      {showIosModal && (
        <div
          onClick={() => setShowIosModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <img
                  src={appLogo}
                  alt={appName}
                  className="w-12 h-12 rounded-2xl object-contain shadow-xs shrink-0"
                />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    PWA Nativa • Pantalla Completa
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                    Instalar en tu iPhone o iPad
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apple requiere 2 toques manuales en Safari para crear el acceso directo en tu pantalla de inicio y ocultar la barra del navegador:
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  1
                </span>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (icono cuadrado con flecha hacia arriba ⎋).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  2
                </span>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Desliza hacia abajo en el menú y selecciona <strong>"Agregar a pantalla de inicio"</strong> (icono ➕).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  3
                </span>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Toca <strong>"Agregar"</strong> en la esquina superior derecha. ¡La aplicación se abrirá a pantalla completa como una app nativa!
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

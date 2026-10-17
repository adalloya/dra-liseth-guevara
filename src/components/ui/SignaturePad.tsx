"use client";
import React, { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
  label: string;
  sublabel: string;
  initialSignature?: string;
  onSave: (dataUrl: string) => void;
}

export default function SignaturePad({ label, sublabel, initialSignature, onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedImg, setSavedImg] = useState<string | undefined>(initialSignature);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      setSavedImg(dataUrl);
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setSavedImg(undefined);
    onSave("");
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{sublabel}</p>
        </div>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-rose-600 hover:underline font-medium print:hidden"
        >
          Limpiar firma
        </button>
      </div>

      <div className="bg-white border border-dashed border-slate-300 rounded-xl overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={420}
          height={130}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[130px] cursor-crosshair"
        />
      </div>
      {savedImg && (
        <p className="text-[11px] text-emerald-600 font-medium mt-1.5">
          ✓ Firma digital registrada en el expediente
        </p>
      )}
    </div>
  );
}

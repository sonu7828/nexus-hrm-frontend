import React, { useRef, useEffect, useState } from 'react';
import { PenTool, RotateCcw, Check } from 'lucide-react';

const SignaturePad = ({ value, onChange, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize and resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a';

      // If existing signature value passed
      if (value) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasDrawn(true);
        };
        img.src = value;
      }
    };

    // Run on next tick to ensure modal CSS transition is done
    const timer = setTimeout(initCanvas, 60);
    window.addEventListener('resize', initCanvas);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initCanvas);
    };
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    // Only allow primary left click (button 0) or touch
    if (e.button !== undefined && e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      if (onChange) onChange(dataUrl);
    }
  };

  const handleClear = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    setHasDrawn(false);
    if (onClear) onClear();
    if (onChange) onChange(null);
  };

  return (
    <div className="space-y-2">
      <div 
        className="relative border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-2xl bg-white overflow-hidden shadow-inner cursor-crosshair group transition-colors select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
          className="w-full h-40 block"
        />

        {!hasDrawn && !value && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 gap-1.5 bg-transparent">
            <PenTool size={22} className="text-slate-300 opacity-60" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Click &amp; Drag with Left Mouse or Touch to Sign
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-rose-600 bg-rose-50/60 hover:bg-rose-100/80 border-rose-200 shadow-2xs"
        >
          <RotateCcw size={12} />
          <span>Clear Signature</span>
        </button>
        {hasDrawn && (
          <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Check size={12} strokeWidth={3} />
            <span>Signature Recorded</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;

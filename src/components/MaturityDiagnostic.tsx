import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ChevronRight, 
  BarChart3, 
  Target, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Download,
  Share2,
  Trophy,
  AlertCircle,
  FileText,
  Search,
  BookOpen,
  RefreshCw,
  Cpu,
  Activity,
  Database,
  Brain
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Data ---

const avatars = [
  { name: 'Analista', icon: User },
  { name: 'Ingeniero', icon: Zap },
  { name: 'Líder', icon: Trophy },
  { name: 'Auditor', icon: ShieldCheck },
  { name: 'Innovador', icon: BarChart3 },
];

const dimensions = [
  { id: 0, short: 'Planeación', title: 'Planeación Estratégica', question: '¿Los procesos de tu organización están alineados y priorizados según los objetivos estratégicos, o el área de procesos trabaja desconectada de la estrategia?' },
  { id: 1, short: 'Políticas', title: 'Políticas', question: '¿Existe una política formal de gestión por procesos aprobada por la alta dirección, o cada quien documenta como quiere?' },
  { id: 2, short: 'Comité', title: 'Comité de Procesos', question: '¿Tienen un comité activo con reuniones periódicas que toma decisiones sobre procesos, o las iniciativas de mejora dependen de una sola persona?' },
  { id: 3, short: 'Metodologías', title: 'Metodologías', question: '¿Utilizan metodologías estandarizadas (BPMN, Lean, Six Sigma) para gestionar procesos, o cada área usa su propio método improvisado?' },
  { id: 4, short: 'Herramientas', title: 'Herramientas', question: '¿Cuentan con herramientas tecnológicas especializadas para modelar y documentar procesos, o todavía usan Visio, Word o PowerPoint?' },
  { id: 5, short: 'Indicadores', title: 'Indicadores (KPIs)', question: '¿Cada proceso crítico tiene indicadores definidos, medidos y con metas claras, o miden por cumplir sin saber si realmente generan valor?' },
  { id: 6, short: 'Riesgos', title: 'Riesgos y Controles', question: '¿Tienen una matriz de riesgos operativos integrada a los procesos con controles definidos, o los riesgos se gestionan solo cuando hay auditorías?' },
  { id: 7, short: 'Innovación', title: 'Innovación', question: '¿Han implementado RPA, Process Mining o IA en sus procesos, o la "automatización" es pasar de papel a Excel?' },
  { id: 8, short: 'Cultura', title: 'Cultura', question: '¿Los dueños de proceso y las áreas entienden y viven la gestión por procesos, o lo ven como un trámite burocrático del área de calidad?' },
  { id: 9, short: 'Auditoría', title: 'Auditoría Interna', question: '¿Auditoría interna evalúa la eficacia real de los procesos y genera valor, o solo verifican que existan documentos?' }
];

const scaleLabels = [
  '',
  '1 — No existe / No se ha considerado',
  '2 — Inicial / Esfuerzos aislados',
  '3 — Definido / En desarrollo',
  '4 — Gestionado / Implementado parcialmente',
  '5 — Optimizado / Mejora continua'
];

const axisXQ = [
  '¿Tienen flujogramas/diagramas de proceso actualizados para sus procesos críticos?',
  '¿Cada flujograma tiene su procedimiento documentado con roles, responsables y políticas?',
  '¿Utilizan fichas SIPOC para definir el alcance de sus procesos?',
  '¿Tienen una Matriz de Riesgos Operativos vinculada a cada proceso con controles definidos?',
  '¿Cada proceso tiene KPIs definidos con metas, frecuencia de medición y responsables?'
];

const axisYQ = [
  '¿Han implementado RPA (Automatización Robótica de Procesos) en al menos un proceso?',
  '¿Utilizan Process Mining para analizar el comportamiento real de sus procesos con datos?',
  '¿Han integrado Agentes de IA o asistentes inteligentes en algún flujo de trabajo?',
  '¿Usan herramientas de BI (dashboards automatizados) para monitorear procesos en tiempo real?',
  '¿Tienen un roadmap de transformación digital que conecte tecnología con la mejora de procesos?'
];

// --- Component ---

export const MaturityDiagnostic = () => {
  const [screen, setScreen] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [h1Scores, setH1Scores] = useState<number[]>(new Array(10).fill(0));
  const [h2XScores, setH2XScores] = useState<number[]>(new Array(5).fill(0));
  const [h2YScores, setH2YScores] = useState<number[]>(new Array(5).fill(0));
  const [showDownload, setShowDownload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const radarRef = useRef<HTMLCanvasElement>(null);
  const cartesianRef = useRef<HTMLCanvasElement>(null);
  const radarMiniRef = useRef<HTMLCanvasElement>(null);
  const cartesianMiniRef = useRef<HTMLCanvasElement>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Logic ---

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleH1Score = (idx: number, val: number) => {
    const newScores = [...h1Scores];
    newScores[idx] = val;
    setH1Scores(newScores);
  };

  const handleH2Score = (axis: 'x' | 'y', idx: number, val: number) => {
    if (axis === 'x') {
      const newScores = [...h2XScores];
      newScores[idx] = val;
      setH2XScores(newScores);
    } else {
      const newScores = [...h2YScores];
      newScores[idx] = val;
      setH2YScores(newScores);
    }
  };

  const isH1Complete = h1Scores.every(s => s > 0);
  const isH2Complete = h2XScores.every(s => s > 0) && h2YScores.every(s => s > 0);

  // --- Drawing ---

  useEffect(() => {
    if (screen === 4 && radarRef.current) {
      drawRadar(radarRef.current, h1Scores);
    }
    if (screen === 6 && cartesianRef.current) {
      drawCartesian(cartesianRef.current, h2XScores, h2YScores);
    }
    if (screen === 7) {
      if (radarMiniRef.current) drawRadar(radarMiniRef.current, h1Scores);
      if (cartesianMiniRef.current) drawCartesian(cartesianMiniRef.current, h2XScores, h2YScores);
    }
  }, [screen, h1Scores, h2XScores, h2YScores]);

  const drawRadar = (canvas: HTMLCanvasElement, scores: number[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 50;
    const n = 10;

    ctx.clearRect(0, 0, size, size);

    // Draw background circles
    for (let lv = 1; lv <= 5; lv++) {
      const r = (lv / 5) * maxR;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (Math.PI * 2 * i / n) - Math.PI / 2;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 163, 255, 0.1)';
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
      ctx.strokeStyle = 'rgba(0, 163, 255, 0.08)';
      ctx.stroke();
    }

    // Draw data
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const val = scores[idx] || 0;
      const r = (val / 5) * maxR;
      const a = (Math.PI * 2 * idx / n) - Math.PI / 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 163, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#00A3FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.font = '10px Outfit';
    ctx.fillStyle = '#8B95A8';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      const lr = maxR + 25;
      ctx.fillText(dimensions[i].short, cx + lr * Math.cos(a), cy + lr * Math.sin(a) + 4);
    }
  };

  const drawCartesian = (canvas: HTMLCanvasElement, xScores: number[], yScores: number[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const pad = 60;
    const ps = size - pad * 2;
    const mid = pad + ps / 2;

    ctx.clearRect(0, 0, size, size);

    // Background quadrants
    ctx.fillStyle = 'rgba(255, 64, 87, 0.04)'; ctx.fillRect(pad, mid, ps / 2, ps / 2);
    ctx.fillStyle = 'rgba(255, 204, 2, 0.04)'; ctx.fillRect(mid, mid, ps / 2, ps / 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.04)'; ctx.fillRect(pad, pad, ps / 2, ps / 2);
    ctx.fillStyle = 'rgba(0, 230, 118, 0.04)'; ctx.fillRect(mid, pad, ps / 2, ps / 2);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 1; i <= 4; i++) {
      const p = pad + (ps * i / 5);
      ctx.beginPath(); ctx.moveTo(p, pad); ctx.lineTo(p, pad + ps); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, p); ctx.lineTo(pad + ps, p); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad + ps); ctx.lineTo(pad + ps, pad + ps); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + ps); ctx.stroke();

    // Mid lines
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath(); ctx.moveTo(mid, pad); ctx.lineTo(mid, pad + ps); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, mid); ctx.lineTo(pad + ps, mid); ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = '12px Outfit';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(168, 85, 247, 0.5)'; ctx.fillText('⚡ Innovación Caótica', pad + ps * 0.25, pad + ps * 0.15);
    ctx.fillStyle = 'rgba(0, 230, 118, 0.5)'; ctx.fillText('🚀 Gestión Inteligente', pad + ps * 0.75, pad + ps * 0.15);
    ctx.fillStyle = 'rgba(255, 64, 87, 0.5)'; ctx.fillText('🔥 Zona de Caos', pad + ps * 0.25, pad + ps * 0.9);
    ctx.fillStyle = 'rgba(255, 204, 2, 0.5)'; ctx.fillText('📄 Gestión de Papel', pad + ps * 0.75, pad + ps * 0.9);

    // Data point
    const xAvg = xScores.reduce((a, b) => a + b, 0) / 5;
    const yAvg = yScores.reduce((a, b) => a + b, 0) / 5;
    const px = pad + ((xAvg - 0.5) / 5) * ps;
    const py = pad + ps - ((yAvg - 0.5) / 5) * ps;

    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#00E5FF';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const generateShareImage = () => {
    const canvas = shareCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 900;
    const height = 520;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#06080F';
    ctx.fillRect(0, 0, width, height);

    // Border glow
    ctx.strokeStyle = 'rgba(0, 163, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Header
    ctx.fillStyle = '#00A3FF';
    ctx.font = 'bold 14px Outfit';
    ctx.fillText('LEAN TRANSFORMATION 2026 — WORKBOOK 1/3', 30, 35);
    ctx.fillStyle = '#8B95A8';
    ctx.font = '12px Outfit';
    ctx.fillText('16 · 17 · 18 de Marzo · El evento de procesos más grande de habla hispana', 30, 55);

    // User
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Outfit';
    ctx.fillText(`${userName} — ${avatars[selectedAvatar || 0].name}`, 30, 85);

    // Line
    ctx.strokeStyle = 'rgba(0, 163, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, 100); ctx.lineTo(870, 100); ctx.stroke();

    // Draw mini radar on left
    const rCx = 200, rCy = 300, rMax = 140, n = 10;
    for (let lv = 1; lv <= 5; lv++) {
      const r = (lv / 5) * rMax;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (Math.PI * 2 * i / n) - Math.PI / 2;
        const x = rCx + r * Math.cos(a);
        const y = rCy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 163, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const val = h1Scores[idx];
      const r = (val / 5) * rMax;
      const a = (Math.PI * 2 * idx / n) - Math.PI / 2;
      const x = rCx + r * Math.cos(a);
      const y = rCy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 163, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#00A3FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // BPMM
    const bpmm = getBpmmLevel();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit';
    ctx.fillText('Madurez BPMM', 60, 480);
    ctx.fillStyle = bpmm.color;
    ctx.font = 'bold 16px Outfit';
    ctx.fillText(`${bpmm.name} (${bpmm.avg.toFixed(1)}/5)`, 200, 480);

    // Draw mini cartesian on right
    const cPad = 490, cSize = 350, cPs = cSize - 80, cOx = cPad + 40, cOy = 130 + 40, cMid = cOx + cPs / 2, cMidY = cOy + cPs / 2;
    ctx.fillStyle = 'rgba(255, 64, 87, 0.06)'; ctx.fillRect(cOx, cMidY, cPs / 2, cPs / 2);
    ctx.fillStyle = 'rgba(255, 204, 2, 0.06)'; ctx.fillRect(cMid, cMidY, cPs / 2, cPs / 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.04)'; ctx.fillRect(cOx, cOy, cPs / 2, cPs / 2);
    ctx.fillStyle = 'rgba(0, 230, 118, 0.06)'; ctx.fillRect(cMid, cOy, cPs / 2, cPs / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cOx, cOy + cPs); ctx.lineTo(cOx + cPs, cOy + cPs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cOx, cOy); ctx.lineTo(cOx, cOy + cPs); ctx.stroke();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath(); ctx.moveTo(cMid, cOy); ctx.lineTo(cMid, cOy + cPs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cOx, cMidY); ctx.lineTo(cOx + cPs, cMidY); ctx.stroke();
    ctx.setLineDash([]);

    const xA = h2XScores.reduce((a, b) => a + b, 0) / 5;
    const yA = h2YScores.reduce((a, b) => a + b, 0) / 5;
    const ppx = cOx + ((xA - 0.5) / 5) * cPs;
    const ppy = cOy + cPs - ((yA - 0.5) / 5) * cPs;
    ctx.beginPath(); ctx.arc(ppx, ppy, 6, 0, Math.PI * 2); ctx.fillStyle = '#00E5FF'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

    // Footer
    ctx.fillStyle = 'rgba(0, 163, 255, 0.15)'; ctx.fillRect(0, 505, 900, 15);
    ctx.fillStyle = '#00A3FF';
    ctx.font = '9px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('Comparte en la comunidad Process Masters · process-masters.circle.so · #LeanTransformation2026', 450, 514);

    setShowDownload(true);
  };

  const downloadImage = () => {
    const canvas = shareCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'Mi_Diagnostico_LeanTransformation_2026.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ Imagen descargada');
  };

  const getBpmmLevel = () => {
    const avg = h1Scores.reduce((a, b) => a + b, 0) / 10;
    const level = Math.max(1, Math.min(5, Math.round(avg)));
    const names = ['', 'INICIAL', 'REPETIBLE', 'DEFINIDO', 'GESTIONADO', 'OPTIMIZADO'];
    const colors = ['', '#FF4057', '#FF8C42', '#FFCC02', '#4FC3F7', '#00E676'];
    return { name: names[level], color: colors[level], avg };
  };

  const getRecommendations = () => {
    const sorted = dimensions.map((d, i) => ({ ...d, score: h1Scores[i] }))
      .sort((a, b) => a.score - b.score);
    
    const gaps = sorted.slice(0, 3);
    const strengths = sorted.slice(-2).reverse();

    const actions = [];
    if (h1Scores[0] <= 2) actions.push('Alinear el mapa de procesos con los objetivos estratégicos.');
    if (h1Scores[1] <= 2) actions.push('Formalizar una política de gestión por procesos aprobada.');
    if (h1Scores[2] <= 2) actions.push('Crear un comité de procesos con poder de decisión.');
    if (h1Scores[3] <= 2) actions.push('Estandarizar las metodologías de gestión (BPMN, Lean).');
    if (h1Scores[4] <= 2) actions.push('Migrar a herramientas especializadas de modelado.');
    if (actions.length < 3) actions.push('Definir indicadores críticos para los procesos clave.');

    return { gaps, strengths, actions };
  };

  // --- Render Screens ---


  const renderScreen1 = () => (
    <div className="flex flex-col items-center text-center py-12">
      <div className="flex items-center gap-8 mb-12">
        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <Zap className="w-12 h-12 text-primary fill-current" />
        </div>
      </div>
      <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-cyan-accent tracking-widest uppercase mb-6">
        Workbook 1/3 — Lean Transformation 2026
      </div>
      <h1 className="text-6xl font-black tracking-tighter mb-4 bg-gradient-to-br from-white via-cyan-accent to-primary bg-clip-text text-transparent">
        DIAGNÓSTICO DE MADUREZ
      </h1>
      <p className="text-slate-400 text-lg max-w-2xl mb-12 leading-relaxed">
        Evalúa el estado actual de tu gestión por procesos y descubre las brechas críticas que impiden tu transformación.
      </p>
      <button 
        onClick={() => setScreen(2)}
        className="btn-primary px-12 py-5 text-lg"
      >
        EMPEZAR DIAGNÓSTICO <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderScreen2 = () => (
    <div className="max-w-2xl mx-auto py-12">
      <div className="glass-panel p-10">
        <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
        <p className="text-slate-400 mb-8">Personaliza tu perfil para generar el informe final.</p>
        
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">¿Cuál es tu nombre?</label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Escribe tu nombre..."
              className="w-full bg-bg-dark border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Selecciona tu Avatar</label>
            <div className="grid grid-cols-5 gap-4">
              {avatars.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(i)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all group",
                    selectedAvatar === i 
                      ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(0,163,255,0.2)]" 
                      : "bg-bg-dark border-white/5 hover:border-white/20"
                  )}
                >
                  <a.icon className={cn(
                    "w-8 h-8",
                    selectedAvatar === i ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">{a.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={!userName || selectedAvatar === null}
            onClick={() => setScreen(3)}
            className="w-full btn-primary py-5 text-lg disabled:opacity-30"
          >
            CONTINUAR <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderScreen3 = () => (
    <div className="max-w-5xl mx-auto py-12">
      <div className="text-center mb-12">
        <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-cyan-accent uppercase tracking-widest mb-4">
          Herramienta 1 de 2
        </div>
        <h2 className="text-4xl font-bold mb-4">Madurez de Gestión por Procesos</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">Evalúa 10 dimensiones clave de tu sistema. Responde con total honestidad para obtener un diagnóstico real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {dimensions.map((d, i) => (
          <div key={i} className={cn(
            "glass-panel p-6 transition-all border-l-4",
            h1Scores[i] > 0 ? "border-l-emerald-500" : "border-l-primary/30"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {i + 1}
              </div>
              <h4 className="font-bold text-white">{d.title}</h4>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">{d.question}</p>
            <select 
              value={h1Scores[i]}
              onChange={(e) => handleH1Score(i, parseInt(e.target.value))}
              className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
            >
              <option value="0">Selecciona tu nivel...</option>
              {scaleLabels.slice(1).map((l, idx) => (
                <option key={idx} value={idx + 1}>{l}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button 
          disabled={!isH1Complete}
          onClick={() => setScreen(4)}
          className="btn-primary px-12 py-5 text-lg disabled:opacity-30"
        >
          VER RESULTADOS <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderScreen4 = () => {
    const bpmm = getBpmmLevel();
    const recs = getRecommendations();
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Tu Diagnóstico de Madurez</h2>
          <p className="text-slate-400">Análisis detallado de tus capacidades actuales.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 glass-panel p-10 flex flex-col items-center">
            <canvas ref={radarRef} width={500} height={500} className="max-w-full" />
          </div>
          <div className="space-y-6">
            <div className="glass-panel p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-brand-purple flex items-center justify-center text-white font-bold text-xl">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{userName}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest">{avatars[selectedAvatar || 0].name}</div>
                </div>
              </div>
              <div className="space-y-3">
                {dimensions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{d.short}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(h1Scores[i] / 5) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-white w-4">{h1Scores[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Escala BPMM</h4>
              <div className="h-12 flex rounded-xl overflow-hidden mb-4 relative">
                <div className="bpmm-level bg-red-500/80 text-white">L1</div>
                <div className="bpmm-level bg-orange-500/80 text-white">L2</div>
                <div className="bpmm-level bg-yellow-500/80 text-black">L3</div>
                <div className="bpmm-level bg-blue-400/80 text-black">L4</div>
                <div className="bpmm-level bg-emerald-500/80 text-black">L5</div>
                <motion.div 
                  initial={{ left: 0 }}
                  animate={{ left: `${((bpmm.avg - 1) / 4) * 100}%` }}
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-10"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-black tracking-tight" style={{ color: bpmm.color }}>{bpmm.name}</div>
                <div className="text-xs text-slate-500 mt-1">Promedio: {bpmm.avg.toFixed(1)} / 5.0</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" /> Brechas Críticas
            </h3>
            {recs.gaps.map((g, i) => (
              <div key={i} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <div className="font-bold text-sm mb-1">{g.title}</div>
                <div className="text-xs text-slate-400">Nivel {g.score}/5 — Requiere atención inmediata.</div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" /> Fortalezas
            </h3>
            {recs.strengths.map((s, i) => (
              <div key={i} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <div className="font-bold text-sm mb-1">{s.title}</div>
                <div className="text-xs text-slate-400">Nivel {s.score}/5 — Base sólida para escalar.</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-8 mb-12">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Plan de Acción Prioritario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recs.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-300">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => setScreen(5)}
            className="btn-primary px-12 py-5 text-lg"
          >
            CONTINUAR A HERRAMIENTA 2 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };


  const renderScreen5 = () => {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-cyan-accent uppercase tracking-widest mb-4">
            Herramienta 2 de 2
          </div>
          <h2 className="text-4xl font-bold mb-4">Gestión de Papel vs. Innovación</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Descubre si tu organización documenta para cumplir o transforma para generar valor estratégico.</p>
        </div>

        <div className="space-y-12 mb-12">
          <div className="glass-panel p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg"><BarChart3 className="w-5 h-5 text-primary" /></div>
              Eje X — Nivel de Documentación
            </h3>
            <div className="space-y-6">
              {axisXQ.map((q, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                  <label className="text-sm text-slate-300 flex-1">{q}</label>
                  <select 
                    value={h2XScores[i]}
                    onChange={(e) => handleH2Score('x', i, parseInt(e.target.value))}
                    className="bg-bg-dark border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="0">Selecciona...</option>
                    {scaleLabels.slice(1).map((l, idx) => (
                      <option key={idx} value={idx + 1}>{l}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className="p-2 bg-brand-purple/20 rounded-lg"><Zap className="w-5 h-5 text-brand-purple" /></div>
              Eje Y — Nivel de Innovación y Tecnología
            </h3>
            <div className="space-y-6">
              {axisYQ.map((q, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                  <label className="text-sm text-slate-300 flex-1">{q}</label>
                  <select 
                    value={h2YScores[i]}
                    onChange={(e) => handleH2Score('y', i, parseInt(e.target.value))}
                    className="bg-bg-dark border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="0">Selecciona...</option>
                    {scaleLabels.slice(1).map((l, idx) => (
                      <option key={idx} value={idx + 1}>{l}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            disabled={!isH2Complete}
            onClick={() => setScreen(6)}
            className="btn-primary px-12 py-5 text-lg disabled:opacity-30"
          >
            VER MI POSICIÓN <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderScreen6 = () => {
    const xAvg = h2XScores.reduce((a, b) => a + b, 0) / 5;
    const yAvg = h2YScores.reduce((a, b) => a + b, 0) / 5;
    
    let quadrant = { title: '', desc: '', color: '' };
    if (xAvg >= 3 && yAvg >= 3) {
      quadrant = { title: '🚀 GESTIÓN INTELIGENTE', desc: 'Tu organización tiene la base documental y la capacidad tecnológica para generar valor real. Profundiza la integración: que Process Mining alimente las mejoras de procedimientos y la automatización se base en procesos bien diseñados.', color: 'text-emerald-400' };
    } else if (xAvg < 3 && yAvg >= 3) {
      quadrant = { title: '⚡ INNOVACIÓN CAÓTICA', desc: 'Has invertido en tecnología pero sin la base documental. Estás automatizando el caos. Cada RPA que implementas puede estar automatizando ineficiencias. Necesitas urgentemente construir los cimientos documentales.', color: 'text-brand-purple' };
    } else if (xAvg >= 3 && yAvg < 3) {
      quadrant = { title: '📄 GESTIÓN DE PAPEL', desc: 'Tienes todo documentado pero no generas valor estratégico. Tu área es percibida como burocrática. El área necesita evolucionar de generadora de documentos a generadora de valor con tecnología.', color: 'text-yellow-400' };
    } else {
      quadrant = { title: '🔥 ZONA DE CAOS', desc: 'No tienes procesos documentados ni tecnología. Apagar incendios es tu día a día. Cada día pierdes tiempo, dinero y credibilidad. Los problemas se repiten y la dirección no ve el valor del área.', color: 'text-red-400' };
    }

    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Mapa de Gestión</h2>
          <p className="text-slate-400">Tu posición estratégica según documentación e innovación.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="glass-panel p-10 flex justify-center">
            <canvas ref={cartesianRef} width={500} height={500} className="max-w-full" />
          </div>
          <div className="space-y-8">
            <div className="glass-panel p-10">
              <div className={cn("text-3xl font-black mb-6 tracking-tight", quadrant.color)}>{quadrant.title}</div>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">{quadrant.desc}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Documentación</div>
                  <div className="text-2xl font-bold text-white">{xAvg.toFixed(1)} / 5.0</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Innovación</div>
                  <div className="text-2xl font-bold text-white">{yAvg.toFixed(1)} / 5.0</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button onClick={() => setScreen(7)} className="btn-primary px-12 py-4">
                VER INFORME FINAL <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScreen7 = () => {
    const xAvg = h2XScores.reduce((a, b) => a + b, 0) / 5;
    const yAvg = h2YScores.reduce((a, b) => a + b, 0) / 5;
    const bpmm = getBpmmLevel();
    const recs = getRecommendations();
    
    let quadrant = { title: '', desc: '', color: '' };
    if (xAvg >= 3 && yAvg >= 3) {
      quadrant = { title: '🚀 GESTIÓN INTELIGENTE', desc: 'Tu organización tiene la base documental y la capacidad tecnológica para generar valor real. Profundiza la integración: que Process Mining alimente las mejoras de procedimientos y la automatización se base en procesos bien diseñados.', color: 'text-emerald-400' };
    } else if (xAvg < 3 && yAvg >= 3) {
      quadrant = { title: '⚡ INNOVACIÓN CAÓTICA', desc: 'Has invertido en tecnología pero sin la base documental. Estás automatizando el caos. Cada RPA que implementas puede estar automatizando ineficiencias. Necesitas urgentemente construir los cimientos documentales.', color: 'text-brand-purple' };
    } else if (xAvg >= 3 && yAvg < 3) {
      quadrant = { title: '📄 GESTIÓN DE PAPEL', desc: 'Tienes todo documentado pero no generas valor estratégico. Tu área es percibida como burocrática. El área necesita evolucionar de generadora de documentos a generadora de valor con tecnología.', color: 'text-yellow-400' };
    } else {
      quadrant = { title: '🔥 ZONA DE CAOS', desc: 'No tienes procesos documentados ni tecnología. Apagar incendios es tu día a día. Cada día pierdes tiempo, dinero y credibilidad. Los problemas se repiten y la dirección no ve el valor del área.', color: 'text-red-400' };
    }

    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Informe Final de Diagnóstico</h2>
          <p className="text-slate-400">Lean Transformation 2026 — Workbook 1/3</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="glass-panel p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary">
              <Target className="w-5 h-5" /> Madurez BPMM: {bpmm.name}
            </h3>
            <div className="flex justify-center mb-6">
              <canvas ref={radarMiniRef} width={300} height={300} />
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Puntaje Promedio</div>
                <div className="text-2xl font-bold text-white">{bpmm.avg.toFixed(1)} / 5.0</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brechas Críticas</div>
                {recs.gaps.map((g, i) => (
                  <div key={i} className="text-sm text-slate-300 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {g.title} ({g.score}/5)
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-400">
              <BarChart3 className="w-5 h-5" /> Mapa de Gestión
            </h3>
            <div className="flex justify-center mb-6">
              <canvas ref={cartesianMiniRef} width={300} height={300} />
            </div>
            <div className="space-y-4">
              <div className={cn("text-xl font-black tracking-tight text-center", quadrant.color)}>{quadrant.title}</div>
              <p className="text-sm text-slate-400 leading-relaxed text-center">{quadrant.desc}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Documentación</div>
                  <div className="text-lg font-bold text-white">{xAvg.toFixed(1)}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Innovación</div>
                  <div className="text-lg font-bold text-white">{yAvg.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={generateShareImage} className="btn-primary px-8 py-4">
            <Download className="w-5 h-5" /> GENERAR IMAGEN PARA COMPARTIR
          </button>
          <button onClick={() => window.print()} className="btn-secondary px-8 py-4">
            <Share2 className="w-5 h-5" /> EXPORTAR PDF
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(rgba(0,163,255,0.03)_1px,transparent_1px)] bg-[length:60px_60px]" />
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-brand-purple/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {screen === 1 && renderScreen1()}
            {screen === 2 && renderScreen2()}
            {screen === 3 && renderScreen3()}
            {screen === 4 && renderScreen4()}
            {screen === 5 && renderScreen5()}
            {screen === 6 && renderScreen6()}
            {screen === 7 && renderScreen7()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hidden Canvas for Image Generation */}
      <canvas ref={shareCanvasRef} className="hidden" />

      {/* Download Overlay */}
      <div className={cn("download-overlay", showDownload && "show")}>
        <div className="glass-panel p-8 max-w-4xl w-full flex flex-col items-center">
          <h3 className="text-xl font-bold mb-6">📊 Tu Diagnóstico — Listo para compartir</h3>
          <div className="w-full overflow-hidden rounded-xl border border-white/10 mb-8">
            <canvas 
              ref={(el) => {
                if (el && shareCanvasRef.current) {
                  const ctx = el.getContext('2d');
                  if (ctx) {
                    el.width = shareCanvasRef.current.width;
                    el.height = shareCanvasRef.current.height;
                    ctx.drawImage(shareCanvasRef.current, 0, 0);
                  }
                }
              }} 
              className="w-full h-auto" 
            />
          </div>
          <div className="flex gap-4">
            <button onClick={downloadImage} className="btn-primary px-8 py-3">
              <Download className="w-5 h-5" /> DESCARGAR IMAGEN
            </button>
            <button onClick={() => setShowDownload(false)} className="btn-secondary px-8 py-3">
              CERRAR
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={cn("toast", toast && "show")}>
        {toast}
      </div>
    </div>
  );
};

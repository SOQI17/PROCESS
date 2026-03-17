import React, { useState } from 'react';
import { 
  Upload, 
  Mic, 
  MessageSquare, 
  Zap, 
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { generateProcessDiagram } from '../services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'texto' | 'archivo';

export const ProcessGenerator = () => {
  const [activeTab, setActiveTab] = useState<Tab>('texto');
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (activeTab === 'texto' && !inputText.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const prompt = activeTab === 'texto' 
        ? inputText 
        : "Simulación de análisis de archivo: El usuario subió un documento de proceso de ventas.";
      
      const output = await generateProcessDiagram(prompt);
      setResult(output || "No se pudo generar el diagrama.");
    } catch (err) {
      setError("Error al conectar con la IA. Por favor verifica tu conexión.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-blue/20 rounded-lg">
            <Zap className="w-6 h-6 text-brand-blue fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Levantador de Procesos</h1>
        </div>
        <p className="text-slate-400 text-lg">
          Transforma voz, texto o archivos multimedia en diagramas BPMN 2.0.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="glass-panel overflow-hidden flex flex-col h-[600px]">
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab('texto')}
              className={cn(
                "flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all",
                activeTab === 'texto' 
                  ? "text-white bg-white/5 border-b-2 border-brand-blue" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              TEXTO Y VOZ
            </button>
            <button
              onClick={() => setActiveTab('archivo')}
              className={cn(
                "flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all",
                activeTab === 'archivo' 
                  ? "text-white bg-white/5 border-b-2 border-brand-blue" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Upload className="w-4 h-4" />
              ARCHIVO
            </button>
          </div>

          <div className="flex-1 p-8 flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'archivo' ? (
                <motion.div
                  key="archivo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-white font-medium mb-1">Arrastra un archivo aquí</p>
                  <p className="text-slate-500 text-xs uppercase tracking-widest">MP3, WAV, MP4, WEBM, PNG, JPG, PDF</p>
                </motion.div>
              ) : (
                <motion.div
                  key="texto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col gap-4"
                >
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Describe el proceso aquí (ej: El cliente solicita un presupuesto, el vendedor lo valida...)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 resize-none"
                  />
                  <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10">
                    <Mic className="w-4 h-4 text-brand-blue" />
                    Grabar Audio
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="mt-4 text-red-400 text-xs text-center">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-8 w-full py-4 bg-gradient-to-r from-brand-blue to-brand-purple hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-brand-blue/20 transition-all active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  GENERANDO...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  GENERAR DIAGRAMA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="glass-panel overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Output</span>
          </div>

          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
            {result ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col text-left"
              >
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 font-sans text-sm text-slate-300 flex-1 overflow-auto prose prose-invert prose-sm max-w-none">
                  <Markdown>{result}</Markdown>
                </div>
                <div className="mt-4 flex gap-3">
                  <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium border border-white/10">
                    Exportar BPMN
                  </button>
                  <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium border border-white/10">
                    Ver en Editor
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4 opacity-40">
                <div className="flex justify-center">
                  <div className="relative">
                    <Zap className="w-16 h-16 text-slate-600" />
                    <motion.div 
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 blur-xl bg-brand-blue/20 rounded-full"
                    />
                  </div>
                </div>
                <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Esperando señal de entrada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Diagramas Generados', value: '1,284', icon: Zap },
          { label: 'Tiempo Ahorrado', value: '420h', icon: ArrowRight },
          { label: 'Precisión AI', value: '98.2%', icon: ShieldCheck },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl">
              <stat.icon className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

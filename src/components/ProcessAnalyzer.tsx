import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { 
  FileSearch, 
  Search,
  Download, 
  FileCode, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Layers,
  Users,
  Copy,
  Terminal,
  FileSpreadsheet,
  ShieldAlert,
  BarChart
} from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// BPMN XML Template Generator with Professional Layout and Specialized Bizagi Shapes
const generateBPMNXML = (processName: string, steps: any[]) => {
  const lanes = [...new Set(steps.map(s => s.lane))];
  const LANE_HEIGHT = 200;
  const LANE_WIDTH = (steps.length + 3) * 200;
  const ACTIVITY_WIDTH = 120;
  const ACTIVITY_HEIGHT = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;
  const HORIZONTAL_SPACING = 200;
  const START_X = 150;
  
  const laneYMap: Record<string, number> = {};
  lanes.forEach((lane, idx) => {
    laneYMap[lane] = idx * LANE_HEIGHT;
  });

  // Helper to get correct BPMN tag based on type/subtype
  const getBPMNTag = (step: any) => {
    if (step.type === 'gateway') return 'bpmn:exclusiveGateway';
    switch (step.subType) {
      case 'send': return 'bpmn:sendTask';
      case 'receive': return 'bpmn:receiveTask';
      case 'user': return 'bpmn:userTask';
      case 'manual': return 'bpmn:manualTask';
      case 'service': return 'bpmn:serviceTask';
      case 'businessRule': return 'bpmn:businessRuleTask';
      default: return 'bpmn:task';
    }
  };

  const getPrefix = (step: any) => {
    if (step.type === 'gateway') return 'Gateway';
    return 'Activity';
  };

  // Logical: Lane Definitions
  let laneElements = lanes.map((lane, idx) => `
      <bpmn:lane id="Lane_${idx}" name="${lane}">
        ${steps.filter(s => s.lane === lane).map(s => `<bpmn:flowNodeRef>${getPrefix(s)}_${s.id}</bpmn:flowNodeRef>`).join('\n        ')}
        ${idx === 0 ? '<bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>' : ''}
        ${idx === lanes.length - 1 ? '<bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>' : ''}
      </bpmn:lane>`).join('');

  // Logical: Flow Nodes (Tasks and Gateways)
  let flowNodes = steps.map((s, idx) => {
    const tag = getBPMNTag(s);
    const id = `${getPrefix(s)}_${s.id}`;
    return `
    <${tag} id="${id}" name="${s.name}">
      <bpmn:incoming>Flow_${idx}</bpmn:incoming>
      <bpmn:outgoing>Flow_${idx + 1}</bpmn:outgoing>
    </${tag}>`;
  }).join('');

  // Logical: Sequences
  let sequences = steps.map((s, idx) => {
    const source = idx === 0 ? 'StartEvent_1' : `${getPrefix(steps[idx-1])}_${steps[idx-1].id}`;
    const target = `${getPrefix(s)}_${s.id}`;
    return `<bpmn:sequenceFlow id="Flow_${idx}" sourceRef="${source}" targetRef="${target}" />`;
  }).join('\n    ');

  sequences += `\n    <bpmn:sequenceFlow id="Flow_${steps.length}" sourceRef="${getPrefix(steps[steps.length-1])}_${steps[steps.length-1].id}" targetRef="EndEvent_1" />`;

  // Visual (BPMNDI): Shapes
  let diShapes = `
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="50" y="0" width="${LANE_WIDTH + 100}" height="${lanes.length * LANE_HEIGHT}" />
      </bpmndi:BPMNShape>
  `;

  diShapes += lanes.map((lane, idx) => `
      <bpmndi:BPMNShape id="Lane_${idx}_di" bpmnElement="Lane_${idx}" isHorizontal="true">
        <dc:Bounds x="80" y="${idx * LANE_HEIGHT}" width="${LANE_WIDTH + 70}" height="${LANE_HEIGHT}" />
      </bpmndi:BPMNShape>
  `).join('');

  // Start Event Shape
  diShapes += `
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="120" y="${laneYMap[steps[0].lane] + (LANE_HEIGHT / 2) - (EVENT_SIZE / 2)}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>
  `;

  // Activity and Gateway Shapes
  diShapes += steps.map((s, idx) => {
    const x = START_X + (idx * HORIZONTAL_SPACING);
    const id = `${getPrefix(s)}_${s.id}`;
    if (s.type === 'gateway') {
      const y = laneYMap[s.lane] + (LANE_HEIGHT / 2) - (GATEWAY_SIZE / 2);
      return `
      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}" isMarkerVisible="true">
        <dc:Bounds x="${x}" y="${y}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
      </bpmndi:BPMNShape>`;
    }
    const y = laneYMap[s.lane] + (LANE_HEIGHT / 2) - (ACTIVITY_HEIGHT / 2);
    return `
      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}">
        <dc:Bounds x="${x}" y="${y}" width="${ACTIVITY_WIDTH}" height="${ACTIVITY_HEIGHT}" />
      </bpmndi:BPMNShape>`;
  }).join('');

  // End Event Shape
  diShapes += `
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${START_X + (steps.length * HORIZONTAL_SPACING) + 50}" y="${laneYMap[steps[steps.length-1].lane] + (LANE_HEIGHT / 2) - (EVENT_SIZE / 2)}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>
  `;

  // Visual (BPMNDI): Edges
  let diEdges = steps.map((s, idx) => {
    const prev = steps[idx-1];
    const sourceX = idx === 0 ? 156 : START_X + ((idx - 1) * HORIZONTAL_SPACING) + (prev.type === 'gateway' ? GATEWAY_SIZE : ACTIVITY_WIDTH);
    const sourceY = idx === 0 ? laneYMap[steps[0].lane] + (LANE_HEIGHT / 2) : laneYMap[prev.lane] + (LANE_HEIGHT / 2);
    const targetX = START_X + (idx * HORIZONTAL_SPACING);
    const targetY = laneYMap[s.lane] + (LANE_HEIGHT / 2);
    
    return `
      <bpmndi:BPMNEdge id="Flow_${idx}_di" bpmnElement="Flow_${idx}">
        <di:waypoint x="${sourceX}" y="${sourceY}" />
        <di:waypoint x="${targetX}" y="${targetY}" />
      </bpmndi:BPMNEdge>`;
  }).join('');

  // Last edge to end event
  const lastIdx = steps.length - 1;
  const last = steps[lastIdx];
  const lastSourceX = START_X + (lastIdx * HORIZONTAL_SPACING) + (last.type === 'gateway' ? GATEWAY_SIZE : ACTIVITY_WIDTH);
  const lastSourceY = laneYMap[last.lane] + (LANE_HEIGHT / 2);
  const lastTargetX = START_X + (steps.length * HORIZONTAL_SPACING) + 50;
  const lastTargetY = laneYMap[last.lane] + (LANE_HEIGHT / 2);

  diEdges += `
      <bpmndi:BPMNEdge id="Flow_${steps.length}_di" bpmnElement="Flow_${steps.length}">
        <di:waypoint x="${lastSourceX}" y="${lastSourceY}" />
        <di:waypoint x="${lastTargetX}" y="${lastTargetY}" />
      </bpmndi:BPMNEdge>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="${processName}" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      ${laneElements}
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio">
      <bpmn:outgoing>Flow_0</bpmn:outgoing>
    </bpmn:startEvent>
    ${flowNodes}
    <bpmn:endEvent id="EndEvent_1" name="Fin">
      <bpmn:incoming>Flow_${steps.length}</bpmn:incoming>
    </bpmn:endEvent>
    ${sequences}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      ${diShapes}
      ${diEdges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
};

const tipsExtraSteps = [
  { id: '1', lane: 'Mesero', name: 'Entrega Pre-Cuenta con Ticket Tip Extra', type: 'task', subType: 'send', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '2', lane: 'Cliente', name: 'Escribe valor de Tip Extra en Ticket', type: 'task', subType: 'user', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '3', lane: 'Cajero', name: 'Realiza cobro adicionando propina', type: 'task', subType: 'user', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '4', lane: 'Cajero', name: '¿Datos correctos?', type: 'gateway', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '5', lane: 'Cajero', name: 'Digita en POS valor total y Tip Extra', type: 'task', subType: 'user', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '6', lane: 'Cajero', name: 'Emite factura (sin incluir Tip Extra)', type: 'task', subType: 'service', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '7', lane: 'Cajero', name: 'Abre mesa y carga propina a PI correspondiente', type: 'task', subType: 'service', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '8', lane: 'Cajero', name: 'Coloca referencia en Check de Propina', type: 'task', subType: 'manual', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '9', lane: 'Cajero', name: 'Detalla datos en Formato de Control', type: 'task', subType: 'user', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '10', lane: 'Cajero', name: 'Elabora formato por marca de TC y totaliza', type: 'task', subType: 'user', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '11', lane: 'Cajero', name: 'Adjunta ticket a PI asignada', type: 'task', subType: 'manual', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '12', lane: 'Cajero', name: 'Finaliza turno y envía documentación', type: 'task', subType: 'send', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '13', lane: 'Dept. Night Audit', name: 'Reporta novedades y retroalimentación', type: 'task', subType: 'service', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '14', lane: 'Dept. Night Audit', name: 'Cierra PI como Folio Interno', type: 'task', subType: 'service', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '15', lane: 'Dept. Night Audit', name: 'Cierra TC con valores de propina', type: 'task', subType: 'service', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '16', lane: 'Dept. Night Audit', name: 'Postea pagos manuales y ajusta lotes', type: 'task', subType: 'service', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '17', lane: 'Supervisor Outlet', name: 'Verifica información de hoja de control', type: 'task', subType: 'businessRule', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '18', lane: 'Supervisor Outlet', name: 'Llena Formulario Excel mensual', type: 'task', subType: 'user', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '19', lane: 'Supervisor Outlet', name: 'Envía documento a Finanzas', type: 'task', subType: 'send', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '20', lane: 'Área de Finanzas', name: 'Coloca valor Total Propinas US$', type: 'task', subType: 'manual', description: '', performers: '', accountable: '', consulted: '', informed: '' },
  { id: '21', lane: 'Área de Finanzas', name: 'Realiza pagos mediante crédito en cuenta', type: 'task', subType: 'service', description: '', performers: '', accountable: '', consulted: '', informed: '' },
];

export const ProcessAnalyzer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [activePropertyTab, setActivePropertyTab] = useState<'basicos' | 'extendidos'>('basicos');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setResult(null);
    setSelectedStepId(null);
    // Simulate AI analysis
    setTimeout(() => {
      const roles = [...new Set(tipsExtraSteps.map(s => s.lane))];
      const description = `Quiero diagramar mi proceso de "${'Operatividad de Cobro Tips Extra con Tarjeta de Crédito'}". En este proceso participamos varios roles: ${roles.join(', ')}. El flujo comienza cuando el ${tipsExtraSteps[0].lane} ${tipsExtraSteps[0].name.toLowerCase()}. Luego, el ${tipsExtraSteps[1].lane} ${tipsExtraSteps[1].name.toLowerCase()}. El proceso continúa con el ${tipsExtraSteps[2].lane} realizando el cobro y digitando en el POS. Finalmente, el Dept. Night Audit reporta novedades y el Supervisor Outlet envía el documento a Finanzas para el pago final.`;

      setResult({
        name: 'Operatividad de Cobro Tips Extra con Tarjeta de Crédito',
        code: 'OTE048',
        objective: 'Garantizar seguridad y eficiencia en transacciones de propinas extras.',
        version: '1.0',
        author: 'Sistema de Calidad',
        category: 'Operaciones / Finanzas',
        scope: 'Aplica a todos los puntos de venta (Outlets) que procesan pagos con tarjeta de crédito.',
        foundation: [],
        processOwners: [],
        definitions: [],
        development: 'El proceso inicia con la entrega de la pre-cuenta...',
        indicators: [
          { name: 'Tiempo promedio de cobro', goal: '< 5 min', frequency: 'Mensual', source: 'Sistema POS' },
          { name: 'Porcentaje de errores en digitación', goal: '< 1%', frequency: 'Mensual', source: 'Auditoría Nocturna' },
          { name: 'Satisfacción del cliente con el pago', goal: '> 95%', frequency: 'Trimestral', source: 'Encuestas' }
        ],
        riskMatrix: [
          { risk: 'Error en digitación de propina', impact: 'Alto', probability: 'Media', mitigation: 'Doble verificación por cajero' },
          { risk: 'Falla en conexión de POS', impact: 'Medio', probability: 'Baja', mitigation: 'Procedimiento manual de contingencia' },
          { risk: 'Pérdida de ticket físico', impact: 'Alto', probability: 'Baja', mitigation: 'Escaneo inmediato de documentos' }
        ],
        resources: [],
        sipocMatrix: [],
        controlPoints: [],
        modifications: [],
        raciMatrix: [],
        approvals: [],
        steps: [...tipsExtraSteps],
        description: description
      });
      setAnalyzing(false);
    }, 2500);
  };

  const updateProcessProperty = (property: string, value: any) => {
    if (!result) return;
    setResult({ ...result, [property]: value });
  };

  const addProcessListItem = (property: string, emptyItem: any) => {
    if (!result) return;
    const currentList = result[property] || [];
    setResult({ ...result, [property]: [...currentList, emptyItem] });
  };

  const updateProcessListItem = (property: string, index: number, field: string, value: string) => {
    if (!result) return;
    const currentList = [...(result[property] || [])];
    currentList[index] = { ...currentList[index], [field]: value };
    setResult({ ...result, [property]: currentList });
  };

  const removeProcessListItem = (property: string, index: number) => {
    if (!result) return;
    const currentList = (result[property] || []).filter((_: any, i: number) => i !== index);
    setResult({ ...result, [property]: currentList });
  };

  const updateStepProperty = (stepId: string, property: string, value: string) => {
    if (!result) return;
    const updatedSteps = result.steps.map((s: any) => 
      s.id === stepId ? { ...s, [property]: value } : s
    );
    setResult({ ...result, steps: updatedSteps });
  };

  const selectedStep = result?.steps.find((s: any) => s.id === selectedStepId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleAnalyze();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAnalyze();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const downloadBPMN = () => {
    const xml = generateBPMNXML(result.name, result.steps);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.code || 'proceso'}.bpmn`;
    link.click();
  };

  const exportToExcel = () => {
    if (!result) return;

    const wb = XLSX.utils.book_new();

    // KPIs Sheet
    const kpiData = result.indicators.map((k: any) => ({
      'Nombre del Indicador': k.name,
      'Meta': k.goal,
      'Frecuencia': k.frequency,
      'Fuente de Datos': k.source
    }));
    const wsKpi = XLSX.utils.json_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKpi, "Indicadores KPI");

    // Risks Sheet
    const riskData = result.riskMatrix.map((r: any) => ({
      'Riesgo Identificado': r.risk,
      'Impacto': r.impact,
      'Probabilidad': r.probability,
      'Plan de Mitigación': r.mitigation
    }));
    const wsRisk = XLSX.utils.json_to_sheet(riskData);
    XLSX.utils.book_append_sheet(wb, wsRisk, "Matriz de Riesgos");

    // Steps Sheet
    const stepsData = result.steps.map((s: any) => ({
      'ID': s.id,
      'Rol': s.lane,
      'Actividad': s.name,
      'Tipo': s.type,
      'Subtipo': s.subType,
      'Descripción': s.description
    }));
    const wsSteps = XLSX.utils.json_to_sheet(stepsData);
    XLSX.utils.book_append_sheet(wb, wsSteps, "Flujo de Proceso");

    XLSX.writeFile(wb, `${result.code || 'analisis'}_KPI_Riesgos.xlsx`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FileSearch className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Analizador de Procesos Externos</h1>
            <p className="text-slate-400">Sube manuales o describe flujos para generar diagramas BPMN importables.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Entrada de Datos</h3>
            <div className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,image/*"
              />
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={triggerFileInput}
                className={cn(
                  "p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer group",
                  isDragging 
                    ? "border-primary bg-primary/5 scale-[1.02]" 
                    : "border-white/10 hover:border-primary/50 hover:bg-white/5"
                )}
              >
                <Layers className={cn(
                  "w-10 h-10 mx-auto mb-3 transition-colors",
                  isDragging ? "text-primary" : "text-slate-500 group-hover:text-primary/70"
                )} />
                <p className="text-sm text-slate-400">
                  {isDragging ? '¡Suéltalo aquí!' : 'Haz clic o arrastra el manual (PDF/Imagen)'}
                </p>
              </div>
              <div className="relative">
                <textarea 
                  className="w-full bg-bg-dark border border-white/10 rounded-xl p-4 text-sm text-slate-300 h-40 focus:outline-none focus:border-primary"
                  placeholder="O describe el proceso aquí paso a paso..."
                  defaultValue="Proceso de cobro de tips extras en JW Marriott..."
                />
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full btn-primary py-4"
              >
                {analyzing ? 'Analizando con IA...' : 'ANALIZAR PROCESO'}
              </button>
            </div>
          </div>

          {result && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-6 border-l-4 border-l-emerald-500"
            >
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Análisis Exitoso
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Se han detectado <strong>{result.steps.length} actividades</strong> y <strong>{new Set(result.steps.map((s:any) => s.lane)).size} roles</strong> distintos. El flujo es coherente y cumple con estándares BPMN.
              </p>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-6">
          {!result && !analyzing ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center glass-panel border-dashed">
              <FileCode className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-slate-500">Los resultados del análisis aparecerán aquí</p>
            </div>
          ) : analyzing ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center glass-panel">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-primary font-mono animate-pulse">Extrayendo lógica de negocio...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-panel p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Proceso Detectado</div>
                    <h2 className="text-2xl font-bold text-white mb-2">{result.name}</h2>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Código: {result.code}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {new Set(result.steps.map((s:any) => s.lane)).size} Roles</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadBPMN}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                    >
                      <Download className="w-4 h-4" /> DESCARGAR .BPMN
                    </button>
                    <button 
                      onClick={exportToExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> EXPORTAR EXCEL
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.steps.map((step: any, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedStepId(step.id)}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group",
                        selectedStepId === step.id 
                          ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" 
                          : "bg-white/5 border-white/5 hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors",
                        selectedStepId === step.id ? "bg-primary text-white" : "bg-slate-800 text-slate-500 group-hover:text-primary"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-primary/80 uppercase tracking-tighter mb-0.5">{step.lane}</div>
                        <div className="text-sm text-slate-200">{step.name}</div>
                      </div>
                      <ArrowRight className={cn(
                        "w-4 h-4 transition-all",
                        selectedStepId === step.id ? "text-primary translate-x-1" : "text-slate-700 opacity-0 group-hover:opacity-100"
                      )} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 bg-slate-900/50 border-primary/20">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Prompt para Diagramador (System Output)</h3>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(result.description)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md text-primary text-[10px] font-bold hover:bg-primary/20 transition-all"
                  >
                    <Copy className="w-3 h-3" /> COPIAR TEXTO
                  </button>
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-xs text-slate-300 leading-relaxed">
                  {result.description}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="glass-panel h-full flex flex-col overflow-hidden">
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setActivePropertyTab('basicos')}
                className={cn(
                  "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all",
                  activePropertyTab === 'basicos' ? "text-primary bg-primary/5 border-b-2 border-primary" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Básicos
              </button>
              <button 
                onClick={() => setActivePropertyTab('extendidos')}
                className={cn(
                  "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all",
                  activePropertyTab === 'extendidos' ? "text-primary bg-primary/5 border-b-2 border-primary" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Extendidos
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activePropertyTab === 'basicos' && !selectedStep ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-xs text-slate-500">Selecciona una actividad para editar sus propiedades básicas</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activePropertyTab === 'basicos' ? (
                    selectedStep && (
                      <>
                        <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          Nombre <AlertCircle className="w-3 h-3 opacity-50" />
                        </label>
                        <input 
                          type="text"
                          value={selectedStep.name}
                          onChange={(e) => updateStepProperty(selectedStep.id, 'name', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          Descripción <AlertCircle className="w-3 h-3 opacity-50" />
                        </label>
                        <textarea 
                          value={selectedStep.description}
                          onChange={(e) => updateStepProperty(selectedStep.id, 'description', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 focus:outline-none focus:border-primary resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          Ejecutantes <AlertCircle className="w-3 h-3 opacity-50" />
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={selectedStep.performers}
                            onChange={(e) => updateStepProperty(selectedStep.id, 'performers', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
                          />
                          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-slate-300">...</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          Responsable <AlertCircle className="w-3 h-3 opacity-50" />
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={selectedStep.accountable}
                            onChange={(e) => updateStepProperty(selectedStep.id, 'accountable', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
                          />
                          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-slate-300">...</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          Consultado <AlertCircle className="w-3 h-3 opacity-50" />
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={selectedStep.consulted}
                            onChange={(e) => updateStepProperty(selectedStep.id, 'consulted', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
                          />
                          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-slate-300">...</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          Informado <AlertCircle className="w-3 h-3 opacity-50" />
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={selectedStep.informed}
                            onChange={(e) => updateStepProperty(selectedStep.id, 'informed', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
                          />
                          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-slate-300">...</button>
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  <div className="space-y-8 pb-12">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Atributos del Proceso</h4>
                        <p className="text-[10px] text-slate-400 italic">Propiedades globales del modelo</p>
                      </div>
                      <button className="text-[10px] text-primary hover:underline font-bold">Adicionar nuevo atributo extendido</button>
                    </div>
                    
                    {/* 1. Objetivo */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                        1. Objetivo <Search className="w-3 h-3 opacity-30 cursor-pointer" />
                      </label>
                      <textarea 
                        value={result.objective}
                        onChange={(e) => updateProcessProperty('objective', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    {/* 2. Alcance */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">2. Alcance</label>
                      <textarea 
                        value={result.scope}
                        onChange={(e) => updateProcessProperty('scope', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    {/* 3. Fundamento */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">3. Fundamento</label>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Documentos (cr</th>
                              <th className="px-2 py-1.5">Documentos externos: Requi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.foundation.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10">
                                  <input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.docCr} onChange={(e) => updateProcessListItem('foundation', idx, 'docCr', e.target.value)} />
                                </td>
                                <td className="p-0">
                                  <input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.docExt} onChange={(e) => updateProcessListItem('foundation', idx, 'docExt', e.target.value)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('foundation', { docCr: '', docExt: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Responsable del */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">4. Responsable del</label>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Responsable del proces</th>
                              <th className="px-2 py-1.5">Ingeniero de Proces</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.processOwners.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10">
                                  <input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.owner} onChange={(e) => updateProcessListItem('processOwners', idx, 'owner', e.target.value)} />
                                </td>
                                <td className="p-0">
                                  <input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.engineer} onChange={(e) => updateProcessListItem('processOwners', idx, 'engineer', e.target.value)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('processOwners', { owner: '', engineer: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Definiciones */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">4. Definiciones</label>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Término</th>
                              <th className="px-2 py-1.5">Descripción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.definitions.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10">
                                  <input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.term} onChange={(e) => updateProcessListItem('definitions', idx, 'term', e.target.value)} />
                                </td>
                                <td className="p-0">
                                  <input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.desc} onChange={(e) => updateProcessListItem('definitions', idx, 'desc', e.target.value)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('definitions', { term: '', desc: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Desarrollo de */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">4. Desarrollo de</label>
                      <textarea 
                        value={result.development}
                        onChange={(e) => updateProcessProperty('development', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 h-24 focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    {/* 5. Indicadores */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">5. Indicadores KPI</label>
                        <BarChart className="w-3 h-3 text-primary opacity-50" />
                      </div>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Indicador</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Meta</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Frec.</th>
                              <th className="px-2 py-1.5">Fuente</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.indicators.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.name} onChange={(e) => updateProcessListItem('indicators', idx, 'name', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.goal} onChange={(e) => updateProcessListItem('indicators', idx, 'goal', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.frequency} onChange={(e) => updateProcessListItem('indicators', idx, 'frequency', e.target.value)} /></td>
                                <td className="p-0"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.source} onChange={(e) => updateProcessListItem('indicators', idx, 'source', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('indicators', { name: '', goal: '', frequency: '', source: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* 6. Matriz de Riesgos */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">6. Matriz de Riesgos</label>
                        <ShieldAlert className="w-3 h-3 text-red-400 opacity-50" />
                      </div>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Riesgo</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Imp.</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Prob.</th>
                              <th className="px-2 py-1.5">Mitigación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.riskMatrix.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.risk} onChange={(e) => updateProcessListItem('riskMatrix', idx, 'risk', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.impact} onChange={(e) => updateProcessListItem('riskMatrix', idx, 'impact', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.probability} onChange={(e) => updateProcessListItem('riskMatrix', idx, 'probability', e.target.value)} /></td>
                                <td className="p-0"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.mitigation} onChange={(e) => updateProcessListItem('riskMatrix', idx, 'mitigation', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('riskMatrix', { risk: '', impact: '', probability: '', mitigation: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* 7. Recursos */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">7. Recursos</label>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Recurso Hu</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Materiales e l</th>
                              <th className="px-2 py-1.5">Medios de Com</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.resources.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.human} onChange={(e) => updateProcessListItem('resources', idx, 'human', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.material} onChange={(e) => updateProcessListItem('resources', idx, 'material', e.target.value)} /></td>
                                <td className="p-0"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.comm} onChange={(e) => updateProcessListItem('resources', idx, 'comm', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('resources', { human: '', material: '', comm: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* 8. Matriz (SIPOC) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">8. Matriz</label>
                      <div className="border border-white/10 rounded-lg overflow-x-auto">
                        <table className="w-full text-[10px] text-left min-w-[600px]">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              {['Pro', 'Entr', 'Cicl', 'Acti', 'Res', 'For', 'Sali', 'Clie'].map(h => (
                                <th key={h} className="px-2 py-1.5 border-r border-white/10 last:border-r-0">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.sipocMatrix.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                {['pro', 'entr', 'cicl', 'acti', 'res', 'for', 'sali', 'clie'].map(f => (
                                  <td key={f} className="p-0 border-r border-white/10 last:border-r-0">
                                    <input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item[f]} onChange={(e) => updateProcessListItem('sipocMatrix', idx, f, e.target.value)} />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('sipocMatrix', { pro: '', entr: '', cicl: '', acti: '', res: '', for: '', sali: '', clie: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* 9. Puntos de Control */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">9. Puntos de Control</label>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Punto de Cont</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Responsable</th>
                              <th className="px-2 py-1.5">Evidencia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.controlPoints.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.point} onChange={(e) => updateProcessListItem('controlPoints', idx, 'point', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.resp} onChange={(e) => updateProcessListItem('controlPoints', idx, 'resp', e.target.value)} /></td>
                                <td className="p-0"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.evid} onChange={(e) => updateProcessListItem('controlPoints', idx, 'evid', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('controlPoints', { point: '', resp: '', evid: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* Modificación */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modificación</label>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Fecha</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Versión</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Descripció</th>
                              <th className="px-2 py-1.5">Responsa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.modifications.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.date} onChange={(e) => updateProcessListItem('modifications', idx, 'date', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.ver} onChange={(e) => updateProcessListItem('modifications', idx, 'ver', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.desc} onChange={(e) => updateProcessListItem('modifications', idx, 'desc', e.target.value)} /></td>
                                <td className="p-0"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.resp} onChange={(e) => updateProcessListItem('modifications', idx, 'resp', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('modifications', { date: '', ver: '', desc: '', resp: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* 10. RACI */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">10. RACI</label>
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Ejecutant</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Responsa</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Consultad</th>
                              <th className="px-2 py-1.5">Informad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.raciMatrix.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.exec} onChange={(e) => updateProcessListItem('raciMatrix', idx, 'exec', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.resp} onChange={(e) => updateProcessListItem('raciMatrix', idx, 'resp', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.cons} onChange={(e) => updateProcessListItem('raciMatrix', idx, 'cons', e.target.value)} /></td>
                                <td className="p-0"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.info} onChange={(e) => updateProcessListItem('raciMatrix', idx, 'info', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('raciMatrix', { exec: '', resp: '', cons: '', info: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* Aprobaciones */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aprobaciones</label>
                      <div className="border border-white/10 rounded-lg overflow-x-auto">
                        <table className="w-full text-[10px] text-left min-w-[500px]">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-white/10">Elabora</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Revisad</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Verifica</th>
                              <th className="px-2 py-1.5 border-r border-white/10">Aproba</th>
                              <th className="px-2 py-1.5">Fecha ap</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.approvals.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.elab} onChange={(e) => updateProcessListItem('approvals', idx, 'elab', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.rev} onChange={(e) => updateProcessListItem('approvals', idx, 'rev', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.ver} onChange={(e) => updateProcessListItem('approvals', idx, 'ver', e.target.value)} /></td>
                                <td className="p-0 border-r border-white/10"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.app} onChange={(e) => updateProcessListItem('approvals', idx, 'app', e.target.value)} /></td>
                                <td className="p-0"><input className="w-full bg-transparent px-2 py-1 focus:outline-none" value={item.date} onChange={(e) => updateProcessListItem('approvals', idx, 'date', e.target.value)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-1 bg-white/5 flex justify-end gap-1">
                          <button onClick={() => addProcessListItem('approvals', { elab: '', rev: '', ver: '', app: '', date: '' })} className="p-1 hover:bg-white/10 rounded"><Layers className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

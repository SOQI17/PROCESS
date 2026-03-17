import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ProcessGenerator } from './components/ProcessGenerator';
import { MaturityDiagnostic } from './components/MaturityDiagnostic';
import { ProcessAnalyzer } from './components/ProcessAnalyzer';

export default function App() {
  const [activeTab, setActiveTab] = useState('diagramador');

  return (
    <div className="flex min-h-screen bg-bg-dark text-slate-200">
      <Sidebar activeId={activeTab} onNavigate={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'diagramador' && <ProcessGenerator />}
          {activeTab === 'diagnostico' && <MaturityDiagnostic />}
          {activeTab === 'analyzer' && <ProcessAnalyzer />}
          {activeTab !== 'diagramador' && activeTab !== 'diagnostico' && activeTab !== 'analyzer' && (
            <div className="flex items-center justify-center h-full text-slate-500 uppercase tracking-widest text-sm">
              Módulo en desarrollo
            </div>
          )}
        </main>
      </div>
    </div>
  );
}



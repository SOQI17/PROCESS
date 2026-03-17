import React from 'react';
import { 
  LayoutDashboard, 
  Share2, 
  GitBranch, 
  FileText, 
  Search, 
  FileSearch,
  Settings,
  Zap,
  Target
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: 'General', id: 'general' },
  { icon: Zap, label: 'Diagramador de procesos', id: 'diagramador' },
  { icon: Target, label: 'Diagnóstico de Madurez', id: 'diagnostico' },
  { icon: FileSearch, label: 'Analizador de Procesos', id: 'analyzer' },
  { icon: GitBranch, label: 'Mapeo de Flujo de Valor', id: 'vsm' },
  { icon: FileText, label: 'Generador De Procedimientos', id: 'procedimientos' },
  { icon: Search, label: 'BPM Gap Analyzer', id: 'gap' },
];

export const Sidebar = ({ activeId, onNavigate }: { activeId: string, onNavigate: (id: string) => void }) => {
  return (
    <aside className="w-64 bg-bg-sidebar border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
          <Zap className="text-white w-5 h-5 fill-current" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Process organizer</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
              activeId === item.id 
                ? "bg-brand-blue/10 text-brand-blue" 
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4",
              activeId === item.id ? "text-brand-blue" : "text-slate-500 group-hover:text-slate-300"
            )} />
            {item.label}
          </button>
        ))}
      </nav>


      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/5 transition-colors">
          <Settings className="w-4 h-4" />
          Admin Panel
        </button>
      </div>
    </aside>
  );
};

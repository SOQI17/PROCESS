import React from 'react';
import { Bell, Coins, User } from 'lucide-react';

export const TopBar = () => {
  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-bg-dark/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <span>Dashboard</span>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Generador</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-brand-blue/10 px-3 py-1.5 rounded-full border border-brand-blue/20">
          <Coins className="w-4 h-4 text-brand-blue" />
          <span className="text-sm font-semibold text-brand-blue">555 Tokens</span>
        </div>

        <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-blue rounded-full border-2 border-bg-dark"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-bold text-sm">
            F
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white leading-none">Fabian G.</p>
            <p className="text-xs text-slate-500 mt-1">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

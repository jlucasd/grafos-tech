import React from 'react';
import { Home, Bell, ChevronRight } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
      <nav aria-label="Breadcrumb" className="flex">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="#" className="text-slate-400 hover:text-slate-500">
              <Home size={18} />
            </a>
          </li>
          <li className="text-slate-300">/</li>
          <li>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-700">
              Operações
            </a>
          </li>
          <li className="text-slate-300">/</li>
          <li>
            <span aria-current="page" className="text-sm font-medium text-slate-900">
              Leitura de Odômetro
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};
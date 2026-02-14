import React from 'react';
import { LayoutDashboard, Truck, Users, CheckCircle2, Settings, LogOut } from 'lucide-react';
import { ASSETS } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 hidden md:flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
            G
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Grafos Tech</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          viewName="dashboard"
          isActive={currentView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <NavItem 
          icon={<Truck size={20} />} 
          label="Frota" 
          viewName="fleet"
          isActive={currentView === 'fleet'}
          onClick={() => onNavigate('fleet')}
        />
        <NavItem 
          icon={<Users size={20} />} 
          label="Motoristas" 
          viewName="drivers"
          isActive={currentView === 'drivers'}
          onClick={() => onNavigate('drivers')}
        />
        <NavItem 
          icon={<CheckCircle2 size={20} />} 
          label="Verificações" 
          viewName="validation"
          isActive={currentView === 'validation'}
          onClick={() => onNavigate('validation')}
        />
        <NavItem 
          icon={<Settings size={20} />} 
          label="Configurações" 
          viewName="settings"
          isActive={currentView === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <img
            alt="User Profile"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
            src={ASSETS.avatar}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Carlos Silva</p>
            <p className="text-xs text-slate-500 truncate">Gerente de Frota</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  viewName: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};
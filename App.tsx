import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ValidationCard } from './components/ValidationCard';
import { FleetManager } from './components/FleetManager';
import { CheckCircle2 } from 'lucide-react';
import { MOCK_VEHICLES, Vehicle } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState('validation');
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);

  // --- CRUD Handlers for Vehicles ---
  const handleAddVehicle = (newVehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...newVehicleData,
      id: Math.random().toString(36).substr(2, 9) // Simple ID generation
    };
    setVehicles([...vehicles, newVehicle]);
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  // --- View Rendering Logic ---
  const renderContent = () => {
    switch (currentView) {
      case 'fleet':
        return (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Gestão de Frota</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Gerencie os veículos disponíveis para verificação e operações.
                </p>
              </div>
            </div>
            <FleetManager 
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
            />
          </div>
        );

      case 'validation':
        return (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Title & Status */}
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Verificação de Odômetro</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Valide a quilometragem do veículo comparando a foto do painel com a entrada manual.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                  Sistema Online
                </span>
              </div>
            </div>

            <ValidationCard vehicles={vehicles} />

            {/* Recent History */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-slate-900 mb-4">Histórico Recente</h2>
              <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                <ul role="list" className="divide-y divide-slate-200">
                  {[1, 2, 3].map((item) => (
                    <li key={item} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle2 size={20} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {vehicles.length > 0 ? `${vehicles[0].name} - ${vehicles[0].plate}` : 'Veículo Exemplo'}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            Validado em: 24/10/2023 - 14:30
                          </p>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Sucesso
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-700">Em Desenvolvimento</h2>
              <p className="mt-2">A página "{currentView}" estará disponível em breve.</p>
              <button 
                onClick={() => setCurrentView('validation')}
                className="mt-4 text-primary hover:underline"
              >
                Voltar para Verificações
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background-light">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
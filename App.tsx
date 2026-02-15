import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { ValidationCard } from './components/ValidationCard';
import { FleetManager } from './components/FleetManager';
import { UserManager } from './components/UserManager';
import { FiscalNoteValidator } from './components/FiscalNoteValidator';
import { CheckCircle2, FileText } from 'lucide-react';
import { MOCK_VEHICLES, MOCK_USERS, Vehicle, User, VerificationData } from './types';

export default function App() {
  // Authentication State - Start as null to force Login Screen on first access
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Data State
  const [currentView, setCurrentView] = useState('validation');
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [validationHistory, setValidationHistory] = useState<VerificationData[]>([]);

  // --- Auth Handlers ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Reset view to default upon login
    setCurrentView('validation');
  };

  const handleLogout = () => {
    // Clear user and sensitive session data
    setCurrentUser(null);
    setValidationHistory([]);
    setCurrentView('validation');
  };

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

  // --- CRUD Handlers for Users ---
  const handleAddUser = (newUserData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...newUserData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setUsers([...users, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  // --- Validation Handler ---
  const handleValidationComplete = (data: VerificationData) => {
    setValidationHistory(prev => [data, ...prev]);
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
      
      case 'users':
        return (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Usuários do Sistema</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Gerencie o acesso e permissões dos usuários administrativos.
                </p>
              </div>
            </div>
            <UserManager 
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
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

            <ValidationCard 
              vehicles={vehicles} 
              onValidationComplete={handleValidationComplete}
            />

            {/* Recent History */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-slate-900 mb-4">Histórico Recente</h2>
              <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                {validationHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p>Nenhuma verificação realizada nesta sessão.</p>
                  </div>
                ) : (
                  <ul role="list" className="divide-y divide-slate-200">
                    {validationHistory.map((item) => {
                      const vehicle = vehicles.find(v => v.id === item.vehicleId);
                      return (
                        <li key={item.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                <CheckCircle2 size={20} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {vehicle ? `${vehicle.name} - ${vehicle.plate}` : 'Veículo Desconhecido'}
                              </p>
                              <p className="text-sm text-slate-500 truncate">
                                Leitura: {item.manualMileage.toLocaleString('pt-BR')} km • Validado em: {new Date(item.imageDate).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Sucesso
                              </span>
                              <span className="text-xs text-slate-400">
                                IA: {(item.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );

      case 'fiscal-notes':
        return <FiscalNoteValidator />;

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

  // FORCE LOGIN: If no user is authenticated, render ONLY the Login screen.
  // This ensures the Login screen is the first thing seen when accessing the app.
  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  // If logged in, show Main App structure
  return (
    <div className="flex h-screen bg-background-light">
      <Sidebar 
        currentView={currentView} 
        currentUser={currentUser}
        onNavigate={setCurrentView} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
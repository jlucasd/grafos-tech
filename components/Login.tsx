import React, { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onResetPassword: (email: string, newPassword: string) => boolean;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, onResetPassword }) => {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Shared UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('grafos_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const clearStates = () => {
    setError('');
    setSuccess('');
    // Keep email if remembered
    if (!rememberMe) setEmail('');
    setPassword('');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        setError('E-mail não encontrado no sistema.');
        setIsLoading(false);
        return;
      }

      if (user.status === 'inactive') {
        setError('Este usuário está desativado. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      if (user.password === password) {
        // Handle Remember Me logic
        if (rememberMe) {
          localStorage.setItem('grafos_remember_email', email);
        } else {
          localStorage.removeItem('grafos_remember_email');
        }

        setSuccess('Credenciais válidas! Redirecionando...');
        setTimeout(() => {
          onLogin(user);
        }, 1000);
      } else {
        setError('Senha incorreta. Tente novamente.');
        setIsLoading(false);
      }
    }, 600);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 3) {
      setError('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const isReset = onResetPassword(resetEmail, newPassword);

      if (isReset) {
        setSuccess('Senha atualizada com sucesso! Você já pode logar.');
        setTimeout(() => {
            setView('login');
            setEmail(resetEmail); // Pre-fill login email
            setPassword('');
            setSuccess('');
            setIsLoading(false);
        }, 1500);
      } else {
        setError('E-mail não encontrado na base de dados.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-slate-900/90 z-10 mix-blend-multiply" />
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
          alt="Logistics and AI" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 flex flex-col justify-between p-12 h-full text-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border border-white/30">
              G
            </div>
            <span className="text-2xl font-bold tracking-tight">Grafos Tech</span>
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight">
              Inteligência Artificial aplicada à Logística
            </h1>
            <p className="text-lg text-slate-200">
              Automatize a gestão da sua frota, validação de documentos e controle de quilometragem com nossa plataforma de última geração.
            </p>
          </div>

          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} - Grafos Tech. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
            
            {/* Feedback Messages (Positioned for both views) */}
            {(error || success) && (
              <div className={`mb-4 rounded-lg p-4 border animate-in slide-in-from-top-2 ${
                error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {error ? <AlertCircle className="h-5 w-5 text-red-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
                        {error ? 'Atenção' : 'Sucesso'}
                    </h3>
                    <div className={`mt-1 text-sm ${error ? 'text-red-700' : 'text-green-700'}`}>
                        {error || success}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'login' ? (
                /* LOGIN FORM */
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-900">Bem-vindo</h2>
                        <p className="mt-2 text-slate-500">
                        Entre com suas credenciais para acessar o painel
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                        <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">
                            E-mail Corporativo
                            </label>
                            <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="voce@grafostech.com.br"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                            Senha
                            </label>
                            <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            </div>
                        </div>
                        
                        {/* Remember Me Checkbox */}
                        <div className="flex items-center">
                            <input
                              id="remember-me"
                              name="remember-me"
                              type="checkbox"
                              className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 cursor-pointer select-none">
                              Lembrar de mim
                            </label>
                        </div>
                        </div>

                        <div>
                        <button
                            type="submit"
                            disabled={isLoading || !!success}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                            success 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-primary hover:bg-primary-hover focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/30'
                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {isLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Autenticando...
                            </span>
                            ) : success ? (
                            <span className="flex items-center gap-2">
                                Entrando <ArrowRight size={18} />
                            </span>
                            ) : (
                            <span className="flex items-center gap-2">
                                <LogIn size={18} />
                                Acessar Sistema
                            </span>
                            )}
                        </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => { clearStates(); setView('forgot'); }}
                            className="text-sm text-slate-400 hover:text-primary transition-colors focus:outline-none"
                        >
                        Esqueceu sua senha?
                        </button>
                    </div>
                </div>
            ) : (
                /* FORGOT PASSWORD FORM */
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="text-center mb-8">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <KeyRound className="text-primary w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Redefinir Senha</h2>
                        <p className="mt-2 text-slate-500 text-sm">
                            Informe seu e-mail e a nova senha desejada para atualizar seu acesso.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleResetSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1">
                                    E-mail Cadastrado
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="seu@email.com"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
                                    Nova Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="new-password"
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Nova senha"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                                    Confirmar Nova Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Confirme a senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !!success}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-hover focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Atualizando...
                                    </span>
                                ) : (
                                    "Atualizar Senha"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => { clearStates(); setView('login'); }}
                            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            Voltar para Login
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
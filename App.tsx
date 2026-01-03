
import React, { useState } from 'react';
import { StoreProvider, useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users'; // Importar nueva página
import Settings from './pages/Settings';
import { LogIn, Lock, User, Loader2, AlertCircle, CloudOff } from 'lucide-react';

const AppContent: React.FC = () => {
  const { state, loading, login } = useStore();
  const [activePage, setActivePage] = useState('dashboard');
  const [username, setUsername] = useState('FO-ALEJANDRO');
  const [password, setPassword] = useState('123456');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);
    
    const { error } = await login(username, password);

    if (error) {
      setAuthError(error.message);
    }
    setIsAuthenticating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
        <p className="text-gray-500 font-bold animate-pulse">Iniciando Sistema Olga...</p>
      </div>
    );
  }

  if (!state.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-w-5xl w-full border border-primary-200">
          <div className="md:w-1/2 bg-primary-600 p-16 text-white flex flex-col justify-center items-center text-center">
            <div className="w-28 h-28 bg-white/20 rounded-[2.5rem] flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 shadow-xl">
              <span className="text-5xl font-black">FO</span>
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tighter">Frutería Olga</h1>
            <p className="text-primary-100 text-xl font-medium opacity-90">Gestión Administrativa Local & Cloud</p>
            <div className="mt-16 space-y-4 text-xs text-primary-200 uppercase tracking-[0.2em] font-black">
              <p>📍 Huánuco, Perú</p>
              <p>🔐 Credenciales de acceso activo</p>
            </div>
          </div>
          
          <div className="md:w-1/2 p-16 bg-white flex flex-col justify-center">
            <h2 className="text-4xl font-black mb-2 text-gray-900">Bienvenido</h2>
            <p className="text-gray-400 mb-10 text-lg">
              Identifícate para entrar al panel
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {authError && (
                <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-2xl border border-red-200 flex items-center gap-3">
                  <AlertCircle className="shrink-0" size={18} />
                  <p>{authError}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Nombre de Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                    <input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none transition-all text-gray-900 font-bold text-lg shadow-sm"
                      placeholder="Usuario"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none transition-all text-gray-900 font-bold text-lg shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-primary-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg"
              >
                {isAuthenticating ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <LogIn size={24} />
                )}
                {isAuthenticating ? 'Validando...' : 'Entrar al Sistema'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch(activePage) {
      case 'dashboard': return <Dashboard />;
      case 'sales': return <Sales />;
      case 'purchases': return <Purchases />;
      case 'products': return <Products />;
      case 'clients': return <Clients />;
      case 'suppliers': return <Suppliers />;
      case 'users': return <Users />; // Nueva ruta Usuarios
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;

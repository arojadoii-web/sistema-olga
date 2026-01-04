
import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  LayoutDashboard, ShoppingCart, Truck, Apple, Users, Briefcase, Settings, 
  Menu, X, LogOut, Moon, Sun, DollarSign, Wallet, Bell, Search, PlusCircle,
  Cloud, CloudOff, RefreshCw, UserCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const { state, isCloudConnected, setTheme, setCurrency, logout, refreshCloudData } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCloudData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Ventas', icon: ShoppingCart },
    { id: 'purchases', label: 'Compras', icon: Truck },
    { id: 'products', label: 'Productos', icon: Apple },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'suppliers', label: 'Proveedores', icon: Briefcase },
    { id: 'users', label: 'Usuarios', icon: UserCircle },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden font-sans">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Optimizado para touch */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out shrink-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center justify-between md:justify-start gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary-600/20">
                FO
              </div>
              <div>
                <h1 className="font-black text-xl leading-tight tracking-tighter">Frutería Olga</h1>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Admin Cloud</span>
              </div>
            </div>
            <button className="md:hidden p-3 -mr-2 text-gray-400 hover:text-red-500 transition-colors" onClick={() => setSidebarOpen(false)}>
              <X size={28} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2 custom-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95
                  ${activePage === item.id 
                    ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                `}
              >
                <item.icon size={22} strokeWidth={activePage === item.id ? 2.5 : 2} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 text-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-400 active:scale-90 transition-transform flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={26} />
            </button>
            
            <button 
              onClick={handleRefresh}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                !isCloudConnected 
                  ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden xs:inline">{!isCloudConnected ? 'Local' : 'Nube'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setTheme(state.theme === 'light' ? 'dark' : 'light')}
              className="p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all flex items-center justify-center"
            >
              {state.theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            
            <div className="h-8 w-px bg-gray-100 dark:bg-gray-700 mx-1 hidden xs:block" />
            
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{state.user?.name.split(' ')[0]}</p>
                <p className="text-[10px] text-primary-600 font-black uppercase mt-1 tracking-tighter">{state.user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-600 overflow-hidden flex items-center justify-center text-white font-black border-2 border-white dark:border-gray-700 shadow-md shrink-0">
                {state.user?.photo ? (
                  <img src={state.user.photo} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  state.user?.name.charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

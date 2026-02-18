
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Product, Client, Supplier, Sale, Purchase, Currency, UserRole, SaleStatus, SystemUser, OperationalTask, IdentityApiConfig } from './types';
import { supabase } from './supabaseClient';

interface StoreContextType {
  state: AppState;
  loading: boolean;
  isCloudConnected: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrency: (currency: Currency) => void;
  setIdentityConfig: (config: IdentityApiConfig) => void;
  login: (username: string, password: string) => Promise<{error: any}>;
  logout: () => Promise<void>;
  addSystemUser: (user: SystemUser) => Promise<void>;
  updateSystemUser: (user: SystemUser) => Promise<void>;
  deleteSystemUser: (id: string) => Promise<void>;
  updateUserPassword: (id: string, newPassword: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  cancelSale: (id: string) => Promise<void>;
  addPurchase: (purchase: Purchase) => Promise<void>;
  cancelPurchase: (id: string) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  addTask: (task: OperationalTask) => Promise<void>;
  updateTask: (task: OperationalTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshCloudData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_USER: SystemUser = {
  id: 'master-1',
  name: 'Alejandro Miranda',
  dni: '00000000',
  phone: '999888777',
  functions: 'Administración Total',
  username: 'FO-ALEJANDRO',
  password: '123456',
  role: 'Administrador',
  active: true
};

const DEFAULT_IDENTITY_CONFIG: IdentityApiConfig = {
  dniUrl: 'https://dniruc.apisperu.com/api/v1/dni',
  rucUrl: 'https://dniruc.apisperu.com/api/v1/ruc',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFyZGRlc2lnbmFsZUBnbWFpbC5jb20ifQ.ZqPNOwUdOuYhHmrQTZ0BPg_73Kl7PYuc12MkUMh6ud0'
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [state, setState] = useState<AppState>({
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    currency: (localStorage.getItem('currency') as Currency) || 'PEN',
    exchangeRate: 3.75,
    identityApi: JSON.parse(localStorage.getItem('identity_config') || JSON.stringify(DEFAULT_IDENTITY_CONFIG)),
    user: null,
    users: [INITIAL_USER],
    products: [],
    clients: [],
    suppliers: [],
    sales: [],
    purchases: [],
    tasks: [],
  });

  const internalSaveToLocal = (updatedState: AppState) => {
    try {
      const dataToSave = {
        products: updatedState.products || [],
        clients: updatedState.clients || [],
        suppliers: updatedState.suppliers || [],
        sales: updatedState.sales || [],
        purchases: updatedState.purchases || [],
        users: updatedState.users || [INITIAL_USER],
        tasks: updatedState.tasks || [],
      };
      localStorage.setItem('olga_backup_data', JSON.stringify(dataToSave));
    } catch (e) {}
  };

  const loadLocalData = () => {
    const saved = localStorage.getItem('olga_backup_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setState(prev => ({ ...prev, ...data }));
      } catch (e) {}
    }
  };

  useEffect(() => {
    const init = async () => {
      loadLocalData();
      const localUser = localStorage.getItem('olga_logged_user');
      if (localUser) {
        setState(prev => ({ ...prev, user: JSON.parse(localUser) }));
        await fetchAllData();
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchAllData = async () => {
    try {
      const [p, c, s, sa, pu, u, t] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('purchases').select('*').order('date', { ascending: false }),
        supabase.from('users').select('*').order('name'),
        supabase.from('tasks').select('*').order('date', { ascending: true })
      ]);

      setState(prev => {
        const updated = {
          ...prev,
          products: p.data || [],
          clients: c.data || [],
          suppliers: s.data || [],
          sales: sa.data || [],
          purchases: pu.data || [],
          users: u.data || prev.users,
          tasks: t.data || []
        };
        internalSaveToLocal(updated);
        return updated;
      });
      setIsCloudConnected(true);
    } catch (e) {
      setIsCloudConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // CLIENTES
  const addClient = async (client: Client) => {
    setState(prev => {
      const updated = { ...prev, clients: [client, ...prev.clients] };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('clients').insert([client]);
  };

  const updateClient = async (client: Client) => {
    setState(prev => {
      const updated = { ...prev, clients: prev.clients.map(c => c.id === client.id ? client : c) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('clients').update(client).eq('id', client.id);
  };

  const deleteClient = async (id: string) => {
    const targetId = String(id).trim();
    setState(prev => {
      const updated = { ...prev, clients: prev.clients.filter(c => String(c.id).trim() !== targetId) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('clients').delete().eq('id', isNaN(Number(targetId)) ? targetId : Number(targetId));
  };

  // PRODUCTOS
  const addProduct = async (p: Product) => {
    setState(prev => {
      const updated = { ...prev, products: [p, ...prev.products] };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('products').insert([p]);
  };

  const updateProduct = async (p: Product) => {
    setState(prev => {
      const updated = { ...prev, products: prev.products.map(x => x.id === p.id ? p : x) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('products').update(p).eq('id', p.id);
  };

  const deleteProduct = async (id: string) => {
    const targetId = String(id).trim();
    setState(prev => {
      const updated = { ...prev, products: prev.products.filter(x => String(x.id).trim() !== targetId) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('products').delete().eq('id', isNaN(Number(targetId)) ? targetId : Number(targetId));
  };

  // PROVEEDORES
  const addSupplier = async (s: Supplier) => {
    setState(prev => {
      const updated = { ...prev, suppliers: [s, ...prev.suppliers] };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('suppliers').insert([s]);
  };

  const updateSupplier = async (s: Supplier) => {
    setState(prev => {
      const updated = { ...prev, suppliers: prev.suppliers.map(x => x.id === s.id ? s : x) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('suppliers').update(s).eq('id', s.id);
  };

  const deleteSupplier = async (id: string) => {
    const targetId = String(id).trim();
    setState(prev => {
      const updated = { ...prev, suppliers: prev.suppliers.filter(x => String(x.id).trim() !== targetId) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('suppliers').delete().eq('id', isNaN(Number(targetId)) ? targetId : Number(targetId));
  };

  // VENTAS
  const addSale = async (s: Sale) => {
    setState(prev => {
      const updated = { ...prev, sales: [s, ...prev.sales] };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('sales').insert([s]);
  };

  const updateSale = async (s: Sale) => {
    setState(prev => {
      const updated = { ...prev, sales: prev.sales.map(x => x.id === s.id ? s : x) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('sales').update(s).eq('id', s.id);
  };

  const cancelSale = async (id: string) => {
    setState(prev => {
      const updated = { ...prev, sales: prev.sales.map(x => x.id === id ? { ...x, saleStatus: 'Anulado' } : x) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('sales').update({ saleStatus: 'Anulado' }).eq('id', id);
  };

  // COMPRAS
  const addPurchase = async (p: Purchase) => {
    setState(prev => {
      const updated = { ...prev, purchases: [p, ...prev.purchases] };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('purchases').insert([p]);
  };

  const cancelPurchase = async (id: string) => {
    setState(prev => {
      const updated = { ...prev, purchases: prev.purchases.map(x => x.id === id ? { ...x, status: 'Anulado' } : x) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('purchases').update({ status: 'Anulado' }).eq('id', id);
  };

  const deletePurchase = async (id: string) => {
    const targetId = String(id).trim();
    setState(prev => {
      const updated = { ...prev, purchases: prev.purchases.filter(x => String(x.id).trim() !== targetId) };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('purchases').delete().eq('id', isNaN(Number(targetId)) ? targetId : Number(targetId));
  };

  // USUARIOS
  const addSystemUser = async (user: SystemUser) => {
    setState(prev => ({ ...prev, users: [...prev.users, user] }));
    await supabase.from('users').insert([user]);
  };

  const updateSystemUser = async (user: SystemUser) => {
    setState(prev => ({ ...prev, users: prev.users.map(u => u.id === user.id ? user : u) }));
    await supabase.from('users').update(user).eq('id', user.id);
  };

  const deleteSystemUser = async (id: string) => {
    setState(prev => ({ ...prev, users: prev.users.filter(u => String(u.id) !== String(id)) }));
    await supabase.from('users').delete().eq('id', id);
  };

  const updateUserPassword = async (id: string, pw: string) => {
    const u = state.users.find(x => x.id === id);
    if (u) await updateSystemUser({ ...u, password: pw });
  };

  // TAREAS
  const addTask = async (t: OperationalTask) => { setState(prev => ({ ...prev, tasks: [...prev.tasks, t] })); await supabase.from('tasks').insert([t]); };
  const updateTask = async (t: OperationalTask) => { setState(prev => ({ ...prev, tasks: prev.tasks.map(x => x.id === t.id ? t : x) })); await supabase.from('tasks').update(t).eq('id', t.id); };
  const deleteTask = async (id: string) => { setState(prev => ({ ...prev, tasks: prev.tasks.filter(x => x.id !== id) })); await supabase.from('tasks').delete().eq('id', id); };

  // OTROS
  const setTheme = (theme: 'light' | 'dark') => { setState(prev => ({ ...prev, theme })); localStorage.setItem('theme', theme); };
  const setCurrency = (currency: Currency) => { setState(prev => ({ ...prev, currency })); localStorage.setItem('currency', currency); };
  const setIdentityConfig = (config: IdentityApiConfig) => { setState(prev => ({ ...prev, identityApi: config })); localStorage.setItem('identity_config', JSON.stringify(config)); };
  
  const login = async (u: string, p: string) => {
    const found = state.users.find(user => user.username === u && user.password === p && user.active);
    if (found) {
      setState(prev => ({ ...prev, user: found }));
      localStorage.setItem('olga_logged_user', JSON.stringify(found));
      await fetchAllData();
      return { error: null };
    }
    return { error: { message: 'Credenciales inválidas' } };
  };

  const logout = async () => { localStorage.removeItem('olga_logged_user'); setState(prev => ({ ...prev, user: null })); };
  const refreshCloudData = async () => { setLoading(true); await fetchAllData(); };

  return (
    <StoreContext.Provider value={{ 
      state, loading, isCloudConnected, setTheme, setCurrency, setIdentityConfig, login, logout, 
      addSystemUser, updateSystemUser, deleteSystemUser, updateUserPassword, addProduct, updateProduct, deleteProduct,
      addClient, updateClient, deleteClient, addSupplier, updateSupplier, deleteSupplier, addSale, updateSale, cancelSale, 
      addPurchase, cancelPurchase, deletePurchase, addTask, updateTask, deleteTask, refreshCloudData
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Product, Client, Supplier, Sale, Purchase, Currency, UserRole, SaleStatus, SystemUser, OperationalTask } from './types';
import { supabase } from './supabaseClient';

interface StoreContextType {
  state: AppState;
  loading: boolean;
  isCloudConnected: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrency: (currency: Currency) => void;
  login: (username: string, password: string) => Promise<{error: any}>;
  logout: () => Promise<void>;
  addSystemUser: (user: SystemUser) => Promise<void>;
  updateSystemUser: (user: SystemUser) => Promise<void>;
  deleteSystemUser: (id: string) => Promise<void>;
  updateUserPassword: (id: string, newPassword: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  cancelSale: (id: string) => Promise<void>;
  addPurchase: (purchase: Purchase) => Promise<void>;
  cancelPurchase: (id: string) => Promise<void>;
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

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [state, setState] = useState<AppState>({
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    currency: (localStorage.getItem('currency') as Currency) || 'PEN',
    exchangeRate: 3.75,
    user: null,
    users: [INITIAL_USER],
    products: [],
    clients: [],
    suppliers: [],
    sales: [],
    purchases: [],
    tasks: [],
  });

  const sanitizeTasks = (tasks: any[]): OperationalTask[] => {
    return (tasks || []).map(t => ({
      ...t,
      completedDates: Array.isArray(t.completedDates) ? t.completedDates : []
    }));
  };

  const loadLocalData = () => {
    const saved = localStorage.getItem('olga_backup_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data && typeof data === 'object') {
          setState(prev => ({ 
            ...prev, 
            ...data,
            users: (Array.isArray(data.users) && data.users.length > 0) ? data.users : [INITIAL_USER],
            tasks: sanitizeTasks(data.tasks),
            sales: Array.isArray(data.sales) ? data.sales : [],
            products: Array.isArray(data.products) ? data.products : []
          }));
        }
      } catch (e) {
        console.error("Error loading local data:", e);
      }
    }
  };

  const internalSaveToLocal = (updatedState: AppState) => {
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
  };

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  useEffect(() => {
    const init = async () => {
      try {
        const localUser = localStorage.getItem('olga_logged_user');
        loadLocalData();
        if (localUser) {
          const user = JSON.parse(localUser);
          setState(prev => ({ ...prev, user }));
          await fetchAllData();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
        loadLocalData();
      }
    };
    init();
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        { data: products },
        { data: clients },
        { data: suppliers },
        { data: sales },
        { data: purchases },
        { data: cloudUsers },
        { data: tasks }
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('purchases').select('*').order('date', { ascending: false }),
        supabase.from('users').select('*').order('name'),
        supabase.from('tasks').select('*').order('date', { ascending: true })
      ]);

      const newStateData = {
        products: products || [],
        clients: clients || [],
        suppliers: suppliers || [],
        sales: sales || [],
        purchases: purchases || [],
        users: (Array.isArray(cloudUsers) && cloudUsers.length > 0) ? cloudUsers : state.users,
        tasks: sanitizeTasks(tasks)
      };
      
      setState(prev => {
        const updated = { 
          ...prev, 
          ...newStateData,
          user: newStateData.users.find(u => u.id === prev.user?.id) || prev.user
        };
        internalSaveToLocal(updated);
        return updated;
      });
      setIsCloudConnected(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsCloudConnected(false);
      loadLocalData();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const users = Array.isArray(state.users) ? state.users : [INITIAL_USER];
    const userMatch = users.find(u => u.username === username && u.password === password && u.active);
    if (userMatch) {
      setState(prev => ({ ...prev, user: userMatch }));
      localStorage.setItem('olga_logged_user', JSON.stringify(userMatch));
      await fetchAllData();
      return { error: null };
    }
    return { error: { message: 'Usuario o contraseña incorrectos' } };
  };

  const logout = async () => {
    localStorage.removeItem('olga_logged_user');
    setState(prev => ({ ...prev, user: null }));
    setIsCloudConnected(false);
  };

  const updateEntityState = (key: keyof AppState, newList: any[]) => {
    setState(prev => {
      const updated = { ...prev, [key]: newList };
      internalSaveToLocal(updated);
      return updated;
    });
  };

  const addSystemUser = async (user: SystemUser) => {
    updateEntityState('users', [...(state.users || []), user]);
    await supabase.from('users').insert([user]);
  };

  const updateSystemUser = async (user: SystemUser) => {
    const newUsers = (state.users || []).map(u => u.id === user.id ? user : u);
    setState(prev => {
      const updated = { ...prev, users: newUsers, user: prev.user?.id === user.id ? user : prev.user };
      if (prev.user?.id === user.id) localStorage.setItem('olga_logged_user', JSON.stringify(user));
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('users').update(user).eq('id', user.id);
  };

  const deleteSystemUser = async (id: string) => {
    if (id === 'master-1') return alert('No se puede eliminar el usuario maestro');
    updateEntityState('users', (state.users || []).filter(u => u.id !== id));
    await supabase.from('users').delete().eq('id', id);
  };

  const updateUserPassword = async (id: string, newPassword: string) => {
    const user = (state.users || []).find(u => u.id === id);
    if (user) await updateSystemUser({ ...user, password: newPassword });
  };

  const addProduct = async (product: Product) => {
    updateEntityState('products', [product, ...(state.products || [])]);
    await supabase.from('products').insert([product]);
  };

  const updateProduct = async (product: Product) => {
    updateEntityState('products', (state.products || []).map(p => p.id === product.id ? product : p));
    await supabase.from('products').update(product).eq('id', product.id);
  };

  const addClient = async (client: Client) => {
    updateEntityState('clients', [client, ...(state.clients || [])]);
    await supabase.from('clients').insert([client]);
  };

  const updateClient = async (client: Client) => {
    updateEntityState('clients', (state.clients || []).map(c => c.id === client.id ? client : c));
    await supabase.from('clients').update(client).eq('id', client.id);
  };

  const addSupplier = async (supplier: Supplier) => {
    updateEntityState('suppliers', [supplier, ...(state.suppliers || [])]);
    await supabase.from('suppliers').insert([supplier]);
  };

  const updateSupplier = async (supplier: Supplier) => {
    updateEntityState('suppliers', (state.suppliers || []).map(s => s.id === supplier.id ? supplier : s));
    await supabase.from('suppliers').update(supplier).eq('id', supplier.id);
  };

  const addSale = async (sale: Sale) => {
    const updatedProducts = (state.products || []).map(p => {
      const item = (sale.items || []).find(i => i.productId === p.id);
      return item ? { ...p, stock: Number(p.stock) - Number(item.quantity) } : p;
    });
    setState(prev => {
      const updated = { ...prev, sales: [sale, ...(prev.sales || [])], products: updatedProducts };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('sales').insert([sale]);
  };

  const updateSale = async (sale: Sale) => {
    updateEntityState('sales', (state.sales || []).map(s => s.id === sale.id ? sale : s));
    await supabase.from('sales').update(sale).eq('id', sale.id);
  };

  const cancelSale = async (id: string) => {
    updateEntityState('sales', (state.sales || []).map(s => s.id === id ? { ...s, saleStatus: 'Anulado' } : s));
    await supabase.from('sales').update({ saleStatus: 'Anulado' }).eq('id', id);
  };

  const addPurchase = async (purchase: Purchase) => {
    const updatedProducts = (state.products || []).map(p => {
      const item = (purchase.items || []).find(i => i.productId === p.id);
      return item ? { ...p, stock: Number(p.stock) + Number(item.quantity) } : p;
    });
    setState(prev => {
      const updated = { ...prev, purchases: [purchase, ...(prev.purchases || [])], products: updatedProducts };
      internalSaveToLocal(updated);
      return updated;
    });
    await supabase.from('purchases').insert([purchase]);
  };

  const cancelPurchase = async (id: string) => {
    updateEntityState('purchases', (state.purchases || []).map(p => p.id === id ? { ...p, status: 'Anulado' } : p));
    await supabase.from('purchases').update({ status: 'Anulado' }).eq('id', id);
  };

  const addTask = async (task: OperationalTask) => {
    // IMPORTANTE: Quitamos el ID temporal antes de enviar a Supabase para que la DB asigne uno real (UUID)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...taskData } = task; 
    
    const taskToSave = { 
      ...taskData, 
      completedDates: Array.isArray(task.completedDates) ? task.completedDates : [] 
    };
    
    try {
      const { data, error } = await supabase.from('tasks').insert([taskToSave]).select();
      
      if (error) {
        console.error("Error de Supabase al guardar tarea:", error);
        throw error;
      }

      const realTaskFromDB = (data && data[0]) ? data[0] : { ...taskToSave, id: task.id };

      setState(prev => {
        const updated = { ...prev, tasks: [...(prev.tasks || []), realTaskFromDB] };
        internalSaveToLocal(updated);
        return updated;
      });
      console.log("Tarea sincronizada correctamente en la nube.");
    } catch (err) {
      console.error("Fallo crítico en sincronización de tarea:", err);
      // Fallback local: Guardamos con el ID temporal si no hay nube
      setState(prev => {
        const updated = { ...prev, tasks: [...(prev.tasks || []), task] };
        internalSaveToLocal(updated);
        return updated;
      });
    }
  };

  const updateTask = async (task: OperationalTask) => {
    const taskToSave = { ...task, completedDates: Array.isArray(task.completedDates) ? task.completedDates : [] };
    setState(prev => {
      const updated = { ...prev, tasks: (prev.tasks || []).map(t => String(t.id) === String(task.id) ? taskToSave : t) };
      internalSaveToLocal(updated);
      return updated;
    });
    try {
      const { error } = await supabase.from('tasks').update(taskToSave).eq('id', task.id);
      if (error) console.error("Error al actualizar tarea en nube:", error);
    } catch (e) {
      console.error("Excepción al actualizar tarea:", e);
    }
  };

  const deleteTask = async (id: string) => {
    const taskIdString = String(id);
    
    setState(prev => {
      const currentTasks = Array.isArray(prev.tasks) ? prev.tasks : [];
      const filtered = currentTasks.filter(t => String(t.id) !== taskIdString);
      const updated = { ...prev, tasks: filtered };
      internalSaveToLocal(updated); 
      return updated;
    });

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) console.error("Error al borrar tarea en nube:", error);
    } catch (err) {
      console.error("Excepción al borrar tarea:", err);
    }
  };

  const refreshCloudData = async () => {
    await fetchAllData();
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }));
    localStorage.setItem('theme', theme);
  };
  
  const setCurrency = (currency: Currency) => {
    setState(prev => ({ ...prev, currency }));
    localStorage.setItem('currency', currency);
  };

  return (
    <StoreContext.Provider value={{ 
      state, loading, isCloudConnected, setTheme, setCurrency, login, logout, 
      addSystemUser, updateSystemUser, deleteSystemUser, updateUserPassword, addProduct, updateProduct, addClient, updateClient, 
      addSupplier, updateSupplier, addSale, updateSale, cancelSale, addPurchase, 
      cancelPurchase, addTask, updateTask, deleteTask, refreshCloudData
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

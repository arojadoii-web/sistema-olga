
import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LabelList, AreaChart, Area, Label
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, Landmark, CreditCard, Clock, 
  FileCheck, FileWarning, Apple, Briefcase, Activity, Store,
  Calendar as CalendarIcon, Plus, XCircle, CheckCircle2, ChevronLeft, ChevronRight, Edit2, Trash2
} from 'lucide-react';
import { OperationalTask, TaskType } from '../types';

const Dashboard: React.FC = () => {
  const { state, addTask, updateTask, deleteTask } = useStore();
  const [filter, setFilter] = useState<'Día' | 'Mes' | 'Año'>('Mes');
  
  const now = new Date();
  const todayStr = now.toLocaleDateString('sv-SE'); 
  const currentMonthStr = todayStr.substring(0, 7); 
  const currentYearStr = todayStr.substring(0, 4);

  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr); 
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [calendarView, setCalendarView] = useState(currentMonthStr);

  // Helper para verificar si una tarea está completada en una fecha específica
  const isTaskCompletedOnDate = (task: OperationalTask, dateStr: string) => {
    if (task.frequency === 'constante') {
      return (task.completedDates || []).includes(dateStr);
    }
    return task.status === 'realizada';
  };

  // Lógica mejorada para obtener tareas por fecha
  const getTasksForDate = (dateStr: string) => {
    const day = dateStr.split('-')[2];
    return (state.tasks || []).filter(t => {
      if (t.frequency === 'constante') {
        // Solo mostrar si es el mismo día del mes Y la fecha consultada es >= fecha creación
        const isSameDay = t.date.endsWith(`-${day}`);
        const isAfterCreation = dateStr >= t.date;
        return isSameDay && isAfterCreation;
      }
      return t.date === dateStr;
    });
  };

  const filteredSales = useMemo(() => {
    return state.sales.filter(s => {
      if (s.saleStatus === 'Anulado') return false;
      if (filter === 'Día') return s.date === todayStr;
      if (filter === 'Mes') return s.date.startsWith(currentMonthStr);
      return s.date.startsWith(currentYearStr);
    });
  }, [state.sales, filter, todayStr, currentMonthStr, currentYearStr]);

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const pendingSales = filteredSales.filter(s => s.saleStatus === 'Pendiente').reduce((acc, s) => acc + s.total, 0);
    const cancelledSales = filteredSales.filter(s => s.saleStatus === 'Cancelado').reduce((acc, s) => acc + s.total, 0);
    const tax = totalSales * 0.015;
    const clientCount = state.clients.length;
    const docsEmitidos = filteredSales.filter(s => s.docStatus === 'Emitido').length;
    const docsPendientes = filteredSales.filter(s => s.docStatus === 'Pendiente').length;
    const productCount = state.products.length;
    const supplierCount = state.suppliers.length;
    return { totalSales, pendingSales, cancelledSales, tax, clientCount, docsEmitidos, docsPendientes, productCount, supplierCount };
  }, [filteredSales, state.clients, state.products, state.suppliers]);

  // Barra de programación del mes: Solo tareas PENDIENTES en la fecha específica
  const monthlyTasksDisplay = useMemo(() => {
    const [y, m] = currentMonthStr.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const result: (OperationalTask & { displayDate: string })[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${currentMonthStr}-${String(i).padStart(2, '0')}`;
      const dayTasks = getTasksForDate(dStr);
      
      dayTasks
        .filter(t => !isTaskCompletedOnDate(t, dStr))
        .forEach(dt => result.push({ ...dt, displayDate: dStr }));
    }
    return result.sort((a, b) => a.displayDate.localeCompare(b.displayDate));
  }, [state.tasks, currentMonthStr]);

  const dynamicChartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (filter === 'Año') {
      const yearNum = Number(currentYearStr);
      return months.map((m, i) => {
        const monthSales = state.sales.filter(s => {
          const [y, mm] = s.date.split('-').map(Number);
          return s.saleStatus !== 'Anulado' && y === yearNum && mm === i + 1;
        });
        return { 
          name: m, 
          ventas: monthSales.reduce((acc, s) => acc + s.total, 0), 
          cantidad: monthSales.length 
        };
      });
    }
    const [y, m] = currentMonthStr.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${currentMonthStr}-${String(i).padStart(2, '0')}`;
      const daySales = state.sales.filter(s => s.saleStatus !== 'Anulado' && s.date === dStr);
      data.push({ name: String(i), ventas: daySales.reduce((acc, s) => acc + s.total, 0), cantidad: daySales.length });
    }
    return data;
  }, [state.sales, filter, currentMonthStr, currentYearStr]);

  const fruitSalesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSales.forEach(s => { 
      s.items.forEach(item => { 
        counts[item.productName] = (counts[item.productName] || 0) + item.quantity; 
      }); 
    });
    return Object.entries(counts)
      .map(([name, val]) => ({ name: name.toUpperCase(), val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);
  }, [filteredSales]);

  const topClientsData = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredSales.forEach(s => { 
      totals[s.clientName] = (totals[s.clientName] || 0) + s.total; 
    });
    return Object.entries(totals)
      .map(([name, total]) => ({ 
        name: name.split(' ')[0].toUpperCase(), 
        total 
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredSales]);

  const financialStatusData = [
    { name: 'Cancelado', value: stats.cancelledSales }, 
    { name: 'Pendiente', value: stats.pendingSales }
  ];

  const formatMoney = (val: number) => {
    const symbol = state.currency === 'PEN' ? 'S/' : '$';
    const amount = state.currency === 'PEN' ? val : val / state.exchangeRate;
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isDark = state.theme === 'dark';

  const getDayCircleStyle = (taskDate: string) => {
    if (taskDate === todayStr) {
      return 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-110';
    } else if (taskDate < todayStr) {
      return 'bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-300';
    } else {
      return 'bg-blue-50 text-blue-400 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  const handleToggleTaskStatus = (task: OperationalTask, dateStr: string) => {
    if (task.frequency === 'constante') {
      const currentCompleted = task.completedDates || [];
      const isDone = currentCompleted.includes(dateStr);
      const newCompleted = isDone 
        ? currentCompleted.filter(d => d !== dateStr)
        : [...currentCompleted, dateStr];
      updateTask({ ...task, completedDates: newCompleted });
    } else {
      updateTask({ ...task, status: task.status === 'pendiente' ? 'realizada' : 'pendiente' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Panel de Control</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">RESUMEN OPERATIVO FRUTERIA OLGA (ESTE {filter === 'Año' ? 'AÑO' : filter === 'Mes' ? 'MES' : 'DÍA'})</p>
        </div>
        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          {['Día', 'Mes', 'Año'].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${filter === f ? 'bg-primary-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PROGRAMACIÓN DEL MES */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <CalendarIcon size={18} className="text-primary-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Programación del Mes (Pendientes)</p>
        </div>
        <div className="flex overflow-x-auto pt-3 pb-4 gap-6 custom-scrollbar scroll-smooth">
          {monthlyTasksDisplay.length > 0 ? monthlyTasksDisplay.map((t, idx) => (
            <div key={`${t.id}-${idx}`} className="flex flex-col items-center text-center gap-2 min-w-[90px] group transition-all">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black transition-all ${getDayCircleStyle(t.displayDate)}`}>
                {t.displayDate.split('-')[2]}
              </div>
              <div className="flex flex-col items-center w-full px-1">
                <p className="text-[8px] font-black text-gray-800 dark:text-white uppercase tracking-tighter line-clamp-2 leading-none mb-1">
                  {t.type}
                </p>
                {t.description && (
                  <p className="text-[7px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight italic line-clamp-1">
                    {t.description}
                  </p>
                )}
              </div>
            </div>
          )) : (
            <div className="w-full text-center py-2"><p className="text-[10px] text-gray-400 font-bold italic uppercase">No hay tareas pendientes.</p></div>
          )}
        </div>
      </div>

      {/* 3. KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title={`VENTA ${filter === 'Año' ? 'AÑO' : filter === 'Mes' ? 'MES' : 'DÍA'}`} value={formatMoney(stats.totalSales)} icon={TrendingUp} color="green" />
        <KpiCard title="PENDIENTES COBRO" value={formatMoney(stats.pendingSales)} icon={Clock} color="yellow" />
        <KpiCard title="DOCS. EMITIDOS" value={stats.docsEmitidos.toString()} icon={FileCheck} color="blue" />
        <KpiCard title="DOCS. PENDIENTES" value={stats.docsPendientes.toString()} icon={FileWarning} color="red" />
        
        <KpiCard title="IMPUESTO ESTIMADO" value={formatMoney(stats.tax)} icon={Landmark} color="orange" />
        <KpiCard title="BASE DE CLIENTES" value={stats.clientCount.toString()} icon={Users} color="purple" />
        <KpiCard title="CANTIDAD FRUTAS" value={stats.productCount.toString()} icon={Apple} color="lightGreen" />
        <KpiCard title="PROVEEDORES" value={stats.supplierCount.toString()} icon={Briefcase} color="lightPurple" />
      </div>

      {/* 4. TENDENCIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-50 text-green-500 rounded-xl"><Activity size={18} /></div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tighter">Tendencia Cantidad ({filter})</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicChartData} margin={{ top: 40, right: 30, left: 10, bottom: 0 }}>
                <defs><linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} dy={10} padding={{ left: 20, right: 20 }} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="cantidad" stroke="#22c55e" strokeWidth={4} fillOpacity={1} fill="url(#colorQty)">
                  <LabelList dataKey="cantidad" position="top" offset={15} style={{ fontSize: 12, fill: '#22c55e', fontWeight: 'bold' }} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-50 text-green-500 rounded-xl"><Landmark size={18} /></div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tighter">Tendencia Monto ({filter})</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicChartData} margin={{ top: 40, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} dy={10} padding={{ left: 10, right: 10 }} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="ventas" fill="#22c55e" radius={[12, 12, 0, 0]} barSize={40}>
                  <LabelList dataKey="ventas" position="top" offset={15} formatter={(v: number) => v > 0 ? `S/ ${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''} style={{ fontSize: 10, fill: '#22c55e', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. ESTADO FINANCIERO Y FRUTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tighter mb-6">Estado Financiero ({filter})</h3>
          <div className="h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={financialStatusData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={5} 
                  dataKey="value"
                  labelLine={false}
                  label={({ name, value, x, y, textAnchor }) => {
                    if (name === 'Pendiente') {
                      return (
                        <text x={x} y={y} fill="#eab308" textAnchor={textAnchor} dominantBaseline="central" style={{ fontSize: '14px', fontWeight: '900' }}>
                          {formatMoney(value)}
                        </text>
                      );
                    }
                    return null;
                  }}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#eab308" />
                  <Label value={formatMoney(stats.cancelledSales)} position="center" dy={0} style={{ fontSize: '18px', fontWeight: '900', fill: '#22c55e' }} />
                </Pie>
                <Tooltip />
                <Legend iconType="circle" verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tighter mb-6">Frutas más Vendidas ({filter})</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={fruitSalesData} margin={{ top: 5, right: 40, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9ca3af' }} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="val" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={45}>
                  <LabelList dataKey="val" position="right" style={{ fontSize: 10, fill: '#3b82f6', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. TOP CLIENTES */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tighter mb-8">Top Clientes ({filter})</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topClientsData} margin={{ top: 30, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#9ca3af', fontWeight: 'bold'}} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="total" fill="#a855f7" radius={[12, 12, 0, 0]} barSize={80}>
                <LabelList dataKey="total" position="top" offset={15} formatter={(v: number) => `S/ ${v.toLocaleString('en-US', { minimumFractionDigits: 0 })}`} style={{ fontSize: 10, fill: '#a855f7', fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7. CALENDARIO OPERATIVO */}
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <OperationalCalendar 
          viewMonth={calendarView} 
          selectedDay={selectedDay}
          todayStr={todayStr}
          tasks={state.tasks} 
          getTasksForDate={getTasksForDate}
          onDayClick={(d) => { setSelectedDay(d); setShowTaskModal(true); }}
          onMonthChange={(newView) => setCalendarView(newView)}
          isDark={isDark} 
        />
      </div>

      {/* MODALES */}
      {showTaskModal && selectedDay && (
        <TaskManagementModal 
          day={selectedDay} 
          tasks={getTasksForDate(selectedDay)} 
          onClose={() => setShowTaskModal(false)}
          onAddTask={(type, desc, freq) => addTask({ id: Date.now().toString(), date: selectedDay, type, description: desc, status: 'pendiente', frequency: freq })}
          onUpdateTask={(task) => updateTask(task)}
          onToggleTask={(task) => handleToggleTaskStatus(task, selectedDay)}
          onDeleteTask={(id) => deleteTask(id)}
          isTaskCompletedOnDate={isTaskCompletedOnDate}
          isDark={isDark}
        />
      )}
    </div>
  );
};

const KpiCard: React.FC<{ title: string, value: string, icon: any, color: string }> = ({ title, value, icon: Icon, color }) => {
  const colorStyles: Record<string, string> = { 
    green: 'bg-green-50 text-green-500', 
    yellow: 'bg-yellow-50 text-yellow-500', 
    blue: 'bg-blue-50 text-blue-500', 
    red: 'bg-red-50 text-red-500',
    orange: 'bg-orange-50 text-orange-600', 
    purple: 'bg-purple-50 text-purple-600', 
    lightGreen: 'bg-emerald-50 text-emerald-600', 
    lightPurple: 'bg-indigo-50 text-indigo-600'
  };
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-all">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colorStyles[color] || 'bg-gray-50'}`}><Icon size={20} /></div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-tight">{title}</p>
        <h4 className="text-2xl font-black tracking-tighter text-gray-800 dark:text-white">{value}</h4>
      </div>
    </div>
  );
};

const OperationalCalendar: React.FC<{ 
  viewMonth: string, 
  selectedDay: string | null,
  todayStr: string,
  tasks: OperationalTask[], 
  getTasksForDate: (d: string) => OperationalTask[],
  onDayClick: (d: string) => void, 
  onMonthChange: (view: string) => void,
  isDark: boolean 
}> = ({ viewMonth, selectedDay, todayStr, tasks, getTasksForDate, onDayClick, onMonthChange, isDark }) => {
  const [year, month] = viewMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const handlePrev = () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    onMonthChange(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const handleNext = () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    onMonthChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  const getDotColor = (dateStr: string) => {
    if (dateStr === todayStr) return 'bg-green-500';
    if (dateStr < todayStr) return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calendario Operativo</h3>
        <div className="flex items-center gap-6">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all text-gray-400"><ChevronLeft size={20} /></button>
          <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tighter min-w-[120px] text-center">{monthNames[month - 1]} {year}</p>
          <button onClick={handleNext} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all text-gray-400"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-4">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase pb-2">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {dayNumbers.map(d => {
          const dateStr = `${viewMonth}-${String(d).padStart(2, '0')}`;
          const isSelected = selectedDay === dateStr;
          const isToday = dateStr === todayStr;
          const hasTask = getTasksForDate(dateStr).length > 0;
          return (
            <button key={d} onClick={() => onDayClick(dateStr)} className={`relative h-16 rounded-2xl flex flex-col items-center justify-center transition-all border ${isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/10 shadow-sm' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'} ${isToday && !isSelected ? 'bg-gray-100/50' : ''}`}>
              <span className={`text-[11px] font-black ${isToday ? 'text-primary-600 underline decoration-2 underline-offset-4' : 'text-gray-500'}`}>{d}</span>
              {hasTask && <div className={`mt-2 w-1.5 h-1.5 rounded-full ${getDotColor(dateStr)} animate-pulse shadow-sm`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TaskManagementModal: React.FC<{ 
  day: string, 
  tasks: OperationalTask[], 
  onClose: () => void, 
  onAddTask: (type: TaskType, desc: string, freq: 'unico' | 'constante') => void, 
  onUpdateTask: (t: OperationalTask) => void,
  onToggleTask: (t: OperationalTask) => void,
  onDeleteTask: (id: string) => void,
  isTaskCompletedOnDate: (t: OperationalTask, d: string) => boolean,
  isDark: boolean 
}> = ({ day, tasks, onClose, onAddTask, onUpdateTask, onToggleTask, onDeleteTask, isTaskCompletedOnDate, isDark }) => {
  const [editingTask, setEditingTask] = useState<OperationalTask | null>(null);
  const [newType, setNewType] = useState<TaskType>('TAREA ADMINISTRATIVA');
  const [newDesc, setNewDesc] = useState('');
  const [newFreq, setNewFreq] = useState<'unico' | 'constante'>('unico');

  useEffect(() => {
    if (editingTask) {
      setNewType(editingTask.type);
      setNewDesc(editingTask.description || '');
      setNewFreq(editingTask.frequency || 'unico');
    } else {
      setNewType('TAREA ADMINISTRATIVA');
      setNewDesc('');
      setNewFreq('unico');
    }
  }, [editingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      onUpdateTask({ ...editingTask, type: newType, description: newDesc, frequency: newFreq });
      setEditingTask(null);
    } else {
      onAddTask(newType, newDesc, newFreq);
      setNewDesc('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Agenda Operativa</h3>
             <p className="text-[10px] text-primary-600 font-bold">{day}</p>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><XCircle size={24} /></button>
        </div>
        
        <div className="space-y-4 mb-6 max-h-56 overflow-y-auto custom-scrollbar pr-2">
          {tasks.map(t => {
            const isDone = isTaskCompletedOnDate(t, day);
            return (
              <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl group">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onToggleTask(t)} 
                    title="Marcar como realizado"
                    className={`transition-all active:scale-90 ${isDone ? 'text-green-500' : 'text-gray-300 hover:text-primary-500'}`}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <div className={`flex flex-col ${isDone ? 'line-through opacity-40' : 'text-gray-700 dark:text-white'}`}>
                    <span className="text-[10px] font-black uppercase">{t.type} {t.frequency === 'constante' ? '(CONSTANTE)' : ''}</span>
                    {t.description && <span className="text-[9px] text-gray-400 leading-tight">{t.description}</span>}
                  </div>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingTask(t)} 
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    title="Editar tarea"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => { if(confirm('¿Eliminar esta tarea programada?')) onDeleteTask(t.id); }} 
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    title="Eliminar tarea"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && <p className="text-center text-[10px] text-gray-400 font-bold uppercase italic py-8">Sin tareas para este día</p>}
        </div>

        <form onSubmit={handleSubmit} className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest">{editingTask ? 'Modificando Tarea' : 'Nueva Tarea'}</span>
               {editingTask && (
                 <button type="button" onClick={handleCancelEdit} className="text-[9px] font-bold text-red-500 hover:underline">Cancelar Edición</button>
               )}
             </div>
             
             <select value={newType} onChange={e => setNewType(e.target.value as TaskType)} className="w-full p-3.5 rounded-2xl bg-gray-100 dark:bg-gray-700 text-[10px] font-black uppercase border-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all">
               <option value="CREAR BOLETAS">CREAR BOLETAS</option>
               <option value="CREAR FACTURAS">CREAR FACTURAS</option>
               <option value="PAGOS VENCIDOS">PAGOS VENCIDOS</option>
               <option value="TAREA ADMINISTRATIVA">TAREA ADMINISTRATIVA</option>
             </select>
             
             <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl">
                <button type="button" onClick={() => setNewFreq('unico')} className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${newFreq === 'unico' ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm' : 'text-gray-400'}`}>ÚNICO</button>
                <button type="button" onClick={() => setNewFreq('constante')} className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${newFreq === 'constante' ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm' : 'text-gray-400'}`}>CONSTANTE</button>
             </div>
             
             <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Breve descripción..." className="w-full p-3.5 rounded-2xl bg-gray-100 dark:bg-gray-700 text-[10px] outline-none border-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all" />
             
             <button type="submit" className={`w-full text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 shadow-lg transition-all ${editingTask ? 'bg-blue-600 shadow-blue-600/30' : 'bg-primary-600 shadow-primary-600/30'}`}>
               {editingTask ? 'Sincronizar Cambios' : '+ Programar Tarea'}
             </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
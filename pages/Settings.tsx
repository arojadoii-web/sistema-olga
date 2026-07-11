
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabaseClient';
import { 
  Moon, Sun, Database, CheckCircle2, XCircle, RefreshCw, 
  FileSpreadsheet, Download, User, Eye, EyeOff, 
  Camera, Landmark, DollarSign, Wallet, Key, Globe, ShieldCheck, Info
} from 'lucide-react';
import { Currency, IdentityApiConfig } from '../types';

declare var XLSX: any;

const Settings: React.FC = () => {
  const { state, setTheme, setCurrency, setIdentityConfig, updateSystemUser, updateUserPassword } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [apiConfig, setApiConfig] = useState<IdentityApiConfig>(state.identityApi);

  const [dbStatus, setDbStatus] = useState<Record<string, boolean | 'loading'>>({
    products: 'loading',
    clients: 'loading',
    suppliers: 'loading',
    sales: 'loading',
    purchases: 'loading',
    users: 'loading'
  });

  const checkTables = async () => {
    const tables = ['products', 'clients', 'suppliers', 'sales', 'purchases', 'users'];
    const results: any = {};
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        results[table] = !error;
      } catch {
        results[table] = false;
      }
    }
    setDbStatus(results);
  };

  useEffect(() => {
    checkTables();
  }, []);

  const handleSaveApis = (e: React.FormEvent) => {
    e.preventDefault();
    setIdentityConfig(apiConfig);
    alert('Configuración de APIs guardada correctamente.');
  };

  const handleUpdatePass = () => {
    if (newPass.length < 4) return alert('La contraseña debe tener al menos 4 caracteres');
    updateUserPassword(state.user?.id || '', newPass);
    setNewPass('');
    alert('Contraseña actualizada correctamente');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && state.user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateSystemUser({ ...state.user!, photo: base64String });
        alert('Foto de perfil actualizada.');
      };
      reader.readAsDataURL(file);
    }
  };

  const exportToExcel = async () => {
    if (typeof XLSX === 'undefined') return alert("Cargando librería de Excel...");
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      const formatDate = (dateStr?: string) => {
        if (!dateStr) return { formatted: '', year: '', month: '' };
        try {
          // If already format DD/MM/YYYY, return as is
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const parts = dateStr.split('/');
            const year = parts[2];
            const monthNum = parts[1];
            const monthNames = [
              "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ];
            const monthName = monthNames[parseInt(monthNum, 10) - 1] || monthNum;
            return { formatted: dateStr, year, month: monthName };
          }

          const dateObj = new Date(dateStr);
          if (isNaN(dateObj.getTime())) return { formatted: dateStr, year: '', month: '' };
          
          // Match standard YYYY-MM-DD
          const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            const year = match[1];
            const monthNum = match[2];
            const day = match[3];
            const monthNames = [
              "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ];
            const monthName = monthNames[parseInt(monthNum, 10) - 1] || monthNum;
            return {
              formatted: `${day}/${monthNum}/${year}`,
              year: year,
              month: monthName
            };
          }

          const d = String(dateObj.getDate()).padStart(2, '0');
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const y = String(dateObj.getFullYear());
          const monthNames = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
          ];
          const monthName = monthNames[dateObj.getMonth()] || m;
          return {
            formatted: `${d}/${m}/${y}`,
            year: y,
            month: monthName
          };
        } catch {
          return { formatted: dateStr, year: '', month: '' };
        }
      };

      const formatItems = (items: any[]) => {
        if (!items || items.length === 0) return '';
        return items.map((it: any) => `${it.quantity} ${it.unit || 'Kilos'} x ${it.productName || 'Producto'} (P.U. S/ ${it.unitPrice || 0} - Total S/ ${it.total || 0})`).join(' | ');
      };

      const mapProducts = (products: any[]) => {
        return products.map(p => {
          const dateInfo = formatDate(p.lastUpdate);
          return {
            'ID': p.id || '',
            'Nombre': p.name || '',
            'Categoría': p.category || '',
            'Unidad de Medida': p.unit || '',
            'Precio': p.price || 0,
            'Stock': p.stock || 0,
            'Activo': p.active ? 'Sí' : 'No',
            'Última Actualización': dateInfo.formatted,
            'Año Actualización': dateInfo.year,
            'Mes Actualización': dateInfo.month
          };
        });
      };

      const mapClients = (clients: any[]) => {
        return clients.map(c => ({
          'ID': c.id || '',
          'Nombre / Razón Social': c.name || '',
          'Tipo Documento': c.docType || '',
          'Número Documento': c.docNumber || '',
          'Contacto / Teléfono': c.contact || '',
          'Dirección': c.address || '',
          'Activo': c.active ? 'Sí' : 'No'
        }));
      };

      const mapSuppliers = (suppliers: any[]) => {
        return suppliers.map(s => ({
          'ID': s.id || '',
          'Nombre / Razón Social': s.name || '',
          'RUC': s.ruc || '',
          'Contacto': s.contact || '',
          'Correo Electrónico': s.email || '',
          'Dirección': s.address || '',
          'Activo': s.active ? 'Sí' : 'No'
        }));
      };

      const mapSales = (sales: any[]) => {
        const rows: any[] = [];
        sales.forEach(s => {
          const dateInfo = formatDate(s.date);
          const items = s.items || [];
          if (items.length === 0) {
            rows.push({
              'ID': s.id || '',
              'Fecha': dateInfo.formatted,
              'Año': dateInfo.year,
              'Mes': dateInfo.month,
              'Tipo de Comprobante': s.documentType || '',
              'Nro Comprobante': s.documentNumber || '',
              'Cliente': s.clientName || '',
              'Tipo Doc. Cliente': s.clientDocType || '',
              'Nro Doc. Cliente': s.clientDocNumber || '',
              'Servicio / Concepto': s.service || '',
              'Guía de Remisión': s.guideNumber || '',
              'Producto': '',
              'Cant.': '',
              'P. Unit': '',
              'Subtotal': '',
              'Importe Total de Venta': `S/ ${(Number(s.total) || 0).toFixed(2)}`,
              'Estado SUNAT': s.docStatus || '',
              'Estado Venta': s.saleStatus || '',
              'Estado Envío': s.sunatStatus || 'Pendiente'
            });
          } else {
            items.forEach((it: any) => {
              rows.push({
                'ID': s.id || '',
                'Fecha': dateInfo.formatted,
                'Año': dateInfo.year,
                'Mes': dateInfo.month,
                'Tipo de Comprobante': s.documentType || '',
                'Nro Comprobante': s.documentNumber || '',
                'Cliente': s.clientName || '',
                'Tipo Doc. Cliente': s.clientDocType || '',
                'Nro Doc. Cliente': s.clientDocNumber || '',
                'Servicio / Concepto': s.service || '',
                'Guía de Remisión': s.guideNumber || '',
                'Producto': it.productName || '',
                'Cant.': Number(it.quantity) || 0,
                'P. Unit': `S/ ${(Number(it.unitPrice) || 0).toFixed(2)}`,
                'Subtotal': `S/ ${(Number(it.total) || 0).toFixed(2)}`,
                'Importe Total de Venta': `S/ ${(Number(s.total) || 0).toFixed(2)}`,
                'Estado SUNAT': s.docStatus || '',
                'Estado Venta': s.saleStatus || '',
                'Estado Envío': s.sunatStatus || 'Pendiente'
              });
            });
          }
        });
        return rows;
      };

      const mapPurchases = (purchases: any[]) => {
        const rows: any[] = [];
        purchases.forEach(p => {
          const dateInfo = formatDate(p.date);
          const items = p.items || [];
          if (items.length === 0) {
            rows.push({
              'ID': p.id || '',
              'Fecha': dateInfo.formatted,
              'Año': dateInfo.year,
              'Mes': dateInfo.month,
              'Proveedor': p.supplierName || '',
              'Nro Comprobante': p.documentNumber || '',
              'Producto': '',
              'Cant.': '',
              'P. Unit': '',
              'Subtotal': '',
              'Importe Total Compra': `S/ ${(Number(p.total) || 0).toFixed(2)}`,
              'Estado': p.status || ''
            });
          } else {
            items.forEach((it: any) => {
              rows.push({
                'ID': p.id || '',
                'Fecha': dateInfo.formatted,
                'Año': dateInfo.year,
                'Mes': dateInfo.month,
                'Proveedor': p.supplierName || '',
                'Nro Comprobante': p.documentNumber || '',
                'Producto': it.productName || '',
                'Cant.': Number(it.quantity) || 0,
                'P. Unit': `S/ ${(Number(it.unitPrice) || 0).toFixed(2)}`,
                'Subtotal': `S/ ${(Number(it.total) || 0).toFixed(2)}`,
                'Importe Total Compra': `S/ ${(Number(p.total) || 0).toFixed(2)}`,
                'Estado': p.status || ''
              });
            });
          }
        });
        return rows;
      };

      const mapUsers = (users: any[]) => {
        return users.map(u => ({
          'ID': u.id || '',
          'Nombre Completo': u.name || '',
          'DNI': u.dni || '',
          'Teléfono': u.phone || '',
          'Funciones': u.functions || '',
          'Usuario': u.username || '',
          'Rol': u.role || '',
          'Activo': u.active ? 'Sí' : 'No'
        }));
      };

      const mapTasks = (tasks: any[]) => {
        return tasks.map(t => {
          const dateInfo = formatDate(t.date);
          return {
            'ID': t.id || '',
            'Fecha': dateInfo.formatted,
            'Año': dateInfo.year,
            'Mes': dateInfo.month,
            'Tipo de Tarea': t.type || '',
            'Descripción': t.description || '',
            'Estado': t.status === 'realizada' ? 'Realizada' : 'Pendiente',
            'Frecuencia': t.frequency === 'constante' ? 'Constante' : 'Único'
          };
        });
      };
      
      // EXPORTACIÓN DE TODAS LAS BASES DE DATOS DEL SISTEMA
      const datasets = [
        { name: 'Productos', rawData: state.products, mapFn: mapProducts },
        { name: 'Clientes', rawData: state.clients, mapFn: mapClients },
        { name: 'Proveedores', rawData: state.suppliers, mapFn: mapSuppliers },
        { name: 'Ventas', rawData: state.sales, mapFn: mapSales },
        { name: 'Compras', rawData: state.purchases, mapFn: mapPurchases },
        { name: 'Usuarios', rawData: state.users, mapFn: mapUsers },
        { name: 'Tareas', rawData: state.tasks, mapFn: mapTasks }
      ];

      datasets.forEach(set => {
        let mappedData: any[] = [];
        if (set.rawData && set.rawData.length > 0) {
          mappedData = set.mapFn(set.rawData);
        } else {
          // If no data, render headers using empty object
          const emptyMapped = set.mapFn([{}]);
          if (emptyMapped.length > 0) {
            const emptyObj: any = { ...emptyMapped[0] };
            Object.keys(emptyObj).forEach(k => { emptyObj[k] = ''; });
            mappedData = [emptyObj];
          } else {
            mappedData = [{}];
          }
        }

        // Limpieza de datos para evitar el error de longitud de celda en Excel (32,767 caracteres)
        // Esto afecta principalmente a las fotos de perfil en base64
        const sanitizedData = mappedData.map((row: any) => {
          const newRow: any = { ...row };
          Object.keys(newRow).forEach(key => {
            if (typeof newRow[key] === 'string' && newRow[key].length > 32000) {
              newRow[key] = "[IMAGEN O TEXTO DEMASIADO LARGO PARA EXCEL]";
            }
          });
          return newRow;
        });

        const ws = XLSX.utils.json_to_sheet(sanitizedData);

        // Styling headers using xlsx-js-style format
        if (ws['!ref']) {
          const range = XLSX.utils.decode_range(ws['!ref']);
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            const cell = ws[cellAddress];
            if (cell) {
              cell.s = {
                fill: {
                  patternType: 'solid',
                  fgColor: { rgb: '1B5628' } // Primary green: #1B5628
                },
                font: {
                  bold: true,
                  color: { rgb: 'FFFFFF' },
                  name: 'Segoe UI',
                  size: 11
                },
                alignment: {
                  horizontal: 'center',
                  vertical: 'center'
                }
              };
            }
          }
        }

        XLSX.utils.book_append_sheet(wb, ws, set.name);
      });

      XLSX.writeFile(wb, `Respaldo_Total_Olga_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Error al generar el archivo de respaldo. Compruebe la consola para más detalles.");
    } finally {
      setIsExporting(false);
    }
  };

  const [sunatStatus, setSunatStatus] = useState<any>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const fetchSunatStatus = async () => {
    try {
      const localCert = localStorage.getItem('sunat_certificate_base64_v2') || '';
      // Exclude large certificate Base64 string from GET headers to prevent HTTP payload/header limits
      const resp = await fetch('/api/sunat/status');
      const data = await resp.json();
      
      // Override UI certificate status if present in local browser storage
      if (localCert && data) {
        data.certificate = 'Uploaded';
      }
      setSunatStatus(data);
    } catch (err) {
      console.error("Error fetching SUNAT status", err);
    }
  };

  useEffect(() => {
    fetchSunatStatus();
  }, []);

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file in browser and persist to local storage for Vercel/Serverless state backup
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binaryString += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binaryString);
        localStorage.setItem('sunat_certificate_base64_v2', base64);
        console.log("Certificate successfully saved in browser local storage.");

        const formData = new FormData();
        formData.append('certificate', file);

        const resp = await fetch('/api/sunat/upload-cert', {
          method: 'POST',
          body: formData
        });

        if (resp.ok) {
          alert("Certificado .p12 subido y guardado correctamente en tu navegador.");
        } else {
          alert("Certificado guardado localmente en tu navegador para el sistema en línea.");
        }
        fetchSunatStatus();
      } catch (err) {
        console.error("Error processing certificate:", err);
        alert("Error al procesar el archivo del certificado.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const testSunatInvoice = async () => {
    if (!sunatStatus?.ruc || sunatStatus.ruc === 'Missing') {
      return alert("Debe configurar el RUC en el archivo .env primero.");
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const localCert = localStorage.getItem('sunat_certificate_base64_v2') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ certificateBase64: localCert });

      const resp = await fetch('/api/sunat/test-bill', { 
        method: 'POST',
        headers,
        body
      });
      const data = await resp.json();
      setTestResult(data);
      if (resp.ok) {
        alert("¡Éxito! Factura enviada a SUNAT.");
      } else {
        const errorMsg = data.error || "Error desconocido";
        console.error("SUNAT Error:", errorMsg);
      }
    } catch (err) {
      alert("Error al enviar factura de prueba. Verifique que el servidor esté activo.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Mi Perfil */}
        <div className="bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-2xl flex items-center justify-center">
              <User size={22} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white">Mi Perfil</h3>
          </div>
          
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <div className="w-36 h-36 bg-gray-100 rounded-[3rem] overflow-hidden border-8 border-gray-50 dark:border-gray-700 shadow-xl flex items-center justify-center">
                {state.user?.photo ? (
                  <img src={state.user.photo} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-gray-300">{state.user?.name.charAt(0)}</span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-3 bg-green-500 text-white rounded-2xl shadow-lg border-4 border-white dark:border-gray-800 hover:scale-110 transition-transform"
              >
                <Camera size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{state.user?.name}</h4>
            <span className="mt-2 px-4 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">{state.user?.role}</span>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Contraseña:</span>
              <div className="flex items-center gap-2">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-xl flex items-center gap-4">
                  <span className="text-sm font-black tracking-widest text-gray-800 dark:text-gray-200 min-w-[60px] text-center">
                    {showCurrentPass ? state.user?.password : '••••••'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)} 
                    className="text-gray-400 hover:text-green-500 transition-colors p-1"
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">ACTUALIZAR CLAVE</label>
              <div className="flex gap-3">
                <input 
                  type="password" 
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Escriba nueva contraseña"
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-sm font-bold" 
                />
                <button 
                  type="button"
                  onClick={handleUpdatePass}
                  className="px-8 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-green-500/20"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Personalización Global */}
        <div className="bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
              <Sun size={22} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white">Personalización Global</h3>
          </div>

          <div className="space-y-10">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-gray-800 dark:text-white leading-tight">Modo de Apariencia</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">INTERFAZ CLARA / OSCURA</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-1.5 rounded-2xl flex gap-1">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${state.theme === 'light' ? 'bg-white shadow-md text-green-600' : 'text-gray-400'}`}
                  >
                    <Sun size={14} /> CLARO
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${state.theme === 'dark' ? 'bg-gray-600 shadow-md text-green-600' : 'text-gray-400'}`}
                  >
                    <Moon size={14} /> OSCURO
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50 dark:border-gray-700 pt-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="font-black text-gray-800 dark:text-white leading-tight">Sistema de Moneda</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">SOLES (PEN) O DÓLARES (USD)</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-1.5 rounded-2xl flex gap-1">
                  <button 
                    onClick={() => setCurrency('PEN')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${state.currency === 'PEN' ? 'bg-white shadow-md text-green-600' : 'text-gray-400'}`}
                  >
                    <Wallet size={14} /> SOLES
                  </button>
                  <button 
                    onClick={() => setCurrency('USD')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${state.currency === 'USD' ? 'bg-white shadow-md text-green-600' : 'text-gray-400'}`}
                  >
                    <DollarSign size={14} /> USD
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/20 flex items-center gap-6">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm text-amber-500">
                  <Landmark size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">TIPO DE CAMBIO ACTUAL</p>
                  <p className="text-3xl font-black text-amber-700 dark:text-amber-400 tracking-tighter">S/ {state.exchangeRate.toFixed(2)}</p>
                  <p className="text-[9px] font-bold text-amber-500/70 mt-1 uppercase">Valor utilizado para conversiones automáticas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de la Base de Datos */}
        <div className="bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
              <Database size={22} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white">Estado de la Base de Datos</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Productos', key: 'products' },
              { label: 'Clientes', key: 'clients' },
              { label: 'Proveedores', key: 'suppliers' },
              { label: 'Ventas', key: 'sales' },
              { label: 'Compras', key: 'purchases' },
              { label: 'Usuarios', key: 'users' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${dbStatus[item.key] === true ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                </div>
                {dbStatus[item.key] === 'loading' ? (
                  <RefreshCw size={14} className="animate-spin text-gray-300" />
                ) : dbStatus[item.key] ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <XCircle size={18} className="text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Respaldo de Información */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-12 rounded-[3.5rem] shadow-2xl text-white flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
             <FileSpreadsheet size={180} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <FileSpreadsheet size={22} />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Respaldo de Información</h3>
          </div>
          <p className="text-green-50 font-medium mb-10 opacity-90 leading-relaxed">
            Descarga todos los registros del sistema (Productos, Clientes, Ventas, etc) en un archivo Excel compatible.
          </p>
          <button 
            type="button"
            onClick={exportToExcel}
            disabled={isExporting}
            className="w-full bg-white text-green-700 font-black py-6 rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="animate-spin" size={24} /> : <Download size={24} />}
            {isExporting ? 'Procesando...' : 'Descargar Todo a Excel'}
          </button>
        </div>

        {/* Servicios de Identidad (ApisPerú) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white">Servicio de Identidad (ApisPerú)</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">CONFIGURACIÓN DE CONSULTAS DNI Y RUC</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveApis} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">URL Consulta DNI</label>
                <input 
                  type="text" 
                  value={apiConfig.dniUrl}
                  onChange={e => setApiConfig({...apiConfig, dniUrl: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">URL Consulta RUC</label>
                <input 
                  type="text" 
                  value={apiConfig.rucUrl}
                  onChange={e => setApiConfig({...apiConfig, rucUrl: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest">API TOKEN (JWT)</label>
                <div className="relative">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" 
                    value={apiConfig.token}
                    onChange={e => setApiConfig({...apiConfig, token: e.target.value})}
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border-none text-[10px] font-bold outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Token JWT de ApisPerú..."
                  />
                </div>
              </div>
              
              <div className="pt-4 flex flex-col justify-end h-full">
                <button 
                  type="submit" 
                  className="w-full py-5 bg-green-500 text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <ShieldCheck size={20} />
                  Actualizar Conectividad
                </button>
              </div>
            </div>
          </form>

          <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-3xl flex items-start gap-4">
            <Info size={18} className="text-indigo-500 mt-1 shrink-0" />
            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase">
              Asegúrate de que el token sea el proporcionado por ApisPerú. Estos parámetros permiten al sistema buscar nombres y direcciones automáticamente para agilizar el registro de clientes.
            </p>
          </div>
        </div>

        {/* Facturación Electrónica SUNAT */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-sm border border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
              <Landmark size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white">Facturación Electrónica (SUNAT)</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">VINCULACIÓN DIRECTA SIN COSTO</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-8 rounded-3xl space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronización</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Entorno:</span>
                  <span className="text-xs font-black text-orange-500 uppercase">{sunatStatus?.environment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">RUC Configurado:</span>
                  <span className={`text-xs font-black uppercase ${sunatStatus?.ruc === 'Configured' ? 'text-green-500' : 'text-red-500'}`}>{sunatStatus?.ruc}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Certificado .p12:</span>
                  <span className={`text-xs font-black uppercase ${sunatStatus?.certificate === 'Uploaded' ? 'text-green-500' : 'text-red-500'}`}>{sunatStatus?.certificate}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 p-8 rounded-3xl space-y-6 flex flex-col justify-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</p>
              <div className="space-y-4">
                <button 
                  onClick={() => certInputRef.current?.click()}
                  className="w-full py-4 bg-white dark:bg-gray-800 border-2 border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Subir Certificado (.p12)
                </button>
                <input type="file" ref={certInputRef} onChange={handleCertUpload} className="hidden" accept=".p12,.pfx,application/x-pkcs12" />
                
                <button 
                  onClick={testSunatInvoice}
                  disabled={sunatStatus?.certificate !== 'Uploaded' || isTesting}
                  className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isTesting ? "animate-spin" : ""} /> 
                  {isTesting ? "Enviando..." : "Probar Envío (Beta)"}
                </button>

                {testResult && (
                  <div className={`mt-4 p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-40 ${testResult.error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                    <p className="font-black mb-2 uppercase">{testResult.error ? 'Error de Respuesta' : 'Respuesta Exitosa'}:</p>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/10 p-8 rounded-3xl flex items-start gap-4">
              <Info size={18} className="text-orange-500 mt-1 shrink-0" />
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase">
                  Para emitir legalmente, debe completar los campos <code className="text-orange-600">SUNAT_RUC</code>, <code className="text-orange-600">SUNAT_USERNAME</code> y <code className="text-orange-600">SUNAT_PASSWORD</code> en la configuración del servidor. 
                </p>
                <p className="text-[11px] font-black text-orange-700 dark:text-orange-400">
                  Importante: El usuario SOL secundario debe tener permisos de emisión de comprobantes electrónicos asignados.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;

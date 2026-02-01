
export type Currency = 'PEN' | 'USD';
export type UserRole = 'Administrador' | 'Gerente' | 'Vendedor';
export type SaleStatus = 'Cancelado' | 'Pendiente' | 'Anulado';
export type DocumentType = 'Boleta' | 'Factura';
export type ClientDocType = 'DNI' | 'RUC';
export type ServiceType = 'Venta de Frutas' | 'Alquiler de Local';
export type DocStatus = 'Emitido' | 'Pendiente';

export type TaskType = 'CREAR BOLETAS' | 'CREAR FACTURAS' | 'PAGOS VENCIDOS' | 'TAREA ADMINISTRATIVA';

export interface OperationalTask {
  id: string;
  date: string;
  type: TaskType;
  description?: string;
  status: 'pendiente' | 'realizada';
  frequency?: 'unico' | 'constante';
  completedDates?: string[]; // Almacena fechas YYYY-MM-DD donde se completó (para constantes)
}

export interface SystemUser {
  id: string;
  name: string;
  dni: string;
  phone: string;
  functions: string;
  username: string;
  password: string;
  role: UserRole;
  photo?: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: 'Kilos' | 'Unidad' | 'Caja';
  price: number;
  stock: number;
  active: boolean;
  lastUpdate?: string;
}

export interface Client {
  id: string;
  name: string;
  docType: ClientDocType;
  docNumber: string;
  contact: string;
  address: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  ruc: string;
  contact: string;
  email: string;
  address: string;
  active: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: 'Kilos' | 'Unidad' | 'Caja';
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  guideNumber: string;
  clientId: string;
  clientDocType: ClientDocType;
  clientDocNumber: string;
  clientName: string;
  contact: string;
  service: ServiceType;
  documentType: DocumentType;
  documentNumber: string;
  docStatus: DocStatus;
  saleStatus: SaleStatus;
  items: SaleItem[];
  total: number;
}

export interface PurchaseItem extends SaleItem {
  category: string;
  sellingPrice: number;
  initialStock: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  documentNumber: string;
  items: PurchaseItem[];
  total: number;
  status: 'Completado' | 'Anulado';
}

export interface AppState {
  theme: 'light' | 'dark';
  currency: Currency;
  exchangeRate: number;
  user: SystemUser | null;
  users: SystemUser[];
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  tasks: OperationalTask[];
}


export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  PURCHASES = 'PURCHASES',
  INVENTORY = 'INVENTORY',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  INVENTORY_AUDIT = 'INVENTORY_AUDIT',
  SERVICES = 'SERVICES',
  CASH = 'CASH',
  CLIENTS = 'CLIENTS',
  BUSINESS_EVOLUTION = 'BUSINESS_EVOLUTION',
  REPORT = 'REPORT',
  SUPPLIERS = 'SUPPLIERS', 
  BANK_ACCOUNTS = 'BANK_ACCOUNTS', 
  MANAGE_RESOURCES = 'MANAGE_RESOURCES', 
  HISTORY_QUERIES = 'HISTORY_QUERIES', 
  PURCHASES_HISTORY = 'PURCHASES_HISTORY',
  INGRESOS_HISTORY = 'INGRESOS_HISTORY',
  EGRESOS_HISTORY = 'EGRESOS_HISTORY',
  PRODUCT_HISTORY_HISTORY = 'PRODUCT_HISTORY_HISTORY',
  KARDEX_HISTORY = 'KARDEX_HISTORY',
  CREDIT_NOTE_HISTORY = 'CREDIT_NOTE_HISTORY',
  FINANCIAL_STRATEGY = 'FINANCIAL_STRATEGY',
  FIXED_EXPENSES = 'FIXED_EXPENSES',
  FIXED_INCOME = 'FIXED_INCOME',
  CONFIG_PRINTER = 'CONFIG_PRINTER',
  USER_PRIVILEGES = 'USER_PRIVILEGES',
  CREDIT_NOTE = 'CREDIT_NOTE',
  CLIENT_WALLET = 'CLIENT_WALLET',
  LOCATIONS = 'LOCATIONS',
  WHATSAPP = 'WHATSAPP', 
  QUOTATIONS = 'QUOTATIONS',
  DATABASE_CONFIG = 'DATABASE_CONFIG',
  MEDIA_EDITOR = 'MEDIA_EDITOR', 
  SUPER_ADMIN_DASHBOARD = 'SUPER_ADMIN_DASHBOARD',
  SALES_REPORT = 'SALES_REPORT',
  PROFIT_REPORT = 'PROFIT_REPORT',
  CASH_BOX_HISTORY = 'CASH_BOX_HISTORY',
  BANK_HISTORY = 'BANK_HISTORY',
  COMPANY_PROFILE = 'COMPANY_PROFILE',
  SYSTEM_DIAGNOSTICS = 'SYSTEM_DIAGNOSTICS'
}

export interface CashBoxSession {
    id: string;
    openingDate: string;
    closingDate: string;
    openingUser: string;
    closingUser: string;
    status: 'OPEN' | 'CLOSED';
    expectedOpening: number;
    countedOpening: number;
    openingDifference: number;
    openingNotes: string;
    confirmedDigitalAtOpen: Record<string, number>;
    expectedCashAtClose: number;
    countedCashAtClose: number;
    cashDifferenceAtClose: number;
    expectedDigitalAtClose: number;
    confirmedDigitalAtClose: Record<string, number>;
    closingNotes: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'VENDEDOR' | 'TECNICO' | 'CAJERO';
export type IndustryType = 'TECH' | 'PHARMA' | 'RETAIL'; 
export type PlanType = 'BASICO' | 'INTERMEDIO' | 'FULL';

export interface Tenant {
    id: string;
    companyName: string;
    industry: IndustryType;
    status: 'ACTIVE' | 'INACTIVE';
    subscriptionEnd: string;
    ownerName: string;
    phone: string;
    planType: PlanType;
    baseCurrency: string;
    creditBalance?: number;
}

export interface TenantInvoice {
    id: string;
    tenantId: string;
    tenantName: string;
    date: string;
    dueDate: string;
    amount: number;
    creditApplied: number;
    netAmount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    planType: PlanType;
    paymentLink?: string; 
    externalId?: string;  
    paddleId?: string;    
    paddleTransactionId?: string; // Nuevo: Para tracking de checkout completado
}

export interface MasterAccount {
    id: string;
    name: string;
    type: 'BANK' | 'VIRTUAL_WALLET' | 'PHYSICAL_CASH';
    currency: string;
    balance: number;
    accountNumber?: string;
}

export interface MasterMovement {
    id: string;
    date: string;
    time: string;
    type: 'Ingreso' | 'Egreso';
    accountId: string;
    accountName: string;
    amount: number;
    concept: string;
    reference?: string;
    tenantId?: string;
}

export interface SystemUser {
    id: string;
    username: string;
    fullName: string;
    email?: string;
    password?: string; 
    role: UserRole;
    active: boolean;
    permissions: string[];
    pin?: string; 
    avatar?: string;
    industry: IndustryType; 
    companyName: string; 
}

export interface AuthSession {
    user: SystemUser;
    businessName: string;
    token: string;
    baseCurrency: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  location?: string;
  brand?: string;
}

export interface CartItem extends Product {
  quantity: number;
  discount: number;
  total: number;
}

export interface Client {
  id: string;
  name: string;
  dni: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  province?: string;
  department?: string;
  creditLine: number;
  creditUsed: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  paymentScore: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  digitalBalance: number;
}

export interface Supplier {
  id: string;
  name: string;
  ruc: string;
  phone?: string;
  email?: string;
  address?: string;
  contactName?: string;
}

export interface Brand {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
}

export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    currency: string;
    alias?: string;
    useInSales: boolean;
    useInPurchases: boolean;
}

export interface SaleRecord {
    id: string;
    date: string;
    time: string;
    clientName: string;
    docType: string;
    total: number;
    currency: string;
    exchangeRate: number;
    items: CartItem[];
    paymentBreakdown: PaymentBreakdown;
    user: string;
}

export interface PurchaseRecord {
    id: string;
    date: string;
    time: string;
    supplierName: string;
    docType: string;
    total: number;
    currency: string;
    exchangeRate: number;
    items: CartItem[];
    paymentCondition: 'Contado' | 'Credito';
    user: string;
}

export interface StockMovement {
    id: string;
    date: string;
    time: string;
    productId: string;
    productName: string;
    type: 'ENTRADA' | 'SALIDA';
    quantity: number;
    currentStock: number;
    reference: string;
    user: string;
    unitCost?: number;
}

export interface ServiceProductItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ServiceOrder {
  id: string;
  entryDate: string;
  entryTime: string;
  client: string;
  clientPhone?: string;
  deviceModel: string;
  issue: string;
  status: 'Pendiente' | 'Reparado' | 'Entregado' | 'Devolucion';
  technician: string;
  receptionist: string;
  cost: number;
  usedProducts: ServiceProductItem[]; 
  exitDate?: string;
  exitTime?: string;
  color: string;
}

export type PaymentMethodType = 'Efectivo' | 'Yape' | 'Plin' | 'Yape/Plin' | 'Tarjeta' | 'Deposito' | 'Saldo Favor' | 'Transferencia';

export interface CashItemDetail {
    description: string;
    quantity: number;
    price: number;
}

export interface CashMovement {
  id: string;
  date: string;
  time: string;
  type: 'Ingreso' | 'Egreso';
  paymentMethod: PaymentMethodType;
  concept: string;
  referenceId?: string;
  accountId?: string;
  amount: number;
  currency?: string;
  user: string;
  relatedItems?: CashItemDetail[];
  financialType?: 'Fijo' | 'Variable';
  category?: string;
}

export interface PaymentBreakdown {
  cash: number;
  yape: number;
  card: number;
  bank: number;
  wallet?: number;
}

export interface GeoLocation {
    id: string;
    name: string;
    type: 'DEP' | 'PROV' | 'DIST';
    parentId?: string;
}

export interface Quotation {
    id: string;
    date: string;
    time: string;
    clientName: string;
    items: CartItem[];
    total: number;
}

export interface Message {
    id: string;
    text: string;
    image?: string; 
    sender: 'user' | 'me' | 'bot';
    time: string;
    status: 'sent' | 'delivered' | 'read';
}

export interface Chat {
    id: string;
    name: string;
    phone: string;
    avatar: string; 
    lastMessage: string;
    lastMessageTime: string;
    unread: number;
    messages: Message[];
}

export interface InventoryCountItem {
    productId: string;
    productName: string;
    systemStock: number;
    physicalCount: number;
    difference: number;
}

export interface InventoryHistorySession {
    id: string;
    date: string;
    time: string;
    user: string;
    status: 'DRAFT' | 'APPROVED' | 'ADJUSTED';
    items: InventoryCountItem[];
}

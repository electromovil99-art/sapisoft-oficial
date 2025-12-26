
import { Product, Client, ServiceOrder, CashMovement, GeoLocation, Category } from './types';

// --- DATE HELPER ---
// Using a helper to generate dates relative to today makes the demo data dynamic and ensures filters work.
const formatDate = (date: Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const fiveDaysAgo = new Date();
fiveDaysAgo.setDate(today.getDate() - 5);
const fifteenDaysAgo = new Date();
fifteenDaysAgo.setDate(today.getDate() - 15);
const twoMonthsAgo = new Date();
twoMonthsAgo.setMonth(today.getMonth() - 2);

// --- DATA SET 1: TECHNOLOGY (CELULARES) ---
export const TECH_PRODUCTS: Product[] = [
  { id: '1', code: '102136773', name: 'LCD+T. S7 EDGE DORADO C/M ORIG.', category: 'PANTALLAS', price: 320.00, cost: 250.00, stock: 5, location: 'LT11-F', brand: 'SAMSUNG' },
  { id: '2', code: '102586458', name: 'BATERIA IPHONE X ORIGINAL', category: 'BATERIAS', price: 85.00, cost: 60.00, stock: 12, location: 'BAT-01', brand: 'APPLE' },
  { id: '3', code: '102256745', name: 'PIN DE CARGA TIPO C GENERICA', category: 'REPUESTOS', price: 15.00, cost: 7.00, stock: 50, location: 'CAJ-22', brand: 'GENERICO' },
  { id: '4', code: '102266765', name: 'MICA DE VIDRIO 9D REDMI NOTE 10', category: 'ACCESORIOS', price: 20.00, cost: 5.00, stock: 30, location: 'EX-01', brand: 'XIAOMI' },
];

export const TECH_CATEGORIES: Category[] = [
    { id: '1', name: 'PANTALLAS' },
    { id: '2', name: 'BATERIAS' },
    { id: '3', name: 'REPUESTOS' },
    { id: '4', name: 'ACCESORIOS' },
    { id: '5', name: 'FLEX' },
];

// --- DATA SET 2: PHARMACY (FARMACIA) ---
export const PHARMA_PRODUCTS: Product[] = [
  { id: '101', code: 'FAR-001', name: 'PARACETAMOL 500MG X 100', category: 'GENERICOS', price: 8.00, cost: 4.50, stock: 200, location: 'EST-A1', brand: 'GENFAR' },
  { id: '102', code: 'FAR-002', name: 'AMOXICILINA 500MG', category: 'ANTIBIOTICOS', price: 1.50, cost: 0.80, stock: 150, location: 'EST-B2', brand: 'PORTUGAL' },
  { id: '103', code: 'FAR-003', name: 'APRONAX 550MG (CAJA)', category: 'ANTIINFLAMATORIOS', price: 25.00, cost: 18.00, stock: 40, location: 'VIT-01', brand: 'BAYER' },
  { id: '104', code: 'FAR-004', name: 'ENSURE ADVANCE VAINILLA', category: 'NUTRICION', price: 110.00, cost: 95.00, stock: 15, location: 'GOND-3', brand: 'ABBOTT' },
  { id: '105', code: 'FAR-005', name: 'PAÑALES HUGGIES TALLA G', category: 'CUIDADO PERSONAL', price: 45.00, cost: 35.00, stock: 30, location: 'ALM-2', brand: 'HUGGIES' },
];

export const PHARMA_CATEGORIES: Category[] = [
    { id: '1', name: 'GENERICOS' },
    { id: '2', name: 'DE MARCA' },
    { id: '3', name: 'CUIDADO PERSONAL' },
    { id: '4', name: 'NUTRICION' },
    { id: '5', name: 'ANTIBIOTICOS' },
];

// --- FIXED CATEGORIES ---
export const FIXED_EXPENSE_CATEGORIES: string[] = ['Alquiler de Local', 'Sueldos Personal', 'Internet / Teléfono', 'Luz / Agua', 'Software / Hosting', 'Pago Préstamo Banco', 'Contador / Legal'];
export const FIXED_INCOME_CATEGORIES: string[] = ['Membresías', 'Alquiler Subarriendo', 'Contratos Servicio Mensual'];


// --- SHARED MOCK DATA ---
export const MOCK_CLIENTS: Client[] = [
  { 
    id: '1', name: 'CLIENTE VARIOS', dni: '00000000', 
    creditLine: 0, creditUsed: 0, totalPurchases: 1540.50, paymentScore: 3, tags: ['General'], digitalBalance: 0,
    department: 'CUSCO', province: 'CUSCO', district: 'CUSCO'
  },
  { 
    id: '2', name: 'ALEXANDER GONZALES', dni: '73383858', phone: '933159551', email: 'alex@gmail.com',
    creditLine: 1000, creditUsed: 0, totalPurchases: 2450.00, paymentScore: 5, tags: ['VIP', 'Frecuente'], lastPurchaseDate: formatDate(yesterday), digitalBalance: 150.00,
    department: 'CUSCO', province: 'CUSCO', district: 'WANCHAQ', address: 'Av. La Cultura 200'
  }
];

export const MOCK_SERVICES: ServiceOrder[] = [
  { 
    id: '514490', 
    entryDate: formatDate(fiveDaysAgo), entryTime: '10:30',
    exitDate: formatDate(yesterday), exitTime: '16:00',
    client: 'ALEXANDER GONZALES', deviceModel: 'IPHONE 15 PRO MAX', issue: 'Cambio de Pantalla', 
    status: 'Entregado', technician: 'Isaac Quille', receptionist: 'Admin',
    cost: 830.00, color: '#10b981', usedProducts: []
  }
];

export const MOCK_CASH_MOVEMENTS: CashMovement[] = [
  { id: '1', date: formatDate(today), time: '09:23:23', type: 'Ingreso', paymentMethod: 'Efectivo', concept: 'Venta con Ticket Nro. 68031', amount: 150.00, user: 'Juan Vendedor', category: 'Venta', financialType: 'Variable' },
  { id: '2', date: formatDate(today), time: '11:15:00', type: 'Egreso', paymentMethod: 'Efectivo', concept: 'Almuerzo personal', amount: 25.00, user: 'Admin', category: 'Gastos Varios', financialType: 'Variable' },
  { id: '3', date: formatDate(yesterday), time: '14:30:00', type: 'Egreso', paymentMethod: 'Yape', concept: 'Compra Repuestos', amount: 80.00, user: 'Admin', category: 'Compra', financialType: 'Variable', accountId: '1' },
  { id: '4', date: formatDate(fiveDaysAgo), time: '10:00:00', type: 'Ingreso', paymentMethod: 'Tarjeta', concept: 'Servicio Técnico S21', amount: 250.00, user: 'Juan Vendedor', category: 'Servicio', financialType: 'Variable', accountId: '1' },
  { id: '5', date: formatDate(fifteenDaysAgo), time: '18:00:00', type: 'Egreso', paymentMethod: 'Efectivo', concept: 'Pago de Alquiler', amount: 500.00, user: 'Admin', category: 'Alquiler de Local', financialType: 'Fijo' },
  { id: '6', date: formatDate(twoMonthsAgo), time: '11:45:10', type: 'Ingreso', paymentMethod: 'Deposito', concept: 'Venta antigua #3451', amount: 320.00, user: 'Juan Vendedor', category: 'Venta', financialType: 'Variable', accountId: '1' },
];

// --- GENERACION DE UBIGEO PERU (Departamentos y Provincias) ---

const PERU_DATA = [
    { dep: "AMAZONAS", provs: ["CHACHAPOYAS", "BAGUA", "BONGARA", "CONDORCANQUI", "LUYA", "RODRIGUEZ DE MENDOZA", "UTCUBAMBA"] },
    { dep: "ANCASH", provs: ["HUARAZ", "AIJA", "ANTONIO RAYMONDI", "ASUNCION", "BOLOGNESI", "CARHUAZ", "CARLOS FERMIN FITZCARRALD", "CASMA", "CORONGO", "HUARI", "HUARMEY", "HUAYLAS", "MARISCAL LUZURIAGA", "OCROS", "PALLASCA", "POMABAMBA", "RECUAY", "SANTA", "SIHUAS", "YUNGAY"] },
    { dep: "APURIMAC", provs: ["ABANCAY", "ANDAHUAYLAS", "ANTABAMBA", "AYMARAES", "COTABAMBAS", "CHINCHEROS", "GRAU"] },
    { dep: "AREQUIPA", provs: ["AREQUIPA", "CAMANA", "CARAVELI", "CASTILLA", "CAYLLOMA", "CONDESUYOS", "ISLAY", "LA UNION"] },
    { dep: "AYACUCHO", provs: ["HUAMANGA", "CANGALLO", "HUANCA SANCOS", "HUANTA", "LA MAR", "LUCANAS", "PARINACOCHAS", "PAUCAR DEL SARA SARA", "SUCRE", "VICTOR FAJARDO", "VILCAS HUAMAN"] },
    { dep: "CAJAMARCA", provs: ["CAJAMARCA", "CAJABAMBA", "CELENDIN", "CHOTA", "CONTUMAZA", "CUTERVO", "HUALGAYOC", "JAEN", "SAN IGNACIO", "SAN MARCOS", "SAN MIGUEL", "SAN PABLO", "SANTA CRUZ"] },
    { dep: "CALLAO", provs: ["CALLAO"] },
    { dep: "CUSCO", provs: ["CUSCO", "ACOMAYO", "ANTA", "CALCA", "CANAS", "CANCHIS", "CHUMBIVILCAS", "ESPINAR", "LA CONVENCION", "PARURO", "PAUCARTAMBO", "QUISPICANCHI", "URUBAMBA"] },
    { dep: "HUANCAVELICA", provs: ["HUANCAVELICA", "ACOBAMBA", "ANGARAES", "CASTROVIRREYNA", "CHURCAMPA", "HUAYTARA", "TAYACAJA"] },
    { dep: "HUANUCO", provs: ["HUANUCO", "AMBO", "DOS DE MAYO", "HUACAYBAMBA", "HUAMALIES", "LEONCIO PRADO", "MARAÑON", "PACHITEA", "PUERTO INCA", "LAURICOCHA", "YAROWILCA"] },
    { dep: "ICA", provs: ["ICA", "CHINCHA", "NAZCA", "PALPA", "PISCO"] },
    { dep: "JUNIN", provs: ["HUANCAYO", "CONCEPCION", "CHANCHAMAYO", "JAUJA", "JUNIN", "SATIPO", "TARMA", "YAULI", "CHUPACA"] },
    { dep: "LA LIBERTAD", provs: ["TRUJILLO", "ASCOPE", "BOLIVAR", "CHEPEN", "JULCAN", "OTUZCO", "PACASMAYO", "PATAZ", "SANCHEZ CARRION", "SANTIAGO DE CHUCO", "GRAN CHIMU", "VIRU"] },
    { dep: "LAMBAYEQUE", provs: ["CHICLAYO", "FERREÑAFE", "LAMBAYEQUE"] },
    { dep: "LIMA", provs: ["LIMA", "BARRANCA", "CAJATAMBO", "CANTA", "CAÑETE", "HUARAL", "HUAROCHIRI", "HUAURA", "OYON", "YAUYOS"] },
    { dep: "LORETO", provs: ["MAYNAS", "ALTO AMAZONAS", "LORETO", "MARISCAL RAMON CASTILLA", "REQUENA", "UCAYALI", "DATEM DEL MARAÑON", "PUTUMAYO"] },
    { dep: "MADRE DE DIOS", provs: ["TAMBOPATA", "MANU", "TAHUAMANU"] },
    { dep: "MOQUEGUA", provs: ["MARISCAL NIETO", "GENERAL SANCHEZ CERRO", "ILO"] },
    { dep: "PASCO", provs: ["PASCO", "DANIEL ALCIDES CARRION", "OXAPAMPA"] },
    { dep: "PIURA", provs: ["PIURA", "AYABACA", "HUANCABAMBA", "MORROPON", "PAITA", "SULLANA", "TALARA", "SECHURA"] },
    { dep: "PUNO", provs: ["PUNO", "AZANGARO", "CARABAYA", "CHUCUITO", "EL COLLAO", "HUANCANE", "LAMPA", "MELGAR", "MOHO", "SAN ANTONIO DE PUTINA", "SAN ROMAN", "SANDIA", "YUNGUYO"] },
    { dep: "SAN MARTIN", provs: ["MOYOBAMBA", "BELLAVISTA", "EL DORADO", "HUALLAGA", "LAMAS", "MARISCAL CACERES", "PICOTA", "RIOJA", "SAN MARTIN", "TOCACHE"] },
    { dep: "TACNA", provs: ["TACNA", "CANDARAVE", "JORGE BASADRE", "TARATA"] },
    { dep: "TUMBES", provs: ["TUMBES", "CONTRALMIRANTE VILLAR", "ZARUMILLA"] },
    { dep: "UCAYALI", provs: ["CORONEL PORTILLO", "ATALAYA", "PADRE ABAD", "PURUS"] }
];

// Generate Base Locations
const GENERATED_LOCATIONS: GeoLocation[] = PERU_DATA.flatMap((d, i) => {
    const depId = `DEP-${i+1}`;
    const depObj: GeoLocation = { id: depId, name: d.dep, type: 'DEP' };
    
    const provObjs: GeoLocation[] = d.provs.map((p, j) => ({
        id: `PROV-${i+1}-${j+1}`,
        name: p,
        type: 'PROV',
        parentId: depId
    }));
    
    return [depObj, ...provObjs];
});

// Add Example Districts for CUSCO (Prov: CUSCO, ID: PROV-8-1)
const CUSCO_DISTRICTS: GeoLocation[] = [
    { id: 'DIST-CUS-1', name: 'CUSCO', type: 'DIST', parentId: 'PROV-8-1' },
    { id: 'DIST-CUS-2', name: 'CCORCA', type: 'DIST', parentId: 'PROV-8-1' },
    { id: 'DIST-CUS-3', name: 'POROY', type: 'DIST', parentId: 'PROV-8-1' },
    { id: 'DIST-CUS-4', name: 'SAN JERONIMO', type: 'DIST', parentId: 'PROV-8-1' },
    { id: 'DIST-CUS-5', name: 'SAN SEBASTIAN', type: 'DIST', parentId: 'PROV-8-1' },
    { id: 'DIST-CUS-6', name: 'SANTIAGO', type: 'DIST', parentId: 'PROV-8-1' },
    { id: 'DIST-CUS-7', name: 'SAYLLA', type: 'DIST', parentId: 'PROV-8-1' },
    { id: 'DIST-CUS-8', name: 'WANCHAQ', type: 'DIST', parentId: 'PROV-8-1' },
];

export const MOCK_LOCATIONS: GeoLocation[] = [...GENERATED_LOCATIONS, ...CUSCO_DISTRICTS];

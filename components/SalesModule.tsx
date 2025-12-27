
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Search, Trash2, CreditCard, Banknote, UserPlus, FileText, Printer, 
    Plus, Minus, X, Check, ShoppingCart, User, Smartphone, Receipt, 
    QrCode, Landmark, CheckCircle, Edit3, Lock, ShieldAlert, MapPin, 
    History, AlertTriangle, ArrowRight, Wallet, RotateCcw, ClipboardList, 
    Upload, DollarSign, Save, ListChecks, ChevronDown, TrendingUp, Info, Tablet, Hash, Calendar, Globe, Zap, Layout, FileText as FileIcon, Settings
} from 'lucide-react';
import { Product, CartItem, Client, PaymentBreakdown, Category, PurchaseRecord, BankAccount, PaymentMethodType, GeoLocation, Quotation, StockMovement } from '../types';

interface SalesModuleProps {
    products: Product[];
    clients: Client[];
    categories: Category[]; 
    purchasesHistory: PurchaseRecord[];
    stockMovements: StockMovement[];
    bankAccounts: BankAccount[]; 
    locations: GeoLocation[];
    onAddClient: (client: Client) => void;
    onProcessSale: (cart: CartItem[], total: number, docType: string, clientName: string, paymentBreakdown: PaymentBreakdown, ticketId: string, detailedPayments: any[], currency: string, exchangeRate: number) => void;
    cart: CartItem[];
    setCart: (cart: CartItem[]) => void;
    client: Client | null;
    setClient: (client: Client | null) => void;
    quotations: Quotation[];
    onLoadQuotation: (quotation: Quotation) => void;
    onAddQuotation: (quotation: Quotation) => void;
    systemBaseCurrency: string;
}

const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

interface PaymentDetail {
    id: string;
    method: PaymentMethodType;
    amount: number;
    reference?: string;
    accountId?: string;
    bankName?: string; 
}

const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day).getTime();
};

export const SalesModule: React.FC<SalesModuleProps> = ({ 
    products, clients, categories, purchasesHistory, stockMovements, bankAccounts, locations, 
    onAddClient, onProcessSale, cart, setCart, client, setClient, quotations, onLoadQuotation, onAddQuotation,
    systemBaseCurrency
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); 
  const [clientSearchTerm, setClientSearchTerm] = useState('CLIENTE VARIOS'); 
  const [docType, setDocType] = useState('TICKET DE VENTA');
  const [docNumber, setDocNumber] = useState(''); 
  
  const [currency, setCurrency] = useState<string>(systemBaseCurrency);
  const [exchangeRate, setExchangeRate] = useState<string>('3.75');

  const [paymentCondition, setPaymentCondition] = useState<'Contado' | 'Credito'>('Contado');
  const [creditDays, setCreditDays] = useState<number>(30);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState<Product | null>(null);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const [paymentList, setPaymentList] = useState<PaymentDetail[]>([]);
  const [currentPayment, setCurrentPayment] = useState<{
      method: PaymentMethodType;
      amount: string;
      reference: string;
      accountId: string;
  }>({ method: 'Efectivo', amount: '', reference: '', accountId: '' });

  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [printFormat, setPrintFormat] = useState<'80mm' | 'A4'>('80mm');

  const cartRef = useRef(cart);
  const clientRef = useRef(client);
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { clientRef.current = client; }, [client]);

  const costAnalysis = useMemo(() => {
      if (!showCostModal) return null;
      const relevantMoves = [...stockMovements]
          .filter(m => m.productId === showCostModal.id)
          .sort((a, b) => {
              const dA = parseDate(a.date);
              const dB = parseDate(b.date);
              if (dA !== dB) return dA - dB;
              return (a.time || "").localeCompare(b.time || "");
          });

      let runningStock = 0;
      let runningValue = 0;
      let runningWac = showCostModal.cost || 0;
      const historyLog: any[] = [];

      relevantMoves.forEach(m => {
          if (m.type === 'ENTRADA') {
              const mCost = m.unitCost || 0;
              runningValue += (m.quantity * mCost);
              runningStock += m.quantity;
              runningWac = runningStock > 0 ? runningValue / runningStock : mCost;
              historyLog.push({ date: m.date, supplier: m.reference.toUpperCase(), qty: m.quantity, cost: mCost, currentWac: runningWac });
          } else {
              runningStock -= m.quantity;
              runningValue = runningStock * runningWac;
          }
      });
      return { history: historyLog.reverse().slice(0, 10), avgCost: runningWac };
  }, [showCostModal, stockMovements]);

  const [newClientData, setNewClientData] = useState({ name: '', dni: '', phone: '', address: '', email: '', department: 'CUSCO', province: 'CUSCO', district: '' });
  const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null); 
  const [authPassword, setAuthPassword] = useState(''); 
  const [isAuthorized, setIsAuthorized] = useState(false); 
  const [newPriceInput, setNewPriceInput] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    if (client) setClientSearchTerm(client.name);
    else if (!client && clientSearchTerm === '') setClientSearchTerm('CLIENTE VARIOS');
  }, [client]);

  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setClientSearchTerm(val);
      const searchWords = normalize(val).split(" ").filter(w => w !== "");
      const found = clients.find(c => {
          const target = normalize(`${c.name} ${c.dni}`);
          return searchWords.length > 0 && searchWords.every(word => target.includes(word));
      });
      if (found) setClient(found);
      else setClient(null);
  };

  const filteredProducts = products.filter(p => {
    const searchWords = normalize(searchTerm).split(" ").filter(w => w !== "");
    const targetString = normalize(`${p.name} ${p.code}`);
    const matchesSearch = searchTerm === '' || searchWords.every(word => targetString.includes(word));
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    return (searchTerm.length > 0 || selectedCategory !== '') && matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Sin stock disponible");
    const existing = cart.find(item => item.id === product.id);
    if (existing && existing.quantity >= product.stock) return alert("No hay más stock disponible");
    let basePrice = product.price;
    if (currency !== systemBaseCurrency) {
        const rate = parseFloat(exchangeRate) || 3.75;
        basePrice = basePrice / rate;
    }
    if (existing) setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item));
    else setCart([...cart, { ...product, price: basePrice, quantity: 1, discount: 0, total: basePrice }]);
    setSearchTerm('');
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        if(!product) return item;
        const newQ = Math.max(1, item.quantity + delta);
        if (newQ > product.stock) { alert("Excede el stock disponible"); return item; }
        return { ...item, quantity: newQ, total: newQ * item.price };
      }
      return item;
    }));
  };

  const handleAuthorize = () => { if (authPassword === '1234') setIsAuthorized(true); else alert("Clave incorrecta"); };

  const handleApplyNewPrice = () => {
      const price = parseFloat(newPriceInput);
      if (isNaN(price) || price <= 0) return alert("Precio inválido");
      setCart(cart.map(item => item.id === priceEditItem?.id ? { ...item, price: price, total: item.quantity * price } : item));
      setShowAuthModal(false); setPriceEditItem(null); setIsAuthorized(false);
  };

  const total = cart.reduce((acc, item) => acc + item.total, 0);
  const getPaymentTotal = () => paymentList.reduce((acc, p) => acc + p.amount, 0);
  const remainingTotal = Math.max(0, total - getPaymentTotal());

  const handleAddPayment = () => {
      const amountVal = parseFloat(currentPayment.amount);
      if (isNaN(amountVal) || amountVal <= 0) return alert("Ingrese un monto válido");
      if (currentPayment.method !== 'Efectivo' && currentPayment.method !== 'Saldo Favor' && !currentPayment.accountId) return alert("Seleccione cuenta bancaria.");
      const bankInfo = bankAccounts.find(b => b.id === currentPayment.accountId);
      const newPay: PaymentDetail = { id: Math.random().toString(), method: currentPayment.method, amount: amountVal, reference: currentPayment.reference, accountId: currentPayment.accountId, bankName: bankInfo ? (bankInfo.alias || bankInfo.bankName) : undefined };
      setPaymentList([...paymentList, newPay]);
      setCurrentPayment({ ...currentPayment, amount: '', reference: '', accountId: '' });
      if (paymentAmountRef.current) paymentAmountRef.current.focus();
  };

  const handleProcessSaleRequest = () => {
    if (cart.length === 0) return;
    const fullDocType = docType + (docNumber ? ` #${docNumber}` : '');
    if (paymentCondition === 'Contado') {
        setPaymentList([]);
        setCurrentPayment({...currentPayment, amount: total.toFixed(2), method: 'Efectivo', reference: '', accountId: ''});
        setShowPaymentModal(true);
    } else {
        const ticketId = 'CR-' + Math.floor(Math.random() * 1000000).toString();
        setTicketData({ id: ticketId, date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), client: client || { name: 'CLIENTE VARIOS', dni: '00000000' }, docType: fullDocType, items: [...cart], total, subtotal: total / 1.18, igv: total - (total / 1.18), currency, condition: 'CRÉDITO (' + creditDays + ' DÍAS)', payments: [] });
        onProcessSale([...cart], total, fullDocType, client?.name || 'CLIENTE VARIOS', { cash: 0, yape: 0, card: 0, bank: 0, wallet: 0 }, ticketId, [], currency, parseFloat(exchangeRate));
        setCart([]); setClient(null); setClientSearchTerm('CLIENTE VARIOS'); setDocNumber(''); setShowTicket(true);
    }
  };

  const handleFinalizeSale = () => {
      if (getPaymentTotal() < total - 0.05) return alert("Falta completar el pago.");
      const ticketId = Math.floor(Math.random() * 1000000).toString();
      const fullDocType = docType + (docNumber ? ` #${docNumber}` : '');
      setTicketData({ id: ticketId, date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), client: client || { name: 'CLIENTE VARIOS', dni: '00000000' }, docType: fullDocType, items: [...cart], total, subtotal: total / 1.18, igv: total - (total / 1.18), currency, condition: 'CONTADO', payments: paymentList });
      const b: PaymentBreakdown = { cash: paymentList.filter(p => p.method === 'Efectivo').reduce((a, b) => a + b.amount, 0), yape: paymentList.filter(p => p.method === 'Yape' || p.method === 'Plin' || p.method === 'Yape/Plin').reduce((a, b) => a + b.amount, 0), card: paymentList.filter(p => p.method === 'Tarjeta').reduce((a, b) => a + b.amount, 0), bank: paymentList.filter(p => p.method === 'Deposito' || p.method === 'Transferencia').reduce((a, b) => a + b.amount, 0), wallet: paymentList.filter(p => p.method === 'Saldo Favor').reduce((a, b) => a + b.amount, 0) };
      onProcessSale([...cart], total, fullDocType, client?.name || 'CLIENTE VARIOS', b, ticketId, paymentList, currency, parseFloat(exchangeRate));
      setCart([]); setClient(null); setClientSearchTerm('CLIENTE VARIOS'); setDocNumber(''); setShowPaymentModal(false); setShowTicket(true);
  };

  const availableBankAccounts = useMemo(() => bankAccounts.filter(acc => acc.useInSales && acc.currency === currency), [bankAccounts, currency]);

  // COMPONENTE PARA RENDERIZAR LA CONFIGURACIÓN (REUTILIZABLE)
  const RenderSaleSettings = () => (
    <div className="flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
            <div className="flex justify-between items-center"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><User size={12}/> Datos del Cliente</label><button onClick={() => setShowClientModal(true)} className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-all"><UserPlus size={16}/></button></div>
            <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300" size={16}/><input list="pos-clients" className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:border-primary-500 text-sm uppercase" value={clientSearchTerm} onChange={handleClientSearchChange} onFocus={() => clientSearchTerm === 'CLIENTE VARIOS' && setClientSearchTerm('')} placeholder="BUSCAR CLIENTE..." /><datalist id="pos-clients">{clients.map(c => <option key={c.id} value={c.name}>{c.dni}</option>)}</datalist></div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><FileText size={12}/> Tipo Comprobante</label><select value={docType} onChange={e => setDocType(e.target.value)} className="w-full p-3 bg-slate-900 text-white rounded-2xl font-bold text-xs outline-none cursor-pointer uppercase"><option value="TICKET DE VENTA">TICKET DE VENTA</option><option value="BOLETA ELECTRÓNICA">BOLETA ELECTRÓNICA</option><option value="FACTURA ELECTRÓNICA">FACTURA ELECTRÓNICA</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Hash size={12}/> Número de Documento</label><input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white uppercase outline-none focus:border-primary-500 shadow-inner" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="001-000000" /></div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><CreditCard size={12}/> Condición de Pago</label>
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl">
                <button onClick={() => setPaymentCondition('Contado')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all uppercase ${paymentCondition === 'Contado' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>CONTADO</button>
                <button onClick={() => setPaymentCondition('Credito')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all uppercase ${paymentCondition === 'Credito' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>CRÉDITO</button>
            </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-800 p-5 rounded-3xl shadow-lg border border-slate-700 flex flex-col gap-3">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-primary-400 uppercase flex items-center gap-1.5 tracking-widest"><Globe size={12}/> Moneda Transacción</label><div className="flex bg-black/30 p-1 rounded-xl"><button onClick={() => setCurrency(systemBaseCurrency)} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase ${currency === systemBaseCurrency ? 'bg-white text-emerald-600' : 'text-slate-500'}`}>{formatSymbol(systemBaseCurrency)}</button><button onClick={() => setCurrency('USD')} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase ${currency === 'USD' ? 'bg-white text-blue-600' : 'text-slate-500'}`}>USD ($)</button></div></div>
            {currency !== systemBaseCurrency && (<div className="space-y-1.5 animate-in slide-in-from-top-1"><label className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-1.5 tracking-widest"><Zap size={12}/> Tipo de Cambio</label><input type="number" step="0.01" className="w-full p-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-black outline-none focus:border-amber-500" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} /></div>)}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 animate-in fade-in duration-500 overflow-hidden relative">
      <style>{`
        @media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white !important; color: black !important; transform: scale(1) !important; } .no-print { display: none !important; } }
        .a4-preview-container { width: 800px; transform-origin: top center; } .tabular-nums { font-variant-numeric: tabular-nums; } @media (max-width: 900px) { .a4-preview-container { transform: scale(0.7); } } @media (max-width: 600px) { .a4-preview-container { transform: scale(0.45); } }
      `}</style>
      
      {/* Columna Izquierda: Búsqueda y Carrito */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
           <div className="flex-1 flex gap-2">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                 <input ref={searchInputRef} type="text" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:border-primary-500 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <button onClick={() => setShowRecoverModal(true)} className="px-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-primary-600 transition-colors shadow-sm" title="Ventas Pendientes"><History size={18}/></button>
               <select className="hidden sm:block w-40 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-white outline-none" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}><option value="">Categorías</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
           </div>
           {filteredProducts.length > 0 && (
              <div className="absolute top-[130px] sm:top-[70px] left-4 right-4 lg:right-[310px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[500] max-h-[50vh] overflow-y-auto p-1">
                 {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-b border-slate-50 dark:border-slate-700 flex justify-between items-center rounded-lg group">
                       <div><div className="font-bold text-slate-800 dark:text-white group-hover:text-primary-600 text-xs uppercase">{p.name}</div><div className="text-[10px] text-slate-400">SKU: {p.code} | STOCK: {p.stock}</div></div>
                       <div className="font-black text-slate-900 dark:text-white text-sm">{formatSymbol(currency)} {currency === systemBaseCurrency ? p.price.toFixed(2) : (p.price / parseFloat(exchangeRate)).toFixed(2)}</div>
                    </div>
                 ))}
              </div>
           )}
        </div>

        {/* Listado del Carrito Responsivo */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-0 min-h-0">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 py-12">
               <ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-20"/>
               <p className="text-xs font-black uppercase tracking-widest">Carrito Vacío</p>
             </div>
           ) : (
             <>
                {/* Desktop: Tabla */}
                <table className="hidden md:table w-full text-left text-xs">
                    <thead><tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100 dark:border-slate-700 tracking-widest"><th className="py-3 px-4">Descripción</th><th className="py-3 text-center">Cant.</th><th className="py-3 text-right">Precio</th><th className="py-3 text-right">Total</th><th className="py-3 text-center"></th></tr></thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {cart.map(item => (
                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="py-2 px-4"><div className="font-bold text-slate-800 dark:text-white text-sm uppercase">{item.name}</div><div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Stock: {item.stock}</div></td>
                            <td className="py-2"><div className="flex items-center justify-center gap-2"><button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"><Minus size={12}/></button><span className="w-6 text-center font-black text-slate-800 dark:text-white text-sm">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"><Plus size={12}/></button></div></td>
                            <td className="py-2 text-right"><button onClick={() => { setPriceEditItem(item); setAuthPassword(''); setIsAuthorized(false); setNewPriceInput(item.price.toString()); setShowAuthModal(true); }} className="text-slate-700 dark:text-slate-200 hover:text-primary-600 font-bold group/edit px-1.5 py-0.5 rounded-lg hover:bg-primary-50 transition-all text-sm">{formatSymbol(currency)} {item.price.toFixed(2)} <Edit3 size={10} className="inline opacity-0 group-hover/edit:opacity-100 ml-1"/></button></td>
                            <td className="py-2 text-right font-black text-slate-900 dark:text-white text-sm">{formatSymbol(currency)} {item.total.toFixed(2)}</td>
                            <td className="py-2 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => setShowCostModal(item)} className="p-1.5 text-slate-300 hover:text-orange-500 transition-all opacity-0 group-hover:opacity-100" title="Costo"><ShieldAlert size={14}/></button><button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="p-1.5 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button></div></td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Móvil: Cards */}
                <div className="md:hidden space-y-3 p-1">
                    {cart.map(item => (
                        <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative">
                            <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                            <div className="pr-8 mb-3">
                                <div className="font-black text-slate-800 dark:text-white text-xs uppercase leading-tight">{item.name}</div>
                                <div className="text-[9px] font-black text-emerald-500 uppercase mt-1">Stock: {item.stock}</div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-slate-400 active:scale-95 transition-transform"><Minus size={16}/></button>
                                    <span className="font-black text-slate-900 dark:text-white text-lg min-w-[20px] text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-slate-400 active:scale-95 transition-transform"><Plus size={16}/></button>
                                </div>
                                <div className="text-right">
                                    <button onClick={() => { setPriceEditItem(item); setAuthPassword(''); setIsAuthorized(false); setNewPriceInput(item.price.toString()); setShowAuthModal(true); }} className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">{formatSymbol(currency)} {item.price.toFixed(2)}/u</button>
                                    <div className="font-black text-primary-600 text-lg leading-none">{formatSymbol(currency)} {item.total.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </>
           )}
        </div>
        
        {/* Barra de Total (Visible en desktop) */}
        <div className="hidden lg:block p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shrink-0">
           <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Venta</span>{currency !== systemBaseCurrency && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase">TC: {exchangeRate}</span>}</div><span className="text-2xl font-black text-primary-600 dark:text-primary-400">{formatSymbol(currency)} {total.toFixed(2)}</span></div>
        </div>
      </div>
      
      {/* Columna Derecha / Panel Finalizar: MINIMIZADO EN MÓVIL */}
      <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
         {/* EN MÓVIL ESTE BLOQUE SE OCULTA PARA LIMPIAR LA VISTA */}
         <div className="hidden lg:block">
            <RenderSaleSettings />
         </div>

         <div className="hidden lg:block flex-1"></div>

         <div className="flex flex-col gap-2 shrink-0">
            {/* Botón de Ajustes (Solo visible en móvil para desplegar el modal) */}
            <button 
                onClick={() => setShowMobileSettings(true)}
                className="lg:hidden w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 text-slate-500 shadow-sm"
            >
                <Settings size={18} className="text-primary-500"/> Configurar Venta / Cliente
            </button>

            <button disabled={cart.length === 0} onClick={handleProcessSaleRequest} className="w-full py-5 bg-primary-600 text-white rounded-3xl shadow-xl hover:bg-primary-700 transition-all flex flex-col items-center justify-center group active:scale-95 disabled:opacity-50 mt-auto">
                <div className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-0.5">FINALIZAR VENTA</div>
                <div className="text-2xl font-black flex items-center gap-2 tracking-tighter">{formatSymbol(currency)} {total.toFixed(2)} <Banknote size={24}/></div>
            </button>
         </div>
      </div>

      {/* MODAL DE AJUSTES PARA MÓVIL (LIMPIEZA DE UI) */}
      {showMobileSettings && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[1500] flex flex-col lg:hidden animate-in fade-in duration-300">
            <div className="p-6 flex justify-between items-center border-b border-white/10 shrink-0">
                <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2"><Settings size={18}/> Ajustes de la Operación</h3>
                <button onClick={() => setShowMobileSettings(false)} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-90"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <RenderSaleSettings />
            </div>
            <div className="p-6 bg-white/5 border-t border-white/10 shrink-0">
                <button 
                    onClick={() => setShowMobileSettings(false)}
                    className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-900/50"
                >
                    Guardar y Volver al Carrito
                </button>
            </div>
        </div>
      )}

      {/* MODALES DE PAGO Y TICKET (EXISTENTES) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-2 md:p-4">
           <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-[750px] max-h-[95vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95">
              <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><Banknote size={18} className="text-primary-600"/> Confirmar Pago</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X size={18}/></button>
              </div>
              <div className="flex flex-col lg:flex-row flex-1 overflow-auto">
                  <div className="w-full lg:w-[45%] p-6 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ListChecks size={14}/> DESGLOSE</h4>
                      <div className="min-h-[150px] lg:flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl mb-4 bg-white dark:bg-slate-800/50 overflow-hidden">
                          {paymentList.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center opacity-40"><Tablet size={40}/><p className="text-[9px] font-bold uppercase mt-2">Sin cobros</p></div>
                          ) : (
                              <div className="w-full h-full overflow-y-auto p-3 space-y-2">
                                  {paymentList.map(p => (
                                      <div key={p.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 group">
                                          <div className="min-w-0"><p className="text-[10px] font-black uppercase text-slate-700 dark:text-white truncate">{p.method}</p>{p.bankName && <p className="text-[8px] text-slate-400 truncate uppercase mt-0.5">{p.bankName}</p>}</div>
                                          <div className="flex items-center gap-3 shrink-0"><span className="font-black text-xs">{formatSymbol(currency)} {p.amount.toFixed(2)}</span><button onClick={() => setPaymentList(paymentList.filter(x => x.id !== p.id))} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex justify-between text-xs font-bold text-slate-500"><span>Total Venta:</span><span className="text-slate-800 dark:text-white font-black">{formatSymbol(currency)} {total.toFixed(2)}</span></div>
                          <div className="flex justify-between items-baseline pt-1"><span className="font-black text-red-600 text-[10px] uppercase">Pendiente:</span><span className="text-2xl font-black text-red-600 tracking-tighter">{formatSymbol(currency)} {remainingTotal.toFixed(2)}</span></div>
                      </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> AGREGAR MEDIO</h4>
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {['Efectivo', 'Yape', 'Transferencia', 'Tarjeta', 'Deposito', 'Saldo Favor'].map(m => (
                                <button key={m} onClick={() => setCurrentPayment({...currentPayment, method: m as any, reference: '', accountId: ''})} className={`py-2.5 px-3 rounded-xl border-2 font-bold text-[10px] uppercase transition-all ${currentPayment.method === m ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-slate-700 text-slate-400 border-slate-100 hover:border-slate-200'}`}>{m === 'Saldo Favor' ? 'Billetera' : m}</button>
                              ))}
                          </div>
                          
                          {currentPayment.method !== 'Efectivo' && currentPayment.method !== 'Saldo Favor' && (
                              <div className="space-y-3 animate-in slide-in-from-top-1 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Cuenta Bancaria</label>
                                      <select className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none" value={currentPayment.accountId} onChange={e => setCurrentPayment({...currentPayment, accountId: e.target.value})}>
                                          <option value="">-- SELECCIONAR --</option>
                                          {availableBankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} - {b.accountNumber}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nro. Operación</label>
                                      <input type="text" className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none uppercase" value={currentPayment.reference} onChange={e => setCurrentPayment({...currentPayment, reference: e.target.value})} placeholder="123456" />
                                  </div>
                              </div>
                          )}

                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MONTO</label>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">{formatSymbol(currency)}</span><input ref={paymentAmountRef} type="number" className="w-full pl-12 p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-4xl font-black text-slate-800 dark:text-white outline-none focus:border-primary-500 shadow-inner" value={currentPayment.amount} onChange={e => setCurrentPayment({...currentPayment, amount: e.target.value})} /></div>
                          </div>
                          <button onClick={handleAddPayment} className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all uppercase text-[11px] tracking-widest"><Plus size={18}/> Agregar Cobro</button>
                      </div>
                  </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                  <button onClick={() => setShowPaymentModal(false)} className="px-6 py-3.5 text-slate-500 font-black hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
                  <button onClick={handleFinalizeSale} disabled={remainingTotal > 0.05} className="px-10 py-3.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"><CheckCircle size={18}/> Procesar Venta</button>
              </div>
           </div>
        </div>
      )}

      {/* Clientes, Auth y Costo */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-3xl border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                   <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter"><UserPlus className="text-primary-600" size={20}/> Nuevo Cliente</h3>
                   <button onClick={() => setShowClientModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
               </div>
               <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase block">Nombre Completo</label><input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold uppercase outline-none focus:border-primary-500 shadow-sm text-sm" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} placeholder="EJ. JUAN PÉREZ" autoFocus /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase block">DNI / RUC</label><input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-primary-500 text-sm" value={newClientData.dni} onChange={e => setNewClientData({...newClientData, dni: e.target.value})} placeholder="00000000" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase block">Teléfono</label><input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-primary-500 text-sm" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} placeholder="999 999 999" /></div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 shrink-0">
                        <button onClick={() => setShowClientModal(false)} className="px-10 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs">Cancelar</button>
                        <button onClick={() => { if (!newClientData.name || !newClientData.dni) return alert("Nombre y DNI obligatorios."); const cl: Client = { id: Date.now().toString(), name: newClientData.name.toUpperCase(), dni: newClientData.dni, phone: newClientData.phone, creditLine: 0, creditUsed: 0, totalPurchases: 0, paymentScore: 3, digitalBalance: 0 }; onAddClient(cl); setClient(cl); setShowClientModal(false); }} className="px-12 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 shadow-xl transition-all text-xs uppercase tracking-widest">Guardar Cliente</button>
                    </div>
               </div>
           </div>
        </div>
      )}

      {showRecoverModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0"><h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2"><History size={18} className="text-primary-500"/> Ventas Pendientes</h3><button onClick={() => setShowRecoverModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18}/></button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {quotations.length === 0 ? (
                        <div className="py-20 text-center text-slate-300 italic flex flex-col items-center"><History size={48} strokeWidth={1} className="mb-3 opacity-20"/><p className="text-xs font-bold uppercase">No hay cotizaciones activas</p></div>
                    ) : quotations.map(q => (
                        <button key={q.id} onClick={() => { onLoadQuotation(q); setShowRecoverModal(false); }} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary-500 transition-all group flex items-center justify-between">
                            <div><p className="font-black text-xs text-slate-800 dark:text-white uppercase">{q.clientName}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{q.date} {q.time} - {q.items.length} productos</p></div>
                            <div className="text-right shrink-0"><p className="font-black text-sm text-primary-600">S/ {q.total.toFixed(2)}</p><span className="text-[8px] font-black text-slate-300 uppercase">Click p/ Recuperar</span></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[2200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-[350px] p-8 border border-white/20 animate-in zoom-in-95">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600"><Lock size={32}/></div>
                    <div><h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Autorización</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Se requiere clave de administrador para cambiar el precio</p></div>
                    {!isAuthorized ? (
                        <>
                            <input type="password" autoFocus className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-center text-4xl tracking-[0.3em] font-black outline-none focus:border-primary-500" value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuthorize()} placeholder="****" />
                            <div className="flex gap-3"><button onClick={() => { setShowAuthModal(false); setAuthPassword(''); }} className="flex-1 py-3 text-slate-500 font-bold uppercase text-[10px]">Cancelar</button><button onClick={handleAuthorize} className="flex-1 py-3 bg-slate-900 text-white font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg">Validar</button></div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase block">Nuevo Precio ({formatSymbol(currency)})</label><input type="number" autoFocus className="w-full p-4 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 rounded-2xl text-center text-3xl font-black outline-none" value={newPriceInput} onChange={e => setNewPriceInput(e.target.value)} /></div>
                            <button onClick={handleApplyNewPrice} className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 transition-all uppercase text-[10px] tracking-widest">Aplicar Nuevo Precio</button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

      {showTicket && ticketData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2500] flex items-center justify-center p-2 md:p-4">
            <div className={`bg-zinc-100 p-4 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col gap-4 ${printFormat === 'A4' ? 'max-w-4xl w-full h-[90vh]' : 'max-w-[340px] w-full h-auto'}`}>
                <div className="no-print bg-white p-2 rounded-xl border flex gap-2 shadow-sm shrink-0">
                    <button onClick={() => setPrintFormat('80mm')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printFormat === '80mm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Layout size={14}/> 80mm</button>
                    <button onClick={() => setPrintFormat('A4')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printFormat === 'A4' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><FileIcon size={14}/> A4</button>
                </div>
                <div id="print-area" className="flex-1 overflow-auto p-4 bg-zinc-200 no-scrollbar rounded-xl flex justify-center items-start">
                    {printFormat === '80mm' ? (
                        <div className="bg-white w-[280px] p-6 shadow-sm font-mono text-[10px] text-black mx-auto shrink-0 tabular-nums">
                            <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-black"><h2 className="font-bold text-xs uppercase tracking-tighter">SapiSoft ERP</h2><p className="text-[8px] text-black font-bold uppercase">SISTEMA DE VENTAS</p></div>
                            <div className="mb-3 space-y-0.5 text-black">
                                <div className="flex justify-between"><span>Venta:</span> <span className="font-bold">#{ticketData.id}</span></div>
                                <div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{ticketData.date}</span></div>
                                <div className="flex justify-between"><span>Cliente:</span> <span className="font-bold truncate max-w-[150px]">{ticketData.client.name}</span></div>
                                <div className="flex justify-between"><span>Doc:</span> <span className="uppercase font-bold">{ticketData.docType}</span></div>
                                <div className="flex justify-between"><span>Condición:</span> <span className="font-black uppercase">{ticketData.condition}</span></div>
                            </div>
                            <div className="border-y border-dashed border-black py-2 mb-3">
                                <div className="grid grid-cols-[1fr_22px_40px_45px] font-black text-[8px] mb-1 border-b border-black pb-1 uppercase text-black"><span>Articulo</span><span className="text-center">Cant</span><span className="text-right">Unit</span><span className="text-right">Total</span></div>
                                {ticketData.items.map((item: CartItem, idx: number) => (
                                    <div key={idx} className="grid grid-cols-[1fr_22px_40px_45px] mb-1 last:mb-0 leading-tight text-black">
                                        <span className="uppercase truncate pr-1 font-bold">{item.name}</span>
                                        <span className="text-center font-black">{item.quantity}</span>
                                        <span className="text-right font-medium">{item.price.toFixed(0)}</span>
                                        <span className="text-right font-black">{(item.price * item.quantity).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1 mb-4 border-b-2 border-black pb-2 text-black font-black">
                                <div className="flex justify-between text-xs"><span>TOTAL {formatSymbol(ticketData.currency)}</span><span>{ticketData.total.toFixed(2)}</span></div>
                            </div>
                            <div className="space-y-1 mb-4 text-black border-t-2 border-black pt-2">
                                <p className="text-[9px] font-black uppercase mb-1 underline">Forma de Pago:</p>
                                {ticketData.payments && ticketData.payments.length > 0 ? (
                                    ticketData.payments.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase">
                                            <span>{p.method} {p.bankName ? `(${p.bankName})` : ''}</span>
                                            <span>{formatSymbol(ticketData.currency)} {p.amount.toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <span>EFECTIVO</span>
                                        <span>{formatSymbol(ticketData.currency)} {ticketData.total.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 text-center italic text-[8px] text-black font-bold uppercase border-t border-black pt-2">¡Gracias por su compra!</div>
                        </div>
                    ) : (
                        <div className="a4-preview-container bg-white p-12 shadow-sm font-sans text-xs text-slate-800 mx-auto min-h-[1100px] flex flex-col shrink-0">
                            <div className="flex justify-between items-start mb-8 border-b-2 border-blue-600 pb-6">
                                <div className="space-y-1"><h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">SapiSoft ERP</h1><p className="font-bold text-slate-500 uppercase">SISTEMA INTEGRAL DE VENTAS</p></div>
                                <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl text-center min-w-[200px]">
                                    <p className="bg-blue-600 text-white py-1 px-2 font-black text-[10px] rounded mb-1 uppercase">{ticketData.docType}</p>
                                    <p className="font-mono text-lg font-black">{ticketData.id}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Datos del Cliente</p>
                                    <p className="font-black text-sm uppercase">{ticketData.client.name}</p>
                                    <p><strong>Identificación:</strong> {ticketData.client.dni}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Información Venta</p>
                                    <p><strong>Fecha:</strong> {ticketData.date}</p>
                                    <p><strong>Condición:</strong> {ticketData.condition}</p>
                                    <p><strong>Moneda:</strong> {formatSymbol(ticketData.currency)}</p>
                                </div>
                            </div>
                            <table className="w-full border-collapse">
                                <thead><tr className="bg-blue-600 text-white"><th className="p-2 text-left text-[8px] uppercase">SKU</th><th className="p-2 text-left text-[8px] uppercase">Descripción</th><th className="p-2 text-center text-[8px] uppercase">Cant.</th><th className="p-2 text-right text-[8px] uppercase">P. Unit</th><th className="p-2 text-right text-[8px] uppercase">Total</th></tr></thead>
                                <tbody>
                                    {ticketData.items.map((item: CartItem, i: number) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            <td className="p-2 font-mono">{item.code}</td>
                                            <td className="p-2 uppercase">{item.name}</td>
                                            <td className="p-2 text-center font-black">{item.quantity}</td>
                                            <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                                            <td className="p-2 text-right font-black">{(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end pt-8">
                                <div className="w-72 p-4 bg-blue-600 text-white rounded-xl text-right">
                                    <span className="font-black uppercase block text-[10px] mb-1">Total Venta:</span>
                                    <span className="text-2xl font-black font-mono">{formatSymbol(ticketData.currency)} {ticketData.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="no-print flex gap-2 shrink-0 bg-white p-4 rounded-xl border border-slate-200">
                    <button onClick={() => setShowTicket(false)} className="flex-1 py-3 bg-white text-slate-500 font-black rounded-xl text-[10px] uppercase border">Finalizar</button>
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest"><Printer size={16}/> Imprimir</button>
                </div>
            </div>
        </div>
       )}

      {showCostModal && costAnalysis && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-[600px] border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><h3 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter"><ShieldAlert className="text-orange-500" size={24}/> Análisis de Costo Promedio (WAC)</h3><button onClick={() => setShowCostModal(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button></div>
                <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Unitario (Base)</p><p className="text-2xl font-black text-slate-800 dark:text-white">{formatSymbol(systemBaseCurrency)} {showCostModal.cost?.toFixed(2) || '0.00'}</p></div>
                        <div className="flex-1 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl border border-primary-100 dark:border-primary-800 text-center"><p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Costo WAC (Residual)</p><p className="text-2xl font-black text-primary-700 dark:text-primary-300">{formatSymbol(systemBaseCurrency)} {costAnalysis.avgCost.toFixed(2)}</p></div>
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14}/> Evolución en Almacén</h4>
                        <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3 text-center">Cant.</th><th className="px-4 py-3 text-right">WAC</th></tr></thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {costAnalysis.history.map((h, i) => (
                                        <tr key={i} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{h.date}</td>
                                            <td className="px-4 py-3 truncate max-w-[150px] uppercase font-bold">{h.supplier}</td>
                                            <td className="px-4 py-3 text-center font-bold">+{h.qty}</td>
                                            <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">{formatSymbol(systemBaseCurrency)} {h.currentWac.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <button onClick={() => setShowCostModal(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest">CERRAR</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SalesModule;

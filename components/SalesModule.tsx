
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Search, Trash2, CreditCard, Banknote, UserPlus, FileText, Printer, 
    Plus, Minus, X, Check, ShoppingCart, User, Smartphone, Receipt, 
    QrCode, Landmark, CheckCircle, Edit3, Lock, ShieldAlert, MapPin, 
    History, AlertTriangle, ArrowRight, Wallet, RotateCcw, ClipboardList, 
    Upload, DollarSign, Save, ListChecks, ChevronDown, TrendingUp, Info, Tablet, Hash, Calendar, Globe, Zap, Layout, FileText as FileIcon
} from 'lucide-react';
import { Product, CartItem, Client, PaymentBreakdown, Category, PurchaseRecord, BankAccount, PaymentMethodType, GeoLocation, Quotation, StockMovement } from '../types';

interface SalesModuleProps {
    products: Product[];
    clients: Client[];
    categories: Category[]; 
    purchasesHistory: PurchaseRecord[];
    stockMovements: StockMovement[]; // AGREGADO
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

  useEffect(() => {
    return () => {
        if (cartRef.current.length > 0) {
            const autoQuotation: Quotation = {
                id: 'AUTO-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                date: new Date().toLocaleDateString('es-PE'),
                time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                clientName: clientRef.current?.name || 'CLIENTE VARIOS',
                items: [...cartRef.current],
                total: cartRef.current.reduce((acc, i) => acc + i.total, 0)
            };
            onAddQuotation(autoQuotation);
            setCart([]); 
        }
    };
  }, []);

  const costAnalysis = useMemo(() => {
      if (!showCostModal) return null;

      // RECONSTRUCCIÓN CRONOLÓGICA REAL (Kardex Valorizado)
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

              historyLog.push({
                  date: m.date,
                  supplier: m.reference.toUpperCase(),
                  qty: m.quantity,
                  cost: mCost,
                  currentWac: runningWac
              });
          } else {
              // SALIDA (Ventas/Ajustes)
              // Las salidas reducen stock y valor proporcionalmente, manteniendo el mismo WAC
              runningStock -= m.quantity;
              runningValue = runningStock * runningWac;
          }
      });

      return { 
          history: historyLog.reverse().slice(0, 10), 
          avgCost: runningWac 
      };
  }, [showCostModal, stockMovements]);

  const [newClientData, setNewClientData] = useState({ name: '', dni: '', phone: '', address: '', email: '', department: 'CUSCO', province: 'CUSCO', district: '' });
  const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null); 
  const [authPassword, setAuthPassword] = useState(''); 
  const [isAuthorized, setIsAuthorized] = useState(false); 
  const [newPriceInput, setNewPriceInput] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  const departments = locations.filter(l => l.type === 'DEP');
  const provinces = locations.filter(l => l.type === 'PROV' && l.parentId === (departments.find(d => d.name === newClientData.department)?.id));
  const districts = locations.filter(l => l.type === 'DIST' && l.parentId === (provinces.find(p => p.name === newClientData.province)?.id));

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

  return (
    <div className="flex h-full gap-4 animate-in fade-in duration-500">
      <style>{`
        @media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white !important; color: black !important; transform: scale(1) !important; } .no-print { display: none !important; } }
        .a4-preview-container { width: 800px; transform-origin: top center; } .tabular-nums { font-variant-numeric: tabular-nums; } @media (max-width: 900px) { .a4-preview-container { transform: scale(0.7); } } @media (max-width: 600px) { .a4-preview-container { transform: scale(0.45); } }
      `}</style>
      
      <div className="flex-1 flex flex-col gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50/50 dark:bg-slate-900/50">
           <div className="flex-1 flex gap-2">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                 <input ref={searchInputRef} type="text" className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:border-primary-500 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <button onClick={() => setShowRecoverModal(true)} className="px-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-primary-600 transition-colors shadow-sm" title="Ventas Pendientes"><History size={18}/></button>
               <select className="w-40 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-white outline-none" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}><option value="">Categorías</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
           </div>
           {filteredProducts.length > 0 && (
              <div className="absolute top-[70px] left-4 right-[310px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[500] max-h-[50vh] overflow-y-auto p-1">
                 {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-b border-slate-50 dark:border-slate-700 flex justify-between items-center rounded-lg group">
                       <div><div className="font-bold text-slate-800 dark:text-white group-hover:text-primary-600 text-xs uppercase">{p.name}</div><div className="text-[10px] text-slate-400">SKU: {p.code} | STOCK: {p.stock}</div></div>
                       <div className="font-black text-slate-900 dark:text-white text-sm">{formatSymbol(currency)} {currency === systemBaseCurrency ? p.price.toFixed(2) : (p.price / parseFloat(exchangeRate)).toFixed(2)}</div>
                    </div>
                 ))}
              </div>
           )}
        </div>

        <div className="flex-1 overflow-auto">
           {cart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600"><ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-20"/><p className="text-xs font-black uppercase tracking-widest">Carrito Vacío</p></div>) : (
             <table className="w-full text-left text-xs">
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
           )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700"><div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Venta</span>{currency !== systemBaseCurrency && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase">TC: {exchangeRate}</span>}</div><span className="text-2xl font-black text-primary-600 dark:text-primary-400">{formatSymbol(currency)} {total.toFixed(2)}</span></div></div>
      </div>
      
      <div className="w-72 flex flex-col gap-3 shrink-0">
         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2"><label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><User size={12}/> Cliente</label><button onClick={() => setShowClientModal(true)} className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-all" title="Nuevo Cliente"><UserPlus size={14}/></button></div>
            <div className="min-w-0 relative"><div className="relative"><User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-50" size={14}/><input list="pos-clients" className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-white outline-none focus:border-primary-500 text-xs uppercase" value={clientSearchTerm} onChange={handleClientSearchChange} onFocus={() => clientSearchTerm === 'CLIENTE VARIOS' && setClientSearchTerm('')} placeholder="BUSCAR..." /><datalist id="pos-clients">{clients.map(c => <option key={c.id} value={c.name}>{c.dni}</option>)}</datalist></div></div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
             <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><FileText size={12}/> Comprobante</label><select value={docType} onChange={e => setDocType(e.target.value)} className="w-full p-2 bg-slate-900 text-white rounded-lg font-bold text-xs outline-none cursor-pointer uppercase"><option value="TICKET DE VENTA">TICKET DE VENTA</option><option value="BOLETA ELECTRÓNICA">BOLETA ELECTRÓNICA</option><option value="FACTURA ELECTRÓNICA">FACTURA ELECTRÓNICA</option></select></div>
             <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Hash size={12}/> Nro Comprobante</label><input type="text" className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white uppercase outline-none focus:border-primary-500" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="EJ: 001-001234" /></div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
             <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Globe size={12}/> Divisa de Venta</label><div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg"><button onClick={() => setCurrency(systemBaseCurrency)} className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all uppercase ${currency === systemBaseCurrency ? 'bg-white shadow text-emerald-600' : 'text-slate-50'}`}>{formatSymbol(systemBaseCurrency)}</button><button onClick={() => setCurrency('USD')} className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all uppercase ${currency === 'USD' ? 'bg-white shadow text-blue-600' : 'text-slate-50'}`}>USD ($)</button></div></div>
             {currency !== systemBaseCurrency && (<div className="space-y-1 animate-in slide-in-from-top-1"><label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><Zap size={12}/> Tipo de Cambio</label><input type="number" step="0.01" className="w-full p-2 bg-yellow-50 dark:bg-slate-900 border border-yellow-200 dark:border-slate-700 rounded-lg text-xs font-black text-yellow-700 dark:text-yellow-400 outline-none" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} /></div>)}
         </div>
         <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
             <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><CreditCard size={12}/> Pago</label>
             <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg"><button onClick={() => setPaymentCondition('Contado')} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all uppercase ${paymentCondition === 'Contado' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>CONTADO</button><button onClick={() => setPaymentCondition('Credito')} className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all uppercase ${paymentCondition === 'Credito' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>CRÉDITO</button></div>
         </div>
         <div className="flex-1"></div>
         <button disabled={cart.length === 0} onClick={handleProcessSaleRequest} className="w-full py-4 bg-primary-600 text-white rounded-2xl shadow-lg hover:bg-primary-700 transition-all flex flex-col items-center justify-center group active:scale-95 disabled:opacity-50"><div className="text-[9px] font-black opacity-80 uppercase tracking-widest mb-0.5">FINALIZAR VENTA</div><div className="text-xl font-black flex items-center gap-2">{formatSymbol(currency)} {total.toFixed(2)} <Banknote size={18}/></div></button>
      </div>

      {showCostModal && costAnalysis && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-[600px] border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><h3 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter"><ShieldAlert className="text-orange-500" size={24}/> Análisis de Costo Promedio (WAC)</h3><button onClick={() => setShowCostModal(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button></div>
                <div className="p-8 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Unitario (Base)</p><p className="text-2xl font-black text-slate-800 dark:text-white">{formatSymbol(systemBaseCurrency)} {showCostModal.cost?.toFixed(2) || '0.00'}</p></div>
                        <div className="flex-1 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl border border-primary-100 dark:border-primary-800 text-center"><p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Costo WAC (Residual)</p><p className="text-2xl font-black text-primary-700 dark:text-primary-300">{formatSymbol(systemBaseCurrency)} {costAnalysis.avgCost.toFixed(2)}</p></div>
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14}/> Evolución del Valor en Almacén</h4>
                        <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Origen / Referencia</th><th className="px-4 py-3 text-center">Cant.</th><th className="px-4 py-3 text-right">WAC Resultante</th></tr></thead>
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
                        <p className="text-[9px] text-slate-400 mt-3 uppercase font-bold flex items-center gap-1.5"><Info size={12}/> El cálculo WAC considera el valor de la mercancía que queda en stock tras cada compra.</p>
                    </div>
                    <button onClick={() => setShowCostModal(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest">CERRAR ANÁLISIS</button>
                </div>
            </div>
        </div>
      )}
      {/* ... (Resto de modales: Payment, Recover, Client, Auth) ... */}
    </div>
  );
};

export default SalesModule;

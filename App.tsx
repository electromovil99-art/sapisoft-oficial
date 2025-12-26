
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SalesModule from './components/SalesModule';
import PurchaseModule from './components/PurchaseModule';
import InventoryModule from './components/InventoryModule';
import ServicesModule from './components/ServicesModule';
import ClientsModule from './components/ClientsModule'; 
import SuppliersModule from './components/SuppliersModule'; 
import BankAccountsModule from './components/BankAccountsModule'; 
import HistoryQueries from './components/HistoryQueries';
import UserPrivilegesModule from './components/UserPrivilegesModule'; 
import LoginScreen from './components/LoginScreen'; 
import CashModule from './components/CashModule';
import QuotationModule from './components/QuotationModule';
import SalesReportModule from './components/SalesReportModule';
import ProfitReportModule from './components/ProfitReportModule';
import BusinessEvolutionModule from './components/BusinessEvolutionModule';
import FinancialStrategyModule from './components/FinancialStrategyModule';
import DatabaseModule from './components/DatabaseModule';
import MediaEditorModule from './components/MediaEditorModule';
import PrintConfigModule from './components/PrintConfigModule';
import CreditNoteModule from './components/CreditNoteModule';
import ClientWalletModule from './components/ClientWalletModule';
import LocationsModule from './components/LocationsModule';
import WhatsAppModule from './components/WhatsAppModule';
import ResourceManagement from './components/ResourceManagement';
import FinanceManagerModule from './components/FinanceManagerModule';
import CashBoxHistoryModule from './components/CashBoxHistoryModule';
import BankHistoryModule from './components/BankHistoryModule';
import CompanyProfileModule from './components/CompanyProfileModule';
import SystemDiagnosticsModule from './components/SystemDiagnosticsModule';
import InventoryAdjustmentModule from './components/InventoryAdjustmentModule';
import InventoryAuditModule from './components/InventoryAuditModule';
import { SuperAdminModule } from './components/SuperAdminModule';

import { 
    ViewState, CashMovement, Product, ServiceOrder, Client, CartItem, PaymentMethodType, 
    PaymentBreakdown, Supplier, Brand, Category, BankAccount, 
    SaleRecord, PurchaseRecord, StockMovement, GeoLocation, SystemUser, AuthSession, Tenant, Quotation, Chat, CashBoxSession, InventoryHistorySession
} from './types';
import { 
    MOCK_CASH_MOVEMENTS, MOCK_CLIENTS, MOCK_LOCATIONS, MOCK_SERVICES, 
    TECH_PRODUCTS, TECH_CATEGORIES, FIXED_EXPENSE_CATEGORIES, FIXED_INCOME_CATEGORIES
} from './constants';
import { INITIAL_NAV_STRUCTURE } from './navigation';

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([
    { id: 'admin-01', username: 'admin', password: 'admin', fullName: 'Administrador Principal', role: 'ADMIN', active: true, permissions: ['ALL'], industry: 'TECH', companyName: 'SAPISOFT' },
    { id: 'super-01', username: 'superadmin', password: 'admin', fullName: 'SapiSoft Master', role: 'SUPER_ADMIN', active: true, permissions: ['ALL'], industry: 'TECH', companyName: 'SAPISOFT' }
  ]);
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: 'tenant-01', companyName: 'SAPISOFT', industry: 'TECH', status: 'ACTIVE', subscriptionEnd: '31/12/2025', ownerName: 'Admin', phone: '999999999', planType: 'FULL', baseCurrency: 'PEN' }
  ]);

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | undefined>(undefined);
  const [featureImage, setFeatureImage] = useState<string | undefined>(undefined);
  const [navStructure, setNavStructure] = useState(INITIAL_NAV_STRUCTURE);

  const [products, setProducts] = useState<Product[]>(TECH_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(TECH_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS); 
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([...MOCK_CASH_MOVEMENTS]);
  const [cashSessions, setCashSessions] = useState<CashBoxSession[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [purchasesHistory, setPurchasesHistory] = useState<PurchaseRecord[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [services, setServices] = useState<ServiceOrder[]>(MOCK_SERVICES);
  const [chats, setChats] = useState<Chat[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistorySession[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { id: '1', bankName: 'BCP', accountNumber: '193-456789-0-01', currency: 'PEN', alias: 'CUENTA TIENDA (SOLES)', useInSales: true, useInPurchases: true },
    { id: '2', bankName: 'BBVA', accountNumber: '0011-0123-45-6789', currency: 'PEN', alias: 'YAPE / RECAUDACIÓN', useInSales: true, useInPurchases: false },
    { id: '3', bankName: 'INTERBANK', accountNumber: '200-3001234567', currency: 'USD', alias: 'CUENTA DÓLARES', useInSales: false, useInPurchases: true }
  ]);
  
  const [fixedExpenseCats, setFixedExpenseCats] = useState<string[]>(FIXED_EXPENSE_CATEGORIES);
  const [fixedIncomeCats, setFixedIncomeCats] = useState<string[]>(FIXED_INCOME_CATEGORIES);

  const [locations, setLocations] = useState<GeoLocation[]>(() => {
      const generatedDistricts: GeoLocation[] = [];
      const provinces = MOCK_LOCATIONS.filter(l => l.type === 'PROV');
      const districts = MOCK_LOCATIONS.filter(l => l.type === 'DIST');
      provinces.forEach(prov => {
          if (!districts.some(d => d.parentId === prov.id)) {
              generatedDistricts.push(
                  { id: `DIST-${prov.id}-1`, name: 'CERCADO', type: 'DIST', parentId: prov.id },
                  { id: `DIST-${prov.id}-2`, name: `${prov.name} (ZONA NORTE)`, type: 'DIST', parentId: prov.id }
              );
          }
      });
      return [...MOCK_LOCATIONS, ...generatedDistricts];
  });

  const [wsContact, setWsContact] = useState<{ name: string, phone: string, message?: string } | undefined>(undefined);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posClient, setPosClient] = useState<Client | null>(null);
  const [isCashBoxOpen, setIsCashBoxOpen] = useState(false);
  const [lastClosingCash, setLastClosingCash] = useState(100);

  const handleManualAdjustment = useCallback((productId: string, type: 'ENTRADA' | 'SALIDA', quantity: number, reason: string) => {
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE');
      const userName = session?.user.fullName || 'Admin';
      setProducts(currentProducts => {
          const product = currentProducts.find(p => p.id === productId);
          if (!product) return currentProducts;
          const newStock = type === 'ENTRADA' ? product.stock + quantity : product.stock - quantity;
          const move: StockMovement = {
              id: 'MV-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
              date, time, productId: product.id, productName: product.name, type, quantity, currentStock: newStock,
              reference: reason.toUpperCase(), user: userName, unitCost: product.cost || 0
          };
          setStockMovements(prevMoves => [move, ...prevMoves]);
          return currentProducts.map(p => p.id === productId ? { ...p, stock: newStock } : p);
      });
  }, [session]);

  const handleProcessInventorySession = useCallback((sessionData: InventoryHistorySession) => {
    const date = new Date().toLocaleDateString('es-PE');
    const time = new Date().toLocaleTimeString('es-PE');
    if (sessionData.status === 'ADJUSTED') {
        const newMovements: StockMovement[] = sessionData.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                id: 'MV-ADJ-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                date, time, productId: item.productId, productName: item.productName, type: item.difference > 0 ? 'ENTRADA' : 'SALIDA',
                quantity: Math.abs(item.difference), currentStock: item.physicalCount,
                reference: `AJUSTE FÍSICO FINAL #${sessionData.id}`, user: sessionData.user, unitCost: product?.cost || 0
            };
        });
        setProducts(currentProducts => currentProducts.map(p => {
            const auditItem = sessionData.items.find(item => item.productId === p.id);
            return auditItem ? { ...p, stock: auditItem.physicalCount } : p;
        }));
        setStockMovements(prev => [...newMovements, ...prev]);
        setCurrentView(ViewState.INVENTORY);
    }
    setInventoryHistory(prev => {
        const exists = prev.find(s => s.id === sessionData.id);
        if (exists) return prev.map(s => s.id === sessionData.id ? sessionData : s);
        return [sessionData, ...prev];
    });
  }, [products]);

  const handleAddProduct = useCallback((p: Product) => {
    setProducts(prev => [p, ...prev]);
    const move: StockMovement = {
        id: 'INIT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        date: new Date().toLocaleDateString('es-PE'),
        time: new Date().toLocaleTimeString('es-PE'),
        productId: p.id, productName: p.name, type: 'ENTRADA', quantity: p.stock, currentStock: p.stock,
        reference: 'INVENTARIO INICIAL', user: session?.user.fullName || 'Admin', unitCost: p.cost || 0
    };
    setStockMovements(prev => [move, ...prev]);
  }, [session]);

  const handleUpdateProduct = useCallback((p: Product) => {
      setProducts(prev => prev.map(x => x.id === p.id ? p : x));
  }, []);

  const handleDeleteProduct = useCallback((id: string) => {
      setProducts(prev => prev.filter(x => x.id !== id));
  }, []);

  const handleAddCashMovement = useCallback((m: CashMovement) => {
    setCashMovements(prev => [m, ...prev]);
  }, []);

  const handleProcessSale = useCallback((cart: CartItem[], total: number, docType: string, clientName: string, breakdown: PaymentBreakdown, ticketId: string, detailedPayments: any[], currency: string, exchangeRate: number) => {
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE');
      const user = session?.user.fullName || 'Admin';
      const newSale: SaleRecord = { id: ticketId, date, time, clientName, docType, total, items: [...cart], paymentBreakdown: breakdown, user, currency: currency, exchangeRate };
      setSalesHistory(prev => [newSale, ...prev]);
      cart.forEach(item => handleManualAdjustment(item.id, 'SALIDA', item.quantity, `VENTA ${docType} #${ticketId}`));
      detailedPayments.forEach(p => handleAddCashMovement({ id: Math.random().toString(), date, time, type: 'Ingreso', paymentMethod: p.method, concept: `VENTA ${docType} #${ticketId}`, user, category: 'VENTA', financialType: 'Variable', amount: p.amount, accountId: p.accountId, referenceId: p.reference || ticketId, currency: currency }));
  }, [session, handleManualAdjustment, handleAddCashMovement]);

  const handleProcessPurchase = useCallback((cart: CartItem[], total: number, docType: string, supplierName: string, condition: 'Contado' | 'Credito', creditDays: number, detailedPayments: any[], currency: string, exchangeRate: number) => {
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE');
      const user = session?.user.fullName || 'Admin';
      const purchaseId = 'PUR-' + Math.floor(Math.random() * 1000000).toString();
      const newPurchase: PurchaseRecord = { id: purchaseId, date, time, supplierName, docType, total, items: [...cart], paymentCondition: condition, user, currency: currency, exchangeRate: exchangeRate || 1 };
      setPurchasesHistory(prev => [newPurchase, ...prev]);
      cart.forEach(item => {
          setProducts(currentProducts => {
            const product = currentProducts.find(p => p.id === item.id);
            if (!product) return currentProducts;
            const newStock = product.stock + item.quantity;
            const move: StockMovement = {
                id: 'MV-PUR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                date, time, productId: product.id, productName: product.name, type: 'ENTRADA', quantity: item.quantity, currentStock: newStock, reference: `COMPRA ${docType} #${purchaseId}`.toUpperCase(), user, unitCost: item.price
            };
            setStockMovements(prevMoves => [move, ...prevMoves]);
            return currentProducts.map(p => p.id === item.id ? { ...p, stock: newStock } : p);
          });
      });
      if (condition === 'Contado' && detailedPayments) {
          detailedPayments.forEach(pay => handleAddCashMovement({ id: Math.random().toString(), date, time, type: 'Egreso', paymentMethod: pay.method, concept: `COMPRA ${docType} #${purchaseId} - ${supplierName}`, user, category: 'COMPRA', financialType: 'Variable', amount: pay.amount, accountId: pay.accountId, referenceId: pay.reference || purchaseId, currency: currency }));
      }
  }, [session, handleAddCashMovement]);

  const handleProcessCreditNote = useCallback((originalSaleId: string, itemsToReturn: { itemId: string, quantity: number }[], totalRefund: number, breakdown: PaymentBreakdown, detailedRefunds?: any[]) => {
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE');
      const user = session?.user.fullName || 'Admin';
      const ncId = 'NC-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setProducts(current => current.map(p => {
          const returnItem = itemsToReturn.find(i => i.itemId === p.id);
          if (returnItem) {
              const newStock = p.stock + returnItem.quantity;
              const move: StockMovement = {
                  id: 'MV-NC-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                  date, time, productId: p.id, productName: p.name, type: 'ENTRADA', quantity: returnItem.quantity, currentStock: newStock, reference: `NC #${ncId} (DEV. TICKET #${originalSaleId})`, user, unitCost: p.cost || 0
              };
              setStockMovements(prev => [move, ...prev]);
              return { ...p, stock: newStock };
          }
          return p;
      }));
      if (detailedRefunds) {
          detailedRefunds.forEach(ref => {
              handleAddCashMovement({ id: Math.random().toString(), date, time, type: 'Egreso', paymentMethod: ref.method, concept: `REEMBOLSO NC #${ncId} - DEV. VENTA #${originalSaleId}`, user, category: 'DEVOLUCION', financialType: 'Variable', amount: ref.amount, accountId: ref.accountId, referenceId: ref.reference });
          });
      }
  }, [session, handleAddCashMovement]);

  const handleAddService = useCallback((s: ServiceOrder) => {
      setServices(prev => [s, ...prev]);
  }, []);

  const handleUniversalTransfer = useCallback((fromId: string, toId: string, amount: number, exchangeRate: number, reference: string, opNumber: string) => {
      const transferId = Math.random().toString(36).substr(2, 9);
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE');
      const user = session?.user.fullName || 'Admin';
      const fromAcc = fromId === 'CASH' ? { bankName: 'CAJA CHICA', currency: 'PEN', alias: 'CAJA' } : bankAccounts.find(a => a.id === fromId);
      const toAcc = toId === 'CASH' ? { bankName: 'CAJA CHICA', currency: 'PEN', alias: 'CAJA' } : bankAccounts.find(a => a.id === toId);
      if (!fromAcc || !toAcc) return;
      let finalAmount = amount;
      if (fromAcc.currency !== toAcc.currency) {
          if (fromAcc.currency === 'USD' && toAcc.currency === 'PEN') finalAmount = amount * exchangeRate;
          else if (fromAcc.currency === 'PEN' && toAcc.currency === 'USD') finalAmount = amount / exchangeRate;
      }
      const nameFrom = (fromAcc.alias || fromAcc.bankName).toUpperCase();
      const nameTo = (toAcc.alias || toAcc.bankName).toUpperCase();
      const egress: CashMovement = { id: `TR-OUT-${transferId}`, date, time, type: 'Egreso', paymentMethod: fromId === 'CASH' ? 'Efectivo' : 'Transferencia', concept: `SALIDA ${nameFrom} -> ${nameTo} [${fromAcc.currency}] - OP: ${opNumber} - ${reference || ''}`.toUpperCase(), amount, user, category: 'TRANSFERENCIA', financialType: 'Variable', accountId: fromId === 'CASH' ? undefined : fromId, currency: fromAcc.currency, referenceId: opNumber ? opNumber.toUpperCase() : undefined };
      const ingress: CashMovement = { id: `TR-IN-${transferId}`, date, time, type: 'Ingreso', paymentMethod: toId === 'CASH' ? 'Efectivo' : 'Transferencia', concept: `INGRESO ${nameTo} <- ${nameFrom} [${toAcc.currency}] - OP: ${opNumber} - ${reference || ''}`.toUpperCase(), amount: finalAmount, user, category: 'TRANSFERENCIA', financialType: 'Variable', accountId: toId === 'CASH' ? undefined : toId, currency: toAcc.currency, referenceId: opNumber ? opNumber.toUpperCase() : undefined };
      setCashMovements(prev => [egress, ingress, ...prev]);
  }, [session, bankAccounts]);

  const handleUpdateClientWallet = useCallback((clientId: string, amountChange: number, reason: string, paymentMethod?: PaymentMethodType, accountId?: string) => {
      setClients(prevClients => prevClients.map(c => c.id === clientId ? { ...c, digitalBalance: c.digitalBalance + amountChange } : c));
      const move: CashMovement = { id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE'), type: amountChange > 0 ? 'Ingreso' : 'Egreso', paymentMethod: paymentMethod || 'Efectivo', concept: `BILLETERA CLIENTE: ${reason} (ID: ${clientId})`, amount: Math.abs(amountChange), user: session?.user.fullName || 'Admin', category: 'BILLETERA DIGITAL', financialType: 'Variable', accountId: (paymentMethod !== 'Efectivo' && accountId) ? accountId : undefined };
      setCashMovements(prev => [move, ...prev]);
  }, [session]);

  const handleOpenCashBox = (openingCash: number, notes: string, banks: Record<string, string>) => {
      const user = session?.user.fullName || 'ADMIN';
      const newSession: CashBoxSession = { id: 'SES-' + Date.now(), openingDate: `${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, openingUser: user, status: 'OPEN', expectedOpening: lastClosingCash, countedOpening: openingCash, openingDifference: openingCash - lastClosingCash, openingNotes: notes, confirmedDigitalAtOpen: Object.fromEntries(Object.entries(banks).map(([k,v]) => [k, parseFloat(v)])), closingDate: '', closingUser: '', expectedCashAtClose: 0, countedCashAtClose: 0, cashDifferenceAtClose: 0, expectedDigitalAtClose: 0, confirmedDigitalAtClose: {}, closingNotes: '' };
      setCashSessions([newSession, ...cashSessions]);
      setIsCashBoxOpen(true);
  };

  const handleCloseCashBox = (counted: number, sysCash: number, sysDigital: number, notes: string, banks: Record<string, string>) => {
      const user = session?.user.fullName || 'ADMIN';
      setCashSessions(prev => prev.map(s => s.status === 'OPEN' ? { ...s, status: 'CLOSED', closingDate: `${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, closingUser: user, expectedCashAtClose: sysCash, countedCashAtClose: counted, cashDifferenceAtClose: counted - sysCash, expectedDigitalAtClose: sysDigital, confirmedDigitalAtClose: Object.fromEntries(Object.entries(banks).map(([k,v]) => [k, parseFloat(v)])), closingNotes: notes } : s));
      setIsCashBoxOpen(false);
      setLastClosingCash(counted);
  };

  const renderCurrentView = () => {
    if (!session) return null;
    switch (currentView) {
      case ViewState.SUPER_ADMIN_DASHBOARD:
        return <SuperAdminModule tenants={tenants} onAddTenant={(t, u) => { setTenants([...tenants, t]); setSystemUsers([...systemUsers, u]); }} onUpdateTenant={(id, updates, newPass) => { setTenants(tenants.map(t => t.id === id ? { ...t, ...updates } : t)); if (newPass) setSystemUsers(systemUsers.map(u => { const tenant = tenants.find(ten => ten.id === id); if (u.companyName === tenant?.companyName && u.role === 'ADMIN') return { ...u, password: newPass }; return u; })); }} onDeleteTenant={id => setTenants(tenants.filter(t => t.id !== id))} onResetTenantData={id => alert("Datos restablecidos.")} />;
      case ViewState.POS: return <SalesModule products={products} clients={clients} categories={categories} purchasesHistory={purchasesHistory} stockMovements={stockMovements} bankAccounts={bankAccounts} locations={locations} onAddClient={c => setClients([...clients, c])} onProcessSale={handleProcessSale} cart={posCart} setCart={setPosCart} client={posClient} setClient={setPosClient} quotations={quotations} onLoadQuotation={q => { setPosCart([...q.items]); setPosClient(clients.find(c => c.name === q.clientName) || null); setQuotations(prev => prev.filter(x => x.id !== q.id)); }} onAddQuotation={q => setQuotations(prev => [q, ...prev])} systemBaseCurrency={session.baseCurrency} />;
      case ViewState.SERVICES: return <ServicesModule services={services} products={products} categories={categories} bankAccounts={bankAccounts} onAddService={handleAddService} onFinalizeService={(id, total, status, breakdown) => setServices(prev => prev.map(s => s.id === id ? { ...s, status } : s))} onMarkRepaired={id => setServices(prev => prev.map(s => s.id === id ? { ...s, status: 'Reparado' } : s))} clients={clients} locations={locations} onOpenWhatsApp={(n, p, m) => { setWsContact({ name: n, phone: p, message: m }); setCurrentView(ViewState.WHATSAPP); }} />;
      case ViewState.PURCHASES: return <PurchaseModule products={products} suppliers={suppliers} categories={categories} bankAccounts={bankAccounts} onAddSupplier={s => setSuppliers([...suppliers, s])} locations={locations} onProcessPurchase={handleProcessPurchase} systemBaseCurrency={session.baseCurrency} />;
      case ViewState.INVENTORY: return <InventoryModule products={products} brands={brands} categories={categories} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} onNavigate={setCurrentView} />;
      case ViewState.INVENTORY_ADJUSTMENT: return <InventoryAdjustmentModule products={products} salesHistory={salesHistory} onProcessInventorySession={handleProcessInventorySession} sessionUser={session.user.fullName} history={inventoryHistory} />;
      case ViewState.INVENTORY_AUDIT: return <InventoryAuditModule history={inventoryHistory} products={products} />;
      case ViewState.CASH: return <CashModule movements={cashMovements} salesHistory={salesHistory} purchasesHistory={purchasesHistory} onAddMovement={handleAddCashMovement} bankAccounts={bankAccounts} onUniversalTransfer={handleUniversalTransfer} fixedExpenseCategories={fixedExpenseCats} fixedIncomeCategories={fixedIncomeCats} onAddFixedCategory={(cat, type) => type === 'Ingreso' ? setFixedIncomeCats([...fixedIncomeCats, cat]) : setFixedExpenseCats([...fixedExpenseCats, cat])} isCashBoxOpen={isCashBoxOpen} lastClosingCash={lastClosingCash} onOpenCashBox={handleOpenCashBox} onCloseCashBox={handleCloseCashBox} systemBaseCurrency={session.baseCurrency} />;
      case ViewState.BANK_ACCOUNTS: return <BankAccountsModule bankAccounts={bankAccounts} onAddBankAccount={b => setBankAccounts([...bankAccounts, b])} onUpdateBankAccount={b => setBankAccounts(bankAccounts.map(x => x.id === b.id ? b : x))} onDeleteBankAccount={id => setBankAccounts(bankAccounts.filter(x => x.id !== id))} onUniversalTransfer={handleUniversalTransfer} />;
      case ViewState.BANK_HISTORY: return <BankHistoryModule cashMovements={cashMovements} bankAccounts={bankAccounts} />;
      case ViewState.CASH_BOX_HISTORY: return <CashBoxHistoryModule sessions={cashSessions} bankAccounts={bankAccounts} />;
      case ViewState.FIXED_EXPENSES: return <FinanceManagerModule activeTab="EXPENSES" categories={fixedExpenseCats} onAddCategory={c => setFixedExpenseCats([...fixedExpenseCats, c.toUpperCase()])} onDeleteCategory={c => setFixedExpenseCats(fixedExpenseCats.filter(x => x !== c))} />;
      case ViewState.FIXED_INCOME: return <FinanceManagerModule activeTab="INCOME" categories={fixedIncomeCats} onAddCategory={c => setFixedIncomeCats([...fixedIncomeCats, c.toUpperCase()])} onDeleteCategory={c => setFixedIncomeCats(fixedIncomeCats.filter(x => x !== c))} />;
      case ViewState.CREDIT_NOTE: return <CreditNoteModule salesHistory={salesHistory} bankAccounts={bankAccounts} onProcessCreditNote={handleProcessCreditNote} />;
      case ViewState.QUOTATIONS: return <QuotationModule quotations={quotations} onLoadQuotation={q => { setPosCart([...q.items]); setPosClient(clients.find(c => c.name === q.clientName) || null); setQuotations(prev => prev.filter(x => x.id !== q.id)); }} onDeleteQuotation={id => setQuotations(quotations.filter(x => x.id !== id))} />;
      case ViewState.CLIENTS: return <ClientsModule clients={clients} onAddClient={c => setClients([...clients, c])} locations={locations} onOpenWhatsApp={(n, p, m) => { setWsContact({ name: n, phone: p, message: m }); setCurrentView(ViewState.WHATSAPP); }} />;
      case ViewState.SUPPLIERS: return <SuppliersModule suppliers={suppliers} onAddSupplier={s => setSuppliers([...suppliers, s])} onDeleteSupplier={id => setSuppliers(suppliers.filter(x => x.id !== id))} purchasesHistory={purchasesHistory} />;
      case ViewState.WHATSAPP: return <WhatsAppModule products={products} clients={clients} chats={chats} setChats={setChats} initialContact={wsContact} />;
      case ViewState.SALES_REPORT: return <SalesReportModule salesHistory={salesHistory} />;
      case ViewState.PROFIT_REPORT: return <ProfitReportModule salesHistory={salesHistory} cashMovements={cashMovements} products={products} />;
      case ViewState.BUSINESS_EVOLUTION: return <BusinessEvolutionModule products={products} clients={clients} movements={cashMovements} />;
      case ViewState.FINANCIAL_STRATEGY: return <FinancialStrategyModule products={products} salesHistory={salesHistory} cashMovements={cashMovements} onAddCashMovement={handleAddCashMovement} />;
      case ViewState.CLIENT_WALLET: return <ClientWalletModule clients={clients} locations={locations} onUpdateClientBalance={handleUpdateClientWallet} onAddClient={c => setClients([...clients, c])} bankAccounts={bankAccounts} />;
      case ViewState.LOCATIONS: return <LocationsModule locations={locations} onAddLocation={l => setLocations([...locations, l])} onDeleteLocation={id => setLocations(locations.filter(l => l.id !== id))} onResetLocations={() => setLocations(MOCK_LOCATIONS)} />;
      case ViewState.MANAGE_RESOURCES: return <ResourceManagement brands={brands} onAddBrand={b => setBrands([...brands, b])} onDeleteBrand={id => setBrands(brands.filter(b => b.id !== id))} categories={categories} onAddCategory={c => setCategories([...categories, c])} onDeleteCategory={id => setCategories(categories.filter(c => c.id !== id))} />;
      case ViewState.KARDEX_HISTORY: return <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="kardex" products={products} />;
      case ViewState.HISTORY_QUERIES: return <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="ventas" products={products} />;
      case ViewState.PURCHASES_HISTORY: return <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="compras" products={products} />;
      case ViewState.INGRESOS_HISTORY: return <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="ingresos" products={products} />;
      case ViewState.EGRESOS_HISTORY: return <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="egresos" products={products} />;
      case ViewState.PRODUCT_HISTORY_HISTORY: return <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="historial_producto" products={products} />;
      case ViewState.CREDIT_NOTE_HISTORY: return <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="notas_credito" products={products} />;
      case ViewState.DATABASE_CONFIG: return <DatabaseModule isSyncEnabled={isSyncEnabled} data={{products, clients, movements: cashMovements, sales: salesHistory, services, suppliers, brands, categories, bankAccounts}} onSyncDownload={d => { setProducts(d.products); setClients(d.clients); }} />;
      case ViewState.USER_PRIVILEGES: return <UserPrivilegesModule users={systemUsers} onAddUser={u => setSystemUsers([...systemUsers, u])} onUpdateUser={u => setSystemUsers(systemUsers.map(x => x.id === u.id ? u : x))} onDeleteUser={id => setSystemUsers(systemUsers.filter(u => u.id !== id))} />;
      case ViewState.COMPANY_PROFILE: return <CompanyProfileModule companyName={session.businessName} onUpdateCompanyName={n => setSession({...session, businessName: n})} companyLogo={companyLogo} onUpdateLogo={setCompanyLogo} baseCurrency={session.baseCurrency} onUpdateBaseCurrency={c => setSession({...session, baseCurrency: c})} />;
      case ViewState.MEDIA_EDITOR: return <MediaEditorModule onUpdateHeroImage={setHeroImage} onUpdateFeatureImage={setFeatureImage} />;
      case ViewState.CONFIG_PRINTER: return <PrintConfigModule />;
      case ViewState.SYSTEM_DIAGNOSTICS: return <SystemDiagnosticsModule products={products} cashMovements={cashMovements} stockMovements={stockMovements} onAddCashMovement={handleAddCashMovement} onAddProduct={handleAddProduct} onProcessSale={handleProcessSale} onProcessPurchase={handleProcessPurchase} onProcessCreditNote={handleProcessCreditNote} onAddService={handleAddService} />;
      default: return <Dashboard onNavigate={setCurrentView} session={session} cashMovements={cashMovements} clients={clients} services={services} products={products} navStructure={navStructure} />;
    }
  };

  if (!session) return <LoginScreen onLogin={u => { const tenant = tenants.find(t => t.companyName === u.companyName); setSession({ user: u, businessName: u.companyName, token: 'session_active', baseCurrency: tenant?.baseCurrency || 'PEN' }); if (u.role === 'SUPER_ADMIN') setCurrentView(ViewState.SUPER_ADMIN_DASHBOARD); else setCurrentView(ViewState.DASHBOARD); }} users={systemUsers} tenants={tenants} heroImage={heroImage} featureImage={featureImage} />;

  return (
    <div className={`flex flex-col h-screen w-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden transition-colors duration-300 font-sans ${isDarkMode ? 'dark' : ''}`}>
      <Layout companyName={session.businessName} companyLogo={companyLogo} navStructure={navStructure} currentView={currentView} onNavigate={v => { setWsContact(undefined); setCurrentView(v); }} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} session={session} onLogout={() => setSession(null)} isSyncEnabled={isSyncEnabled} toggleSyncMode={() => setIsSyncEnabled(!isSyncEnabled)}>
        {renderCurrentView()}
      </Layout>
    </div>
  );
};

export default App;

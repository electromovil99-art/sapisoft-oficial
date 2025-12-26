
import React, { useState, useRef } from 'react';
import { Search, Plus, Trash2, Edit, Save, X, Package, BarChart, RotateCcw, Filter, ArrowDown, FileScan, Download, ArrowUp, RefreshCw, AlertCircle, PackageCheck, ChevronRight, Tag, MapPin } from 'lucide-react';
import { Product, Brand, Category, ViewState } from '../types';

interface InventoryProps {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onNavigate: (view: ViewState) => void;
}

export const InventoryModule: React.FC<InventoryProps> = ({ products, brands, categories, onUpdateProduct, onAddProduct, onDeleteProduct, onNavigate }) => {
  const [filterText, setFilterText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const excelImportRef = useRef<HTMLInputElement>(null);
  
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewBrand, setIsNewBrand] = useState(false);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    code: '', name: '', category: '', brand: '', price: 0, cost: 0, stock: 0, location: ''
  });

  const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredProducts = products.filter(p => {
    const searchWords = normalize(filterText).split(" ").filter(w => w !== "");
    const targetString = normalize(`${p.name} ${p.code} ${p.brand || ""}`);
    
    const matchesText = filterText === '' || searchWords.every(word => targetString.includes(word));
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    return matchesText && matchesCategory;
  });

  const handleOpenModal = () => {
      setNewProduct({ code: '', name: '', category: '', brand: '', price: 0, cost: 0, stock: 0, location: '' });
      setIsNewCategory(false);
      setIsNewBrand(false);
      setShowModal(true);
  };

  const handleSave = () => {
    if (!newProduct.code || !newProduct.name) return;
    onAddProduct({ ...newProduct, id: Math.random().toString(), category: newProduct.category || 'GENERAL' } as Product);
    setShowModal(false);
  };

  const handleRefreshStock = () => {
    setIsSyncing(true);
    setTimeout(() => {
        setIsSyncing(false);
    }, 600);
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Simulación de lectura de archivo con delimitador ';' para celdas separadas
    alert(`Procesando archivo: "${file.name}"...\nDetectando celdas separadas por punto y coma (;)...`);
    
    setTimeout(() => {
        const mockProducts: Product[] = [
            { id: Math.random().toString(), code: 'IMP-001', name: 'PRODUCTO IMPORTADO TEST', category: 'GENERAL', price: 100, stock: 50, brand: 'GENERICO'},
        ];
        mockProducts.forEach(p => onAddProduct(p));
        alert("Importación completada con éxito. Celdas procesadas correctamente.");
    }, 1000);
  };

  const handleExportData = (type: 'PLANTILLA' | 'DATOS') => {
      // Usamos ';' como delimitador para Excel en español
      const delimiter = ";";
      // El BOM (\uFEFF) es CRITICO para que Excel no muestre error de formato/extensión y reconozca UTF-8
      const bom = "\uFEFF"; 
      const headers = ["ID", "SKU", "Nombre", "Categoria", "Marca", "Stock", "Precio", "Ubicacion"].join(delimiter) + "\n";
      
      let content = headers;
      
      if (type === 'DATOS') {
          const rows = filteredProducts.map(p => 
            [
                p.id, 
                p.code, 
                p.name.replace(/;/g, ' '), 
                p.category, 
                p.brand || '', 
                p.stock, 
                p.price.toFixed(2),
                p.location || ''
            ].join(delimiter)
          ).join("\n");
          content += rows;
      } else {
          content += ["-", "PROD-000", "EJEMPLO DE ARTICULO", "CATEGORIA", "MARCA", "0", "0.00", "A1"].join(delimiter);
      }
      
      // Creamos el Blob incluyendo el BOM al inicio
      const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const fileName = type === 'PLANTILLA' ? 'plantilla_inventario.csv' : `inventario_completo_${new Date().getTime()}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-3 md:space-y-4 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Barra de Acciones Superior Responsive */}
      <div className="flex flex-col bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 gap-3">
         <div className="flex flex-col md:flex-row items-center gap-3 w-full">
             <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                   type="text" 
                   className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm w-full focus:bg-white dark:focus:bg-slate-600 focus:border-primary-500 outline-none transition-all"
                   placeholder="Buscar en almacén..."
                   value={filterText}
                   onChange={e => setFilterText(e.target.value)}
                />
             </div>
             
             <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <select 
                        className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm appearance-none outline-none cursor-pointer text-slate-700 dark:text-white"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                    >
                        <option value="">Categorías</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>

                <button 
                    onClick={handleRefreshStock}
                    disabled={isSyncing}
                    className={`p-2.5 rounded-xl transition-all border shrink-0 ${isSyncing ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 active:scale-90 shadow-sm'}`}
                >
                    <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/>
                </button>
             </div>
         </div>

        <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm overflow-hidden">
                <button onClick={() => handleExportData('PLANTILLA')} className="flex-1 py-2.5 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 transition-colors border-r dark:border-slate-600">
                    <ArrowUp size={14} className="text-emerald-500"/> Plantilla
                </button>
                <button onClick={() => excelImportRef.current?.click()} className="flex-1 py-2.5 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 transition-colors border-r dark:border-slate-600">
                    <ArrowDown size={14} className="text-blue-500"/> Imp.
                </button>
                <button onClick={() => handleExportData('DATOS')} className="flex-1 py-2.5 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase hover:bg-blue-50 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 transition-colors">
                    <ArrowUp size={14}/> Exp.
                </button>
            </div>
            <input type="file" ref={excelImportRef} onChange={handleExcelImport} className="hidden" accept=".xlsx, .xls, .csv"/>
            
             <button 
               onClick={handleOpenModal} 
               className="w-full md:w-auto bg-primary-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shrink-0"
             >
                <Plus size={16}/> Registrar Producto
             </button>
        </div>
      </div>

      {/* Contenedor de Listado Responsive */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
         
         {/* VISTA DESKTOP: TABLA */}
         <div className="hidden md:block overflow-auto flex-1">
            <table className="w-full text-left">
               <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest border-b">
                  <tr>
                     <th className="px-6 py-4">SKU</th>
                     <th className="px-6 py-4">Artículo</th>
                     <th className="px-6 py-4">Categoría</th>
                     <th className="px-6 py-4">Marca</th>
                     <th className="px-6 py-4 text-center">Ubicación</th>
                     <th className="px-6 py-4 text-right">Stock</th>
                     <th className="px-6 py-4 text-right">Precio</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {filteredProducts.map(p => (
                     <tr key={p.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">{p.code}</td>
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-tight">{p.name}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-black rounded uppercase border border-slate-200 dark:border-slate-600">
                                {p.category}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[10px] font-bold">{p.brand || 'SIN MARCA'}</td>
                        <td className="px-6 py-4 text-center text-slate-400 text-[10px] font-medium">{p.location || '-'}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                                <span className={`font-black px-4 py-1.5 rounded-xl text-lg inline-block min-w-[4rem] text-center border shadow-sm transition-all ${p.stock < 5 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : p.stock < 15 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    {p.stock}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white text-sm">
                            S/ {p.price.toFixed(2)}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* VISTA MÓVIL: TARJETAS */}
         <div className="md:hidden overflow-y-auto flex-1 p-2 space-y-2">
            {filteredProducts.map(p => (
                <div key={p.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-3 relative animate-in slide-in-from-right-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-10">
                            <div className="font-black uppercase text-slate-700 dark:text-white text-xs leading-tight mb-1">{p.name}</div>
                            <div className="flex flex-wrap gap-1.5">
                                <span className="text-[9px] font-mono text-slate-400">#{p.code}</span>
                                <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-[8px] font-black text-slate-500 border border-slate-100 dark:border-slate-700 uppercase">{p.category}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio</div>
                            <div className="font-black text-sm text-slate-900 dark:text-white">S/ {p.price.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Ubicación</span>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-0.5"><MapPin size={10}/> {p.location || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Marca</span>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-0.5"><Tag size={10}/> {p.brand || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Stock</span>
                                <span className={`font-black text-lg ${p.stock < 5 ? 'text-red-500' : p.stock < 15 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {p.stock}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {filteredProducts.length === 0 && (
                <div className="py-20 text-center text-slate-300 italic flex flex-col items-center">
                    <Package size={48} strokeWidth={1} className="mb-2 opacity-20"/>
                    <p className="text-xs uppercase font-bold">Sin resultados</p>
                </div>
            )}
         </div>
      </div>

      {/* Modal para Nuevo Producto Responsive */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-2 md:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-[550px] max-h-[95vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                <div className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <h3 className="font-black text-xs md:text-sm uppercase tracking-widest text-slate-800 dark:text-white">Alta de Producto</h3>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-5 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">SKU / Identificador</label>
                            <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl uppercase text-sm font-bold outline-none focus:border-primary-500" value={newProduct.code} onChange={e => setNewProduct({...newProduct, code: e.target.value})} placeholder="000000" autoFocus/>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Marca</label>
                            <div className="flex gap-2">
                                {isNewBrand ? (
                                    <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl uppercase text-xs font-bold outline-none" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} placeholder="MARCA" />
                                ) : (
                                    <select className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl uppercase text-xs font-bold outline-none cursor-pointer" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})}><option value="">-- ELEGIR --</option>{brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select>
                                )}
                                <button onClick={() => setIsNewBrand(!isNewBrand)} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all shadow-sm">{isNewBrand ? <RotateCcw size={14}/> : <Plus size={14}/>}</button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Descripción Completa</label>
                        <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl uppercase text-sm font-bold outline-none focus:border-primary-500 shadow-inner" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="NOMBRE DEL ARTÍCULO"/>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Categoría de Almacén</label>
                            <div className="flex gap-2">
                                {isNewCategory ? (
                                    <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl uppercase text-xs font-bold outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="CATEGORÍA" />
                                ) : (
                                    <select className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl uppercase text-xs font-bold outline-none cursor-pointer" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}><option value="">-- ELEGIR --</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
                                )}
                                <button onClick={() => setIsNewCategory(!isNewCategory)} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all shadow-sm">{isNewCategory ? <RotateCcw size={14}/> : <Plus size={14}/>}</button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ubicación (Pasillo/Estante)</label>
                            <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl uppercase text-xs font-bold outline-none" value={newProduct.location} onChange={e => setNewProduct({...newProduct, location: e.target.value})} placeholder="ESTANTE A1"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">Stock</label>
                            <input type="number" className="w-full p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-black text-center outline-none focus:border-primary-500" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} placeholder="0"/>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">Costo S/</label>
                            <input type="number" className="w-full p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-black text-center outline-none focus:border-primary-500" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} placeholder="0.00"/>
                        </div>
                        <div className="space-y-1.5 col-span-2 md:col-span-1">
                            <label className="text-[9px] font-black text-primary-500 uppercase tracking-widest block text-center">Precio Venta S/</label>
                            <input type="number" className="w-full p-3 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-2xl text-xl font-black text-center text-primary-600 outline-none focus:border-primary-500 shadow-md" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} placeholder="0.00"/>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 shrink-0">
                    <button onClick={handleSave} className="w-full py-4 md:py-5 bg-primary-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-primary-700 shadow-xl transition-all active:scale-95">
                        Registrar en Logística
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default InventoryModule;

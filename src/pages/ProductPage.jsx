import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function ProductPage() {
  const { lang, t } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  
  // 弹窗状态
  const [showAdd, setShowAdd] = useState(false);
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // 表单状态
  const [form, setForm] = useState({ name: '', nameEn: '', nameId: '', sellingPrice: 0, category: '奶茶' });
  const [editId, setEditId] = useState(null);
  const [bulkForm, setBulkForm] = useState({ category: 'ALL', percentage: 0 });
  
  // 配方弹窗状态
  const [bomItems, setBomItems] = useState([]);       // [{inventoryId, name, quantity}]
  const [inventory, setInventory] = useState([]);    // 原料列表
  const [selectedIngredient, setSelectedIngredient] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await api('GET', '/products');
    setProducts(Array.isArray(data) ? data : (data?.data || []));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleToggleShelve = async (product, e) => {
    e?.stopPropagation();
    setTogglingId(product.id);
    try {
      const newStatus = product.isActive ? false : true;
      const res = await api('PUT', `/products/${product.id}/shelve`, { isActive: newStatus });
      if (res && !res.error) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: newStatus } : p));
      }
    } finally {
      setTogglingId(null);
    }
  };

  const loadInventory = async () => {
    try {
      const invData = await api('GET', '/inventory');
      setInventory(Array.isArray(invData) ? invData : (invData?.data || []));
    } catch (e) { console.warn('原料库加载失败', e); }
  };

  const handleAddBomItem = () => {
    if (!selectedIngredient) return;
    const inv = inventory.find(i => i.id.toString() === selectedIngredient);
    if (!inv) return;
    if (bomItems.some(b => b.inventoryId === inv.id)) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: t('bomItemExists') || '该原料已添加' }));
      return;
    }
    setBomItems([...bomItems, { inventoryId: inv.id, name: inv.name, quantity: 1 }]);
    setSelectedIngredient('');
  };

  const handleRemoveBomItem = (inventoryId) => {
    setBomItems(bomItems.filter(b => b.inventoryId !== inventoryId));
  };

  const handleBomQtyChange = (inventoryId, qty) => {
    setBomItems(bomItems.map(b => b.inventoryId === inventoryId ? { ...b, quantity: Math.max(0.01, qty) } : b));
  };

  const handleOpenAddModal = async (product = null) => {
    setForm(product ? { name: product.name, nameEn: product.nameEn || '', nameId: product.nameId || '', sellingPrice: product.sellingPrice, category: product.category } : { name: '', nameEn: '', nameId: '', sellingPrice: 0, category: '奶茶' });
    setEditId(product ? product.id : null);
    setBomItems([]);
    setSelectedIngredient('');
    await loadInventory();
    // 如果是编辑，加载现有 BOM
    if (product?.id) {
      try {
        const bomData = await api('GET', `/bom?productName=${encodeURIComponent(product.name)}`);
        const items = Array.isArray(bomData) ? bomData : (bomData?.data || []);
        setBomItems(items.map(b => ({ inventoryId: b.inventoryId, name: b.inventoryName || b.name || b.inventory?.name, quantity: b.usageAmount || b.quantity || 1 })));
      } catch (e) {}
    }
    setShowAdd(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = editId
      ? await api('PUT', `/products/${editId}`, form)
      : await api('POST', '/products', form);
    if (!result?.error) {
      const savedProduct = result?.data || result;
      const productId = savedProduct?.id || result?.id || editId;
      // 保存 BOM
      if (productId && bomItems.length > 0) {
        for (const item of bomItems) {
          await api('POST', '/bom', {
            productId: parseInt(productId),
            inventoryId: parseInt(item.inventoryId),
            quantity: parseFloat(item.quantity),
            productName: form.name,
          }).catch(e => console.warn('BOM保存失败', e));
        }
      }
      setShowAdd(false); setEditId(null); setForm({ name: '', nameEn: '', nameId: '', sellingPrice: 0, category: '奶茶' });
      setBomItems([]);
      loadData();
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!confirm(t('bulkPriceConfirm'))) return;
    const factor = 1 + (bulkForm.percentage / 100);
    const targets = products.filter(p => bulkForm.category === 'ALL' || p.category === bulkForm.category);
    
    let success = 0;
    for (const p of targets) {
      const newPrice = Math.round(p.sellingPrice * factor);
      const res = await api('PUT', `/products/${p.id}`, { ...p, sellingPrice: newPrice });
      if (!res.error) success++;
    }
    
    window.dispatchEvent(new CustomEvent('app:success', { detail: t('bulkPriceUpdated') + (success > 1 ? ` (${success})` : '') }));
    setShowBulkPrice(false); loadData();
  };

  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  return (
    <div className="page animate-soft space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <span className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-xl">🧋</span>
             {t('productHubTitle')}
          </h2>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('productPortfolioManagement')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowBulkPrice(true)} className="btn-action bg-slate-100 text-slate-600 border border-slate-200 !px-4">
             ⚡ {t('bulkPriceUpdate')}
          </button>
          <button onClick={() => handleOpenAddModal()} className="btn-action btn-primary-dark !px-8">
             + {t('addNewProduct')}
          </button>
        </div>
      </div>

      {/* Product List - Table Format */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('productName')}</th>
                <th className="px-4 py-3 text-left text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('productCategory')}</th>
                <th className="px-4 py-3 text-right text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('productPrice')}</th>
                <th className="px-4 py-3 text-center text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('bomFormula')}</th>
                <th className="px-4 py-3 text-center text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('productStatus')}</th>
                <th className="px-4 py-3 text-center text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('productOperation')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} onClick={() => handleOpenAddModal(p)} className="border-b border-slate-50 hover:bg-orange-50/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-800 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.nameEn || '-'} {p.nameId ? '| ' + p.nameId : ''}</div>
                  </td>
                  <td className="px-4 py-3"><span className="badge-pill bg-orange-50 text-orange-600 border-none text-[12px]">{p.category}</span></td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">{t('currencySymbol')} {p.sellingPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[12px] font-black px-4 py-1 rounded-full ${p.bomItemsCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{p.bomItemsCount > 0 ? p.bomItemsCount + ' ' + t('bomUnit') : t('notConfigured')}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => handleToggleShelve(p, e)}
                      disabled={togglingId === p.id}
                      className={`px-4 py-3 rounded-full text-[12px] font-black uppercase tracking-widest border transition-all active:scale-95 ${p.isActive !== false ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20 hover:bg-red-500 hover:border-red-600' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-600'}`}
                      title={p.isActive !== false ? t('clickToUnshelve') : t('clickToShelve')}
                    >
                      {togglingId === p.id ? '...' : p.isActive !== false ? '🟢 ' + t('productOnShelf') : '⚫ ' + t('productOffShelf')}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center"><button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(p); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. 批量调价弹窗 */}
      {showBulkPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="card-premium w-full max-w-sm m-0 shadow-2xl animate-soft">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">🚀 {t('bulkPriceStrategy')}</h3>
            <div className="space-y-4">
               <div>
                  <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">{t('selectApplyScope')}</label>
                  <select className="input-premium" value={bulkForm.category} onChange={e => setBulkForm({...bulkForm, category: e.target.value})}>
                     {categories.map(c => <option key={c} value={c}>{c === 'ALL' ? t('allProducts') : c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">{t('priceAdjustmentRatio')}</label>
                  <div className="relative">
                    <input className="input-premium !text-2xl !font-black !text-indigo-600" type="text" inputMode="numeric" value={bulkForm.percentage || ''} onChange={e => { const v = e.target.value.replace(/[^0-9]/g,''); setBulkForm({...bulkForm, percentage: v ? parseInt(v) : 0}); }} />
                    <span className="absolute right-4 top-4 text-slate-300 font-bold">%</span>
                  </div>
                  <p className="text-[14px] text-slate-400 mt-2 font-medium">{t('bulkPriceHint')}</p>
               </div>
               <div className="flex gap-2 pt-2">
                  <button onClick={handleBulkPriceUpdate} className="btn-action btn-primary-dark flex-1">{t('executeBulkPrice')}</button>
                  <button onClick={() => setShowBulkPrice(false)} className="btn-action bg-slate-50 text-slate-400">{t('close')}</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 新增/编辑产品弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="card-premium w-full max-w-lg m-0 shadow-2xl animate-soft max-h-[90vh] overflow-y-auto">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">{editId ? t('editProduct') : t('addNewProduct')}</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                   <div>
                      <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">{t('chineseName')} *</label>
                      <input className="input-premium" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="如：波霸奶茶" />
                   </div>
                   <div>
                      <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">🇬🇧 {t('langEN')}</label>
                      <input className="input-premium" value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} placeholder="如：Boba Milk Tea" />
                   </div>
                   <div>
                      <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">🇮🇩 {t('langID')}</label>
                      <input className="input-premium" value={form.nameId} onChange={e => setForm({...form, nameId: e.target.value})} placeholder="如：Teh Susu Boba" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">{t('sellingPriceLabel')} ({t('currencySymbol')})</label>
                      <input className="input-premium" type="text" inputMode="numeric" value={form.sellingPrice || ''} onChange={e => { const v = e.target.value.replace(/[^0-9]/g,''); setForm({...form, sellingPrice: v ? parseInt(v) : 0}); }} />
                   </div>
                   <div>
                      <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">{t('categoryLabel')}</label>
                      <select className="input-premium" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        <option value="奶茶">{t('catMilktea')}</option>
                        <option value="果茶">{t('catFruitTea')}</option>
                        <option value="纯茶">{t('catPureTea')}</option>
                        <option value="零食">{t('catSnack')}</option>
                        <option value="其它">{t('catOther')}</option>
                      </select>
                   </div>
                </div>

                {/* 配方原料录入 */}
                <div className="border-t border-slate-100 pt-4 mt-2">
                   <div className="text-[14px] font-black text-slate-400 uppercase mb-3 tracking-wide">{t('bomFormula') || '配方原料'}</div>
                   
                   {bomItems.length > 0 && (
                     <div className="space-y-2 mb-3">
                       {bomItems.map(b => (
                         <div key={b.inventoryId} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                           <span className="flex-1 text-sm font-bold text-slate-700 truncate">{b.name}</span>
                           <input type="text" inputMode="decimal" className="input-premium text-center w-20" value={b.quantity || ''} placeholder="0.0"
                             onChange={e => { const v = e.target.value.replace(/[^0-9.]/g,''); handleBomQtyChange(b.inventoryId, v ? parseFloat(v) : 0); }}
                           />
                           <span className="text-xs text-slate-400 w-8">kg</span>
                           <button type="button" onClick={() => handleRemoveBomItem(b.inventoryId)} className="text-slate-400 hover:text-red-500 text-lg w-6">×</button>
                         </div>
                       ))}
                     </div>
                   )}

                   <div className="flex gap-2">
                     <select className="input-premium flex-1" value={selectedIngredient} onChange={e => setSelectedIngredient(e.target.value)}>
                       <option value="">{t('selectIngredient')}</option>
                       {inventory.map(inv => (
                         <option key={inv.id} value={inv.id}>{inv.name} ({inv.category || t('catOther')})</option>
                       ))}
                     </select>
                     <button type="button" onClick={handleAddBomItem} disabled={!selectedIngredient}
                       className="btn-action bg-orange-500 text-white px-4 disabled:opacity-40">
                       + 添加
                     </button>
                   </div>
                   {inventory.length === 0 && (
                     <p className="text-xs text-slate-400 mt-2">{t('inventoryEmpty')}</p>
                   )}
                </div>

                <div className="flex gap-2 pt-4">
                   <button type="submit" className="btn-action btn-primary-dark flex-1">{editId ? t('save') : t('confirm')}</button>
                   <button type="button" onClick={() => { setShowAdd(false); setBomItems([]); }} className="btn-action bg-slate-50 text-slate-400">{t('cancel')}</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* 3. 删除确认 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="card-premium max-w-sm m-0 shadow-2xl animate-soft text-center p-10">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{t('confirmDelete')}</h3>
            <p className="text-[14px] text-slate-400 font-bold mb-8">{t('deleteProductWarning')}</p>
            <div className="flex gap-2">
               <button onClick={() => { api('DELETE', `/products/${showDeleteConfirm.id}`).then(() => { loadData(); setShowDeleteConfirm(null); }); }} className="btn-action bg-red-500 text-white flex-1 shadow-lg shadow-red-500/20">{t('delete')}</button>
               <button onClick={() => setShowDeleteConfirm(null)} className="btn-action bg-slate-50 text-slate-400 flex-1">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

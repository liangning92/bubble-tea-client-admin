import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function ProductPage() {
  const { lang, t } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 弹窗状态
  const [showAdd, setShowAdd] = useState(false);
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // 表单状态
  const [form, setForm] = useState({ name: '', sellingPrice: 0, category: '奶茶' });
  const [editId, setEditId] = useState(null);
  const [bulkForm, setBulkForm] = useState({ category: 'ALL', percentage: 0 });

  const loadData = async () => {
    setLoading(true);
    const data = await api('GET', '/products');
    setProducts(Array.isArray(data) ? data : (data?.data || []));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = editId
      ? await api('PUT', `/products/${editId}`, form)
      : await api('POST', '/products', form);
    if (!result?.error) {
      setShowAdd(false); setEditId(null); setForm({ name: '', sellingPrice: 0, category: '奶茶' });
      loadData();
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!confirm('确定要对所选品类进行批量调价吗？此操作将直接更新数据库。')) return;
    const factor = 1 + (bulkForm.percentage / 100);
    const targets = products.filter(p => bulkForm.category === 'ALL' || p.category === bulkForm.category);
    
    let success = 0;
    for (const p of targets) {
      const newPrice = Math.round(p.sellingPrice * factor);
      const res = await api('PUT', `/products/${p.id}`, { ...p, sellingPrice: newPrice });
      if (!res.error) success++;
    }
    
    window.dispatchEvent(new CustomEvent('app:success', { detail: `成功更新 ${success} 个产品的价格` }));
    setShowBulkPrice(false); loadData();
  };

  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  return (
    <div className="page animate-soft space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <span className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-xl">🧋</span>
             {t('productHubTitle')}
          </h2>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mt-1">Global Product Portfolio Management</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowBulkPrice(true)} className="btn-action bg-slate-100 text-slate-600 border border-slate-200 !px-6">
             ⚡ {t('bulkPriceUpdate')}
          </button>
          <button onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: '', sellingPrice: 0, category: '奶茶' }); }} className="btn-action btn-primary-dark !px-8">
             + {t('addNewProduct')}
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="card-premium group hover:border-orange-200 transition-all cursor-pointer overflow-hidden p-0" onClick={() => { setEditId(p.id); setForm(p); setShowAdd(true); }}>
            <div className="p-6 relative">
               <div className="flex justify-between items-start mb-6">
                  <div className="badge-pill bg-orange-50 text-orange-600 border-none"><BusinessDataTranslator text={p.category} /></div>
                  <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(p); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
               </div>
               <div className="font-black text-lg text-slate-800 tracking-tight h-12 line-clamp-2"><BusinessDataTranslator text={p.name} /></div>
               <div className="mt-4 flex items-end justify-between">
                  <div>
                     <p className="text-[14px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Selling Price</p>
                     <p className="stat-value-hero !text-2xl text-slate-900">{t('currencySymbol')} {p.sellingPrice.toLocaleString()}</p>
                  </div>
                  <div className="text-2xl opacity-40 group-hover:scale-125 transition-transform">🧋</div>
               </div>
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Click to Edit Settings</span>
               <span className="text-indigo-600">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* 1. 批量调价弹窗 */}
      {showBulkPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="card-premium w-full max-w-sm m-0 shadow-2xl animate-soft">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">🚀 {t('bulkPriceStrategy')}</h3>
            <div className="space-y-6">
               <div>
                  <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">{t('selectApplyScope')}</label>
                  <select className="input-premium" value={bulkForm.category} onChange={e => setBulkForm({...bulkForm, category: e.target.value})}>
                     {categories.map(c => <option key={c} value={c}>{c === 'ALL' ? t('allProducts') : c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">调价比例 (±%)</label>
                  <div className="relative">
                    <input className="input-premium !text-2xl !font-black !text-indigo-600" type="number" value={bulkForm.percentage} onChange={e => setBulkForm({...bulkForm, percentage: parseInt(e.target.value) || 0})} />
                    <span className="absolute right-4 top-4 text-slate-300 font-bold">%</span>
                  </div>
                  <p className="text-[14px] text-slate-400 mt-2  font-medium">提示：正数加价，负数降价。例如输入 10 即全系加价 10%。</p>
               </div>
               <div className="flex gap-2 pt-2">
                  <button onClick={handleBulkPriceUpdate} className="btn-action btn-primary-dark flex-1">执行全系调价</button>
                  <button onClick={() => setShowBulkPrice(false)} className="btn-action bg-slate-50 text-slate-400">关闭</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 新增/编辑产品弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="card-premium w-full max-w-md m-0 shadow-2xl animate-soft">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-8">{editId ? t('editProduct') : t('addNewProduct')}</h3>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                   <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">{t('productNameLabel')}</label>
                   <input className="input-premium" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="手打柠檬茶" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[14px] font-black text-slate-400 uppercase mb-2 block">{t('sellingPriceLabel')} ({t('currencySymbol')})</label>
                      <input className="input-premium" type="number" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: parseInt(e.target.value) || 0})} />
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
                <div className="flex gap-2 pt-4">
                   <button type="submit" className="btn-action btn-primary-dark flex-1">{editId ? t('save') : t('confirm')}</button>
                   <button type="button" onClick={() => setShowAdd(false)} className="btn-action bg-slate-50 text-slate-400">{t('cancel')}</button>
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

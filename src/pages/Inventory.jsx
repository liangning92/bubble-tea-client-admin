import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function InventoryPage({ readOnly = false }) {
  const { t } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newMat, setNewMat] = useState({ name: '', unit: '', category: '其他', costPerKg: 0, concentrateRatio: 1 });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/inventory');
      const data = Array.isArray(res) ? res : (res?.data || []);
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteMaterialConfirm'))) return;
    try {
      const res = await api('DELETE', `/inventory/${id}`);
      if (res.error) {
        window.dispatchEvent(new CustomEvent('app:error', { detail: res.error }));
      } else {
        window.dispatchEvent(new CustomEvent('app:success', { detail: t('success') }));
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newMat.name || !newMat.unit) return;
    setSubmitting(true);
    try {
      // costPerKg: Rp/kg, concentrateRatio: 1kg原料产出多少kg成品
      const res = await api('POST', '/inventory', {
        name: newMat.name,
        unit: newMat.unit,
        category: newMat.category,
        costPerKg: newMat.costPerKg,
        concentrateRatio: newMat.concentrateRatio
      });
      if (res.error) {
        window.dispatchEvent(new CustomEvent('app:error', { detail: res.error }));
      } else {
        window.dispatchEvent(new CustomEvent('app:success', { detail: t('success') }));
        setIsModalOpen(false);
        setNewMat({ name: '', unit: '', category: '其他', costPerKg: 0, concentrateRatio: 1 });
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="py-24 text-center text-label-caps animate-pulse tracking-widest">{t('loading')}</div>;

  return (
    <div className="space-y-4 animate-soft text-slate-900 pb-10">
      <div className="flex justify-between items-center gap-3 px-4">
           <div className="flex gap-3">
             {!readOnly && (
               <button onClick={() => setIsModalOpen(true)} className="px-4 py-3 bg-slate-900 text-white font-black text-[14px] rounded-[24px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">
                 {t('addMaterial')}
               </button>
             )}
             <button onClick={loadData} className="px-5 py-3 bg-white text-slate-900 border border-slate-100 font-black text-[14px] rounded-[24px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95">
               {t('refresh')}
             </button>
           </div>
           {readOnly && (
             <span className="px-5 py-3 bg-slate-50 text-slate-400 font-black text-[14px] rounded-[24px] border border-slate-100 uppercase tracking-widest shadow-sm">
               🛡️ {t('readOnlyView')}
             </span>
           )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium border-slate-50 hover:bg-slate-50/50 transition-colors !p-6">
           <p className="text-label-caps mb-4">{t('skuCount')}</p>
           <div className="text-4xl font-black text-slate-900 tracking-tighter">{items.length}</div>
        </div>
        <div className="card-premium border-red-50 bg-red-50/10 !p-6">
           <p className="text-label-caps !text-red-600 mb-4 tracking-tighter">{t('stockAlerts')}</p>
           <div className="text-4xl font-black text-red-700 tracking-tighter">{items.filter(i => (i.stock || 0) <= (i.safeStock || 5)).length}</div>
        </div>
        <div className="card-premium border-blue-50 !p-6 lg:col-span-2 bg-blue-50/5 hover:bg-blue-50/20 transition-colors">
           <p className="text-label-caps !text-blue-600 mb-4">{t('assetValue')}</p>
           <div className="text-4xl font-black text-slate-900 tracking-tighter">{t('currencySymbol')} {items.reduce((s, x) => s + (x.stock || 0) * (x.costPerUnit || 0), 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="card-premium border-slate-100 !p-2 overflow-hidden shadow-2xl bg-white !rounded-[48px]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-4 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest rounded-tl-[40px] w-24 text-center">{t('materialCode')}</th>
                <th className="px-4 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('materialName')}</th>
                <th className="px-4 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('category')}</th>
                <th className="px-4 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest text-center">{t('onHand')}</th>
                <th className="px-4 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest text-center">{t('costPerKg')}</th>
                <th className="px-4 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest text-center">{t('concentrateRatio')}</th>
                <th className="px-4 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest text-right">{t('status')}</th>
                {!readOnly && <th className="px-4 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest text-right rounded-tr-[40px]">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => {
                const low = (item.stock || 0) <= (item.safeStock || 5);
                return (
                  <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                     <td className="px-4 py-3 text-center">
                        <span className="text-[14px] font-black text-slate-300 font-mono tracking-widest">#{item.code || '---'}</span>
                     </td>
                     <td className="px-4 py-3">
                        <div className="flex items-center gap-4">
                          <span className={`w-3 h-3 rounded-full ${low ? 'bg-red-500 animate-pulse' : 'bg-slate-200 group-hover:bg-emerald-500'} transition-colors`} />
                          <span className="text-[15px] font-black text-slate-900 tracking-tight">
                            <BusinessDataTranslator text={item.name} />
                          </span>
                        </div>
                     </td>
                     <td className="px-4 py-3">
                        <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                           <BusinessDataTranslator text={item.category || 'RAW'} />
                        </span>
                     </td>
                     <td className="px-4 py-3 text-center">
                        <span className={`text-[16px] font-black tracking-tighter ${low ? 'text-red-600' : 'text-slate-900'}`}>
                          {(item.stock || 0).toLocaleString()} <span className="text-[14px] text-slate-300 ml-1 font-bold uppercase">{item.unit || 'kg'}</span>
                        </span>
                     </td>
                     <td className="px-4 py-3 text-center">
                       <span className="text-[14px] font-black text-blue-600">
                         {parseFloat(item.costPerKg || 0) > 0 ? `${t('currencySymbol')}${parseFloat(item.costPerKg).toLocaleString()}/kg` : <span className="text-slate-300">-</span>}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-center">
                       <span className={`text-[14px] font-black ${(item.concentrateRatio || 1) > 1 ? 'text-orange-500' : 'text-slate-300'}`}>
                         {(item.concentrateRatio || 1) > 1 ? `×${item.concentrateRatio}` : '-'}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-right">
                        <span className={`px-5 py-3 rounded-full text-[14px] font-black uppercase tracking-widest border transition-all ${low ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                          {low ? t('stockLow') : t('available')}
                        </span>
                     </td>
                     {!readOnly && (
                       <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-[14px] font-black uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100">
                             {t('delete')}
                          </button>
                       </td>
                     )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增原料 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[48px] shadow-3xl p-12 space-y-8 animate-soft relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
            
            <div className="flex justify-between items-center relative z-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('newMaterialTitle')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 relative z-10">
              <div className="space-y-4">
                <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('materialNameLabel')}</label>
                <input required className="input-premium w-full !bg-slate-50 !p-5 !rounded-[24px]" value={newMat.name} onChange={e => setNewMat({...newMat, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('materialUnitLabel')}</label>
                  <input required className="input-premium w-full !bg-slate-50 !p-5 !rounded-[24px]" placeholder={t('placeholderUnit')} value={newMat.unit} onChange={e => setNewMat({...newMat, unit: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('materialCategoryLabel')}</label>
                  <select className="input-premium w-full !bg-slate-50 !p-5 !rounded-[24px] appearance-none" value={newMat.category} onChange={e => setNewMat({...newMat, category: e.target.value})}>
                    <option value="茶汤">{t('catTea')}</option>
                    <option value="鲜奶">{t('catFreshMilk')}</option>
                    <option value="糖浆">{t('catSyrup')}</option>
                    <option value="小料">{t('catTopping')}</option>
                    <option value="其他">{t('catOther')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('costPerKgLabel', '采购价 (Rp/kg)')}</label>
                  <input type="number" className="input-premium w-full !bg-slate-50 !p-5 !rounded-[24px]" value={newMat.costPerKg} onChange={e => setNewMat({...newMat, costPerKg: parseFloat(e.target.value) || 0})} placeholder="Rp/kg" />
                </div>
                <div className="space-y-4">
                  <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('concentrateRatioLabel', '浓缩比 (1kg=?)')}</label>
                  <input type="number" step="0.1" className="input-premium w-full !bg-slate-50 !p-5 !rounded-[24px]" value={newMat.concentrateRatio} onChange={e => setNewMat({...newMat, concentrateRatio: parseFloat(e.target.value) || 1})} placeholder={t('placeholderRatio')} />
                </div>
              </div>
              <p className="text-[12px] text-slate-400 font-medium pl-2">
                {newMat.concentrateRatio > 1
                  ? t('hintConcentrate').replace('{ratio}', newMat.concentrateRatio).replace('{cost}', newMat.costPerKg > 0 ? (newMat.costPerKg / newMat.concentrateRatio).toLocaleString() : '0')
                  : t('hintNoConcentrate')
                }
              </p>

              <div className="pt-4">
                <button type="submit" disabled={submitting} className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-[24px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                  {submitting ? '...' : t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 底部政策卡片 */}
      <div className="p-10 bg-slate-50 rounded-[56px] border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-10 relative overflow-hidden group shadow-sm">
         <div className="absolute top-0 left-0 w-2 h-full bg-marigold opacity-80"></div>
         <div className="space-y-4 relative z-10 flex-1">
            <h4 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               <span className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-sm">🛡️</span>
               {t('inventoryPolicyTitle')}
            </h4>
            <p className="text-[14px] text-slate-400 font-bold max-w-2xl leading-relaxed">
               {t('inventoryPolicyDesc')}
            </p>
         </div>
         <div className="flex gap-4 relative z-10 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none px-10 py-3 bg-white text-slate-900 border border-slate-200 text-[14px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all shadow-sm active:scale-95">{t('exportExcel')}</button>
            <button className="flex-1 lg:flex-none px-10 py-3 bg-slate-900 text-marigold text-[14px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-900/10 active:scale-95">{t('viewTrends')}</button>
         </div>
      </div>
    </div>
  );
}

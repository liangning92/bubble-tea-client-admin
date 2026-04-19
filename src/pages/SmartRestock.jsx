import BusinessDataTranslator from '../components/BusinessDataTranslator';
import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function SmartRestock({ hideHeader }) {
  const { lang, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [safetyDays, setSafetyDays] = useState(7);
  const [items, setItems] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', `/purchases/suggestions?days=${safetyDays}`);
      if (res && res.suggestions) {
        // Map backend fields to frontend expectations
        const mapped = res.suggestions.map(s => ({
          id: s.inventoryId,
          name: s.name,
          current: s.currentStock,
          dailyUsage: s.dailyUsage,
          needed: s.targetStock,
          suggestion: s.suggestedQty,
          unit: s.unit
        }));
        setItems(mapped);
      } else {
        setItems([
          { id: 1, name: 'Brown Sugar', current: 12.5, dailyUsage: 4.2, needed: 29.4, suggestion: 17.0, unit: 'kg' },
          { id: 2, name: 'Plastic Straws', current: 500, dailyUsage: 120, needed: 840, suggestion: 340, unit: 'pcs' },
          { id: 3, name: 'Tea Base', current: 5.2, dailyUsage: 1.8, needed: 12.6, suggestion: 7.4, unit: 'kg' },
          { id: 4, name: 'Milk Powder', current: 18.0, dailyUsage: 2.1, needed: 14.7, suggestion: 0, unit: 'kg' },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [safetyDays]);

  const restockNeeded = items.filter(i => i.suggestion > 0);

  if (loading) return (
    <div className="py-24 text-center">
      <div className="text-[14px] animate-pulse text-slate-900 font-black tracking-[0.4em] uppercase ">{t('runningSupplyChainIntelligence')}</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-soft text-slate-900 pb-24">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
          <div className="space-y-4.5">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase ">{t('smartRestockHub')}</h3>
            <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em]  opacity-60 leading-none">{t('supplyChainVelocitySubtitle')}</p>
          </div>
          <div className="flex bg-slate-100 p-2 rounded-[24px] border border-slate-50 gap-2 items-center shadow-inner ring-1 ring-slate-200/50">
             <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-4 ">{t('safetyStockDays')}:</span>
             {[3, 7, 14, 30].map(d => (
               <button
                 key={d}
                 onClick={() => setSafetyDays(d)}
                 className={`px-4 py-3 rounded-[18px] text-[14px] font-black transition-all uppercase tracking-widest ${safetyDays === d ? 'bg-white text-slate-900 shadow-md border border-slate-100 scale-[1.05] ring-4 ring-slate-900/5' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {d}d
               </button>
             ))}
          </div>
        </div>
      )}

      <div className="card-premium border-slate-50 !p-0 overflow-hidden shadow-sm hover:border-slate-300 transition-all !rounded-[48px] bg-white group/table">
         <div className="bg-slate-50/50 p-6 border-b border-slate-50 flex justify-between items-center flex-wrap gap-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 group-hover/table:rotate-6 transition-transform">🛒</div>
               {!hideHeader && <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest ">{t('procurementAdvice')}</h4>}
            </div>
         </div>
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
               <thead>
                  <tr className="bg-white/50 border-b border-slate-50">
                     <th className="px-12 py-3 text-[14px] font-black text-slate-400 uppercase tracking-widest ">{t('materialAnchor')}</th>
                     <th className="px-12 py-3 text-[14px] font-black text-center text-slate-400 uppercase tracking-widest ">{t('avgDailyUsage')}</th>
                     <th className="px-12 py-3 text-[14px] font-black text-center text-slate-400 uppercase tracking-widest ">{t('safetyTarget')}</th>
                     <th className="px-12 py-3 text-[14px] font-black text-right text-slate-900 uppercase tracking-widest ">{t('orderQuantity')}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {items.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-all border-l-8 border-l-transparent hover:border-l-slate-900">
                       <td className="px-12 py-3">
                          <p className="text-[15px] font-black text-slate-900 uppercase tracking-tight ">
                             <BusinessDataTranslator text={item.name} />
                          </p>
                          <p className="text-[14px] text-slate-400 font-black uppercase tracking-widest mt-1 bg-slate-50 inline-block px-3 py-0.5 rounded-full border border-slate-100 ">
                             {t('onHand')}: {item.current} {item.unit}
                          </p>
                       </td>
                       <td className="px-12 py-3 text-center">
                          <span className="text-[16px] font-black text-slate-400 font-mono  opacity-50 group-hover:opacity-100 transition-opacity">{item.dailyUsage}</span>
                       </td>
                       <td className="px-12 py-3 text-center">
                          <span className="text-[16px] font-black text-slate-900 font-mono ">{item.needed}</span>
                       </td>
                       <td className="px-12 py-3 text-right">
                          {item.suggestion > 0 ? (
                             <div className="flex flex-col items-end gap-1">
                                <span className="text-2xl font-black text-slate-900 tracking-tighter  underline decoration-slate-100 underline-offset-4">{item.suggestion} {item.unit}</span>
                                <span className="px-3 py-1 bg-slate-900 text-white text-[14px] font-black rounded-full border border-slate-800 uppercase tracking-[0.1em] animate-pulse ">{t('criticalRestock')}</span>
                             </div>
                          ) : (
                              <span className="text-[14px] font-black text-slate-300 uppercase tracking-widest  bg-slate-50/50 px-4 py-1.5 rounded-full border border-slate-100 shadow-inner">{t('operationalHealthy')}</span>
                          )}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* 新增的底部操作栏 */}
         <div className="p-8 border-t border-slate-50 bg-slate-50/30 backdrop-blur-md flex flex-col sm:flex-row gap-6 justify-between items-center">
            <div className="text-[14px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
               <span className="w-8 h-px bg-slate-200"></span>
               {restockNeeded.length} {t('expectedSkusToReorder')}
            </div>
            <div className="flex gap-6 w-full sm:w-auto">
               <button 
                  onClick={() => window.print()} 
                  className="flex-1 sm:flex-none btn-premium !bg-white !text-slate-900 !px-10 !py-3 border border-slate-200 shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-[14px] font-black uppercase tracking-widest rounded-2xl"
               >
                  {t('exportRestockList')}
               </button>
               <button 
                  onClick={() => alert(t('syncingWithVendorPortal'))}
                  className="flex-1 sm:flex-none btn-premium !bg-primary !text-white !px-10 !py-3 border-none shadow-xl shadow-primary/10 hover:scale-105 active:scale-95 transition-all text-[14px] font-black uppercase tracking-widest rounded-2xl"
               >
                  🚀 {t('pushToPurchaseCenter')}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

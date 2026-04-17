import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function InventoryAnomalyPage({ mode = 'alert', hideHeader = false }) {
  const { lang, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    const loadAnomalies = async () => {
      setLoading(true);
      try {
        const res = await api('GET', '/anomalies');
        setAnomalies(res?.items || [
          { id: 1, name: t('freshMilk'), deviation: '-8.5%', type: 'usage', severity: 'warning', date: t('today') + ' 14:00' },
          { id: 2, name: t('frozenPearl'), deviation: '+12.3%', type: 'audit', severity: 'critical', date: t('yesterday') + ' 18:00' },
          { id: 3, name: t('ceylonTea'), deviation: '-5.0%', type: 'usage', severity: 'normal', date: t('today') + ' 10:00' }
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAnomalies();
  }, [mode]);

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse transition-all">{t('anomalyScanning')}</div>;

  const isAuditMode = mode === 'audit';

  return (
    <div className="space-y-10 animate-soft text-slate-900 pb-20">
      {!hideHeader && (
        <div className="flex flex-col gap-2">
           <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
             {isAuditMode ? t('auditModeTitle') : t('alertModeTitle')}
           </h2>
        </div>
      )}

      {/* {t('anomalySummary')} */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="card-premium !p-10 border-slate-50 bg-white !rounded-[40px] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 group-hover:scale-110 transition-transform">📉</div>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('deviationFreq')}</p>
            <h4 className="text-3xl font-black text-slate-900">12.4%</h4>
            <div className="mt-6 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
               <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">↑ 2.3%</span>
            </div>
         </div>
         
         <div className="card-premium !p-10 border-orange-50 bg-orange-50/10 !rounded-[40px] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 group-hover:scale-110 transition-transform">🔍</div>
            <p className="text-[12px] font-black text-orange-400 uppercase tracking-widest mb-2">{t('pendingVerify')}</p>
            <h4 className="text-3xl font-black text-slate-900">8 项</h4>
            <button className="mt-6 text-[11px] font-black text-orange-600 uppercase tracking-widest underline underline-offset-8">{t('doPhysicalCount')}</button>
         </div>

         <div className="card-premium !p-10 border-indigo-50 bg-indigo-50/10 !rounded-[40px] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 group-hover:scale-110 transition-transform">🧠</div>
            <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-2">{t('aiLossForecast')}</p>
            <h4 className="text-3xl font-black text-slate-900">Rp 128k</h4>
            <p className="mt-6 text-[11px] font-black text-indigo-400 uppercase tracking-widest">{t('lossControlRate')}: 98.2%</p>
         </div>
      </div>

      <div className="card-premium border-slate-50 !p-0 bg-white !rounded-[48px] overflow-hidden shadow-xl">
         <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">
               {isAuditMode ? t('auditHistory') : t('realTimeAnomalyList')}
            </h4>
         </div>
         
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-50">
                     <th className="p-8 text-[11px] font-black text-slate-300 uppercase tracking-widest">{t('materialDetail')}</th>
                     <th className="p-8 text-[11px] font-black text-slate-300 uppercase tracking-widest">{t('theoryVsActual')}</th>
                     <th className="p-8 text-[11px] font-black text-slate-300 uppercase tracking-widest">{t('anomalyType')}</th>
                     <th className="p-8 text-[11px] font-black text-slate-300 uppercase tracking-widest">{t('riskLevel')}</th>
                     <th className="p-8 text-[11px] font-black text-slate-300 uppercase tracking-widest text-right">{t('foundTime')}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {anomalies.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition-all select-none group">
                        <td className="p-8">
                           <p className="font-black text-slate-900 text-[16px] uppercase tracking-tight">{item.name}</p>
                           <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('materialCode') || 'Code'}: RAW-INV-00{item.id}</p>
                        </td>
                        <td className="p-8">
                           <span className={`text-[18px] font-black ${item.deviation.startsWith('+') ? 'text-blue-500' : 'text-red-500'}`}>
                              {item.deviation}
                           </span>
                        </td>
                        <td className="p-8 uppercase font-black text-slate-500 text-[12px] tracking-widest">
                           {item.type === 'usage' ? t('usageOverspend') : t('auditError')}
                        </td>
                        <td className="p-8">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              item.severity === 'critical' ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20' :
                              item.severity === 'warning' ? 'bg-orange-400 text-white border-orange-500 shadow-lg shadow-orange-500/20' :
                              'bg-emerald-50 text-emerald-600 border-emerald-100'
                           }`}>
                              {item.severity === 'critical' ? t('severityCritical') : item.severity === 'warning' ? t('severityWarning') : t('severityNormal')}
                           </span>
                        </td>
                        <td className="p-8 text-right font-black text-slate-300 text-[13px] uppercase tracking-tight group-hover:text-slate-900 transition-colors">
                           {item.date}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

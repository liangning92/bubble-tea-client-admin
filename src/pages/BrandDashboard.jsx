import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function BrandDashboard() {
  const { t } = useAuth();
  const [hqSummary, setHqSummary] = useState(null);

  useEffect(() => {
    api('GET', '/dashboard/hq-summary')
      .then(res => {
         if (res && !res.error) setHqSummary(res);
      })
      .catch(() => {});
  }, []);

  const formatCurrencyValue = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toLocaleString();
  };

  const executeBOMSync = async () => {
    if (!window.confirm(t('confirmAction'))) return;
    try {
      const res = await api('POST', '/batch/global-sync', {});
      if (res?.error) throw new Error(res.error);
      window.dispatchEvent(new CustomEvent('app:success', { detail: res.message || t('success') }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: e.message } }));
    }
  };

  const stores = hqSummary?.stores || [];
  const topStores = [...stores].slice(0, 3); // Top 3
  const bottomStores = [...stores].reverse().slice(0, 3); // Bottom 3

  return (
    <div className="space-y-8 animate-soft text-slate-900">
      {/* 头部指挥控制台 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm gap-8 transition-all">
        <div className="space-y-4">
          <h2 className="text-h1 uppercase  tracking-tight">{t('hqDashboard')}</h2>
          <p className="text-label-caps !text-slate-400">{t('hqSubtitle')}</p>
        </div>
        <button 
          onClick={executeBOMSync} 
          className="btn-premium active !bg-slate-900 !text-white !px-10 !py-3 border-none shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95"
        >
          {t('forceSyncBOM')}
        </button>
      </div>

      {/* 第一维度：核心 KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium !p-8 border-slate-50 flex flex-col justify-center group hover:bg-blue-50/30 transition-colors">
          <p className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-4">{t('groupRevenue')}</p>
          <div className="text-4xl font-black text-blue-600 tracking-tighter flex items-center">
            <span className="text-[0.4em] text-blue-400 mr-2 font-bold -translate-y-1">¥</span>
            {formatCurrencyValue(hqSummary?.totalRevenue)}
          </div>
        </div>
        <div className="card-premium !p-8 border-slate-50 flex flex-col justify-center group hover:bg-slate-50/50 transition-colors">
           <p className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-4">{t('activeStores')}</p>
           <div className="text-4xl font-black text-slate-900 tracking-tighter">{hqSummary?.storeCount || 0}</div>
        </div>
        <div className="card-premium !p-8 border-slate-50 flex flex-col justify-center group hover:bg-slate-50/50 transition-colors">
           <p className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-4">{t('groupStaff')}</p>
           <div className="text-4xl font-black text-slate-900 tracking-tighter">{hqSummary?.staffCount || 0}</div>
        </div>
        <div className={`card-premium !p-8 border-slate-50 flex flex-col justify-center transition-all ${hqSummary?.globalShortageCount > 0 ? 'bg-red-50/50 border-red-100 ring-2 ring-red-100' : ''}`}>
           <p className={`text-[14px] font-black uppercase tracking-widest mb-4 ${hqSummary?.globalShortageCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{t('globalShortage')}</p>
           <div className={`text-4xl font-black flex items-center gap-3 tracking-tighter ${hqSummary?.globalShortageCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
             {hqSummary?.globalShortageCount || 0}
             {hqSummary?.globalShortageCount > 0 && <span className="animate-pulse text-2xl">⚠️</span>}
           </div>
        </div>
      </div>

      {/* 第二维度：赛马机制 (Leaderboards) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 黑马榜 */}
        <div className="card-premium !p-10 border-emerald-50 shadow-emerald-500/5 bg-emerald-50/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-emerald-100">🔥</div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('performanceRank')}</h3>
          </div>
          <div className="space-y-4">
            {topStores.map((store, i) => (
              <div key={store.id} className="flex justify-between items-center p-6 bg-white rounded-[32px] border border-emerald-50 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xl">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg tracking-tight">{store.name}</div>
                    <div className="text-[14px] text-slate-400 font-bold uppercase tracking-widest">{t('manager')}: {store.bossName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-600 tracking-tighter flex items-center justify-end">
                    <span className="text-[0.5em] text-emerald-400 mr-1.5 font-bold">¥</span>
                    {formatCurrencyValue(store.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 辅导榜 */}
        <div className="card-premium !p-10 border-red-50 shadow-red-500/5 bg-red-50/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-red-100">🆘</div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('hqAlerts')}</h3>
          </div>
          <div className="space-y-4">
            {bottomStores.map((store, i) => (
              <div key={store.id} className="flex justify-between items-center p-6 bg-white rounded-[32px] border border-red-50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 font-black flex items-center justify-center text-sm">
                    #{stores.length - i}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg tracking-tight">{store.name}</div>
                    <div className="text-[14px] text-red-500 font-black uppercase tracking-widest">{store.shortageCount > 0 ? `${store.shortageCount} ${t('shortageAlertCount')}` : t('hqAlerts')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-black text-slate-400 group-hover:text-red-600 transition-colors mb-1 flex items-center justify-end">
                    <span className="text-[0.5em] mr-1.5 font-bold">¥</span>
                    {formatCurrencyValue(store.revenue)}
                  </div>
                  <a href={`tel:${store.bossPhone}`} className="text-[14px] text-blue-600 font-black uppercase tracking-widest hover:underline">{t('managerContact')} →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 第三维度：全局下挂分店数据库 */}
      <div className="card-premium border-slate-200 !p-8 shadow-2xl overflow-hidden bg-white">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 pl-2">{t('monitorMatrix')}</h3>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[14px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                <th className="py-6 px-4 rounded-tl-[32px]">{t('storeRank')}</th>
                <th className="py-6 px-4">{t('storeSystemName')}</th>
                <th className="py-6 px-4">{t('managerContact')}</th>
                <th className="py-6 px-4 text-right">{t('accumulatedRevenue')}</th>
                <th className="py-6 px-4 text-center">{t('shortageAlertCount')}</th>
                <th className="py-6 px-4 rounded-tr-[32px] text-center">{t('inspect')}</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-700">
              {stores.map((s, idx) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                  <td className="py-6 px-4 font-black text-slate-300 group-hover:text-slate-900 transition-colors">#{idx + 1}</td>
                  <td className="py-6 px-4">
                     <span className="font-black text-slate-900 text-[15px] tracking-tight">{s.name}</span>
                  </td>
                  <td className="py-6 px-4">
                    <div className="font-black text-slate-700">{s.bossName}</div>
                    <div className="text-[14px] text-slate-400 font-bold font-mono uppercase tracking-widest">{s.bossPhone}</div>
                  </td>
                  <td className="py-6 px-4 text-right font-black text-slate-900 text-lg tracking-tighter">
                    <span className="text-[0.6em] text-slate-300 mr-1.5 font-bold">¥</span>
                    {formatCurrencyValue(s.revenue)}
                  </td>
                  <td className="py-6 px-4 text-center">
                    {s.shortageCount > 0 ? (
                      <span className="px-4 py-1.5 rounded-full text-[14px] font-black bg-red-50 text-red-600 border border-red-100 shadow-sm animate-soft">{s.shortageCount}</span>
                    ) : (
                      <span className="text-slate-200 font-black">—</span>
                    )}
                  </td>
                  <td className="py-6 px-4 text-center">
                    <button className="btn-premium !bg-slate-100 !text-slate-900 hover:!bg-slate-900 hover:!text-white border-none !px-4 !py-3.5 !text-[14px] uppercase tracking-widest font-black transition-all">
                       {t('inspect')}
                    </button>
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

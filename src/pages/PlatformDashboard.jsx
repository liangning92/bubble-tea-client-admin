import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function PlatformDashboard() {
  const { t } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await api('GET', '/platform/summary');
    if (!res.error) {
      setData(res);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading && !data) return <div className="py-20 text-center text-slate-400 font-bold animate-pulse tracking-widest uppercase">{t('loading')}</div>;
  if (!data) return <div className="py-20 text-center text-rose-400 font-bold uppercase">{t('error')}</div>;

  const { metrics, tenants } = data;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* 核心指标卡片 (SaaS Metrics) */}
      <section>
         <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{t('platformTitle')}</h2>
            <p className="text-slate-500 font-medium ">{t('platformSubtitle')}</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
               { label: t('activeTenants'), val: metrics.activeTenants, sub: `of ${metrics.totalTenants} items`, color: 'text-indigo-600', icon: '🏢' },
               { label: t('nodeClusters'), val: metrics.totalStores, sub: t('activeStores'), color: 'text-emerald-600', icon: '📍' },
               { label: t('avgNodeLoad'), val: `${metrics.avgLoad}%`, sub: 'Peak Stability', color: 'text-blue-600', icon: '⚡' },
               { label: t('atRisk'), val: metrics.expiringTenants, sub: 'Expiring < 30d', color: 'text-rose-600', icon: '⚠️' },
            ].map((m, i) => (
               <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                  <div className="flex justify-between items-start relative z-10">
                     <div>
                        <div className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</div>
                        <div className={`text-4xl font-black ${m.color} tracking-tighter mb-2`}>{m.val}</div>
                        <div className="text-[14px] text-slate-400 font-bold uppercase tracking-tighter">{m.sub}</div>
                     </div>
                     <span className="text-2xl">{m.icon}</span>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
               </div>
            ))}
         </div>
      </section>

      {/* 租户列表 (Brands) */}
      <section className="bg-white rounded-[48px] p-10 border border-slate-200 shadow-sm">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('brandIdentifier')}</h3>
               <p className="text-slate-400 text-[14px] font-medium mt-1 ">多品牌租户资源隔离状态与授权明细</p>
            </div>
            <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 hover:shadow-indigo-200 active:scale-95 transition-all">
               {t('provisionNew')}
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-50 text-[14px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="py-4 px-2">{t('brandIdentifier')}</th>
                     <th className="py-4 px-2">{t('keyAccount')}</th>
                     <th className="py-4 px-2">{t('nodesCount')}</th>
                     <th className="py-4 px-2">{t('validThru')}</th>
                     <th className="py-4 px-2">{t('healthStatus')}</th>
                     <th className="py-4 px-6 text-right">{t('inspect')}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {tenants.map((t_item, i) => (
                     <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-6 px-2">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">{t_item.brandName.charAt(0)}</div>
                              <div>
                                 <div className="font-bold text-slate-800 text-sm">{t_item.brandName}</div>
                                 <div className="text-[14px] text-slate-400 font-mono tracking-tighter">{t_item.id}</div>
                              </div>
                           </div>
                        </td>
                        <td className="py-6 px-2">
                           <div className="text-[14px] font-bold text-slate-600">{t_item.adminUser}</div>
                        </td>
                        <td className="py-6 px-2">
                           <div className="text-sm font-black text-slate-800 tabular-nums">{t_item.storeCount}</div>
                        </td>
                        <td className="py-6 px-2">
                           <div className="text-[14px] font-bold text-slate-500">{t_item.expireAt}</div>
                        </td>
                        <td className="py-6 px-2">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                              t_item.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                           }`}>
                              {t_item.status}
                           </span>
                        </td>
                        <td className="py-6 px-6 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition-all">⚙️</button>
                              <button className="px-4 py-2 bg-slate-900 text-white text-[14px] font-black rounded-lg uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">{t('inspect')}</button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>

      {/* 系统日志 (System Log Stream) */}
      <section className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <h4 className="text-[14px] font-black text-slate-500 uppercase tracking-widest">{t('platformLog')}</h4>
         </div>
         <div className="space-y-2 font-mono text-[14px] text-slate-400 relative z-10 overflow-x-auto">
            <p><span className="text-slate-500">[SYSTEM]</span> Tenant Provisoning: Global Cluster Node SYD-04 initialized successfully.</p>
            <p><span className="text-slate-500">[SECURE]</span> Access Token Audit: Completed for Tenant ID TN-001.</p>
            <p><span className="text-indigo-400">[KERNEL]</span> Microservice Harmony: All 14 subsystems operational at 99.99% SLA.</p>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
      </section>

    </div>
  );
}

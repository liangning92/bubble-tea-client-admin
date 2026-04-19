import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function SalesAnalysisPage() {
   const { lang, t } = useAuth();
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState({ hourDist: [], categoryBreakdown: [], trend: [] });
   const [dateRange, setDateRange] = useState({
      start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
   });

   const loadData = async () => {
      setLoading(true);
      try {
         const res = await api('GET', `/analysis/sales/breakdown?startDate=${dateRange.start}&endDate=${dateRange.end}`);
         if (res && !res.error) {
            setData(res);
         }
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { loadData(); }, [dateRange]);

   const maxHourCount = Math.max(...(data?.hourDist || []).map(h => h.count || 0), 1);
   const maxCatRev = Math.max(...(data?.categoryBreakdown || []).map(c => c.revenue || 0), 1);

   // 动态决策分析 (Dynamic Insights)
   const getInsight = () => {
      if (!data?.hourDist || data.hourDist.length === 0) return t.noDataInsight || '暂无足够数据生成经营建议';
      const peakHour = [...data.hourDist].sort((a, b) => b.count - a.count)[0];
      if (peakHour.count > 0) {
         return `⚡ 决策提示：检测到 ${peakHour.hour}点 为订单高峰期（${peakHour.count} 杯），建议提前 30 分钟备好冰块与茶汤，并确保该时段人手充足。`;
      }
      return '⚡ 决策提示：当前时段销量平稳，建议关注新品推广以寻找增长点。';
   };

   if (loading) return (
      <div className="py-24 text-center">
         <div className="text-[14px] font-black text-indigo-400 animate-pulse tracking-[0.4em] uppercase">Processing Sales Intelligence...</div>
      </div>
   );

   return (
      <div className="space-y-5 animate-soft text-slate-900">
         {/* Date Filter */}
         <div className="flex flex-col md:flex-row items-center gap-4 p-2 bg-slate-100 rounded-3xl border border-slate-200 w-fit shadow-sm">
            <input
               type="date"
               value={dateRange.start}
               onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
               className="bg-white/50 border-none rounded-2xl px-4 py-3 text-[14px] font-black text-slate-800 outline-none focus:bg-white transition-all w-48 shadow-inner"
            />
            <div className="text-[14px] font-black text-slate-400 uppercase tracking-widest hidden md:block px-4">TO</div>
            <input
               type="date"
               value={dateRange.end}
               onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
               className="bg-white/50 border-none rounded-2xl px-4 py-3 text-[14px] font-black text-slate-800 outline-none focus:bg-white transition-all w-48 shadow-inner"
            />
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 1. 时段分布 - 识别营业高峰 */}
            <div className="card-premium border-slate-200 !p-6 bg-white">
               <div className="flex justify-between items-center mb-10">
                  <div>
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{t('peakHoursDistribution')}</h3>
                     <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('trafficDensityIndex')}</p>
                  </div>
                  <span className="text-[14px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-indigo-100">Peak Hour Matrix</span>
               </div>
               
               <div className="flex items-end justify-between h-48 gap-1.5 md:gap-2.5 px-4">
                  {(data?.hourDist || []).map(h => (
                     <div key={h.hour} className="group relative flex-1 flex flex-col items-center">
                        <div
                           style={{ height: `${((h.count || 0) / maxHourCount) * 100}%` }}
                           className="w-full bg-slate-800 group-hover:bg-indigo-500 rounded-t-xl transition-all duration-500 relative"
                        >
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[14px] font-black py-1 px-4 bg-indigo-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-indigo-500/30">
                              {h.count}
                           </div>
                        </div>
                        <span className="text-[8px] mt-3 font-black text-slate-600 uppercase group-hover:text-slate-400 transition-colors">{h.hour}h</span>
                     </div>
                  ))}
               </div>
               
               <div className="mt-10 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 backdrop-blur-sm">
                  <p className="text-[14px] text-slate-600 font-bold  leading-relaxed">
                     {getInsight()}
                  </p>
               </div>
            </div>

            {/* 2. 分类构成 - 业绩贡献分析 */}
            <div className="card-premium border-slate-200 !p-6 bg-white">
               <div className="flex justify-between items-center mb-10">
                  <div>
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{t('categoryPerformanceMatrix')}</h3>
                     <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('productRevenueContribution')}</p>
                  </div>
                  <span className="text-[14px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100">Growth Index</span>
               </div>

               <div className="space-y-4">
                  {(data?.categoryBreakdown || []).sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).map(c => (
                     <div key={c.category} className="space-y-4 group">
                        <div className="flex justify-between items-end">
                           <div className="space-y-4">
                              <span className="text-[14px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">{c.category}</span>
                              <div className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em]">{c.quantity} {t('unitsShipped')}</div>
                           </div>
                           <span className="text-sm font-black text-slate-900">Rp {(c.revenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                           <div
                              style={{ width: `${((c.revenue || 0) / maxCatRev) * 100}%` }}
                              className="h-full bg-indigo-400 rounded-full group-hover:bg-indigo-500 transition-all duration-700 shadow-[0_0_15px_rgba(129,140,248,0.3)]"
                           ></div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* 3. 总趋势看板 */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-premium !p-8 border-slate-200 bg-white group hover:border-indigo-500">
               <p className="text-[14px] font-black text-slate-500 uppercase tracking-widest mb-4 group-hover:text-indigo-600 transition-colors">Period Aggregate Gross</p>
               <p className="text-3xl font-black text-slate-900 tracking-tighter">
                  Rp {(data.trend || []).reduce((s, t) => s + (t.revenue || 0), 0).toLocaleString()}
               </p>
            </div>
            <div className="card-premium !p-8 border-indigo-100 bg-white group hover:border-indigo-500 shadow-indigo-50/50">
               <p className="text-[14px] font-black text-slate-500 uppercase tracking-widest mb-4 group-hover:text-indigo-600 transition-colors">Average Daily Velocity</p>
               <p className="text-3xl font-black text-indigo-600 tracking-tighter">
                  {Math.round((data.trend || []).reduce((s, t) => s + (t.count || 0), 0) / (data.trend?.length || 1))} <span className="text-[14px] text-slate-400 font-bold uppercase ml-2">Units / Day</span>
               </p>
            </div>
         </div>
      </div>
   );
}

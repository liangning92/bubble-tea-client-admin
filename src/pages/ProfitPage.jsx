import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function ProfitPage() {
  const { lang, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { revenue: 0, cost: 0, gross: 0, net: 0, margin: 0 },
    channels: [
      { name: t('dineIn'), amount: 0, percentage: 0, icon: '🏠', color: 'bg-blue-500' },
      { name: t('takeaway'), amount: 0, percentage: 0, icon: '🛍️', color: 'bg-orange-500' },
      { name: 'GrabFood', amount: 0, percentage: 0, icon: '🛵', color: 'bg-emerald-500' },
      { name: 'GoFood', amount: 0, percentage: 0, icon: '🏍️', color: 'bg-red-500' },
    ],
    topProducts: []
  });

  const loadProfitData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/analysis/profit/summary');
      if (res && !res.error && res.data) {
        // Map API response to frontend format
        const apiData = res.data;
        setData({
          summary: {
            revenue: apiData.revenue || 0,
            cost: apiData.expenses || 0,
            gross: apiData.grossProfit || 0,
            net: apiData.netProfit || 0,
            margin: apiData.margin || 0
          },
          channels: [
            { name: t('dineIn'), amount: 0, percentage: 0, icon: '🏠', color: 'bg-blue-500' },
            { name: t('takeaway'), amount: 0, percentage: 0, icon: '🛍️', color: 'bg-orange-500' },
            { name: 'GrabFood', amount: 0, percentage: 0, icon: '🛵', color: 'bg-emerald-500' },
            { name: 'GoFood', amount: 0, percentage: 0, icon: '🏍️', color: 'bg-red-500' },
          ],
          topProducts: []
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfitData(); }, []);

  if (loading) return <div className="py-24 text-center text-label-caps animate-pulse">Analyzing Financials...</div>;

  return (
    <div className="space-y-6 animate-soft pb-24">
      {/* 1. 营收核心概览 (Core Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('totalRevenue'), val: data.summary.revenue, icon: '💰', color: 'text-emerald-600' },
          { label: t('ingredientCost'), val: data.summary.cost, icon: '📦', color: 'text-orange-600' },
          { label: t('grossProfit'), val: data.summary.gross, icon: '📉', color: 'text-blue-600' },
          { label: t('grossMargin'), val: data.summary.margin + '%', icon: '📈', color: 'text-purple-600' }
        ].map((item, i) => (
          <div key={i} className="card-premium !p-8 space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-2xl">{item.icon}</span>
               <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t('kpiMetric')}</span>
            </div>
            <div>
               <h4 className="text-label-caps !text-slate-400">{item.label}</h4>
               <p className={`text-2xl font-black ${item.color} mt-1 tracking-tighter`}>
                  {typeof item.val === 'number' ? `Rp ${item.val.toLocaleString()}` : item.val}
               </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. 渠道营收拆分 (Channel Split) */}
        <div className="lg:col-span-2 card-premium !p-6 space-y-5">
           <div className="flex justify-between items-center border-b border-slate-50 pb-6">
              <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">{t('revenueSplit')}
              <span className="px-4 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100 italic">Real-time Attribution</span></h4>
           </div>
           
           <div className="space-y-4">
              {data.channels.map((ch, i) => (
                <div key={i} className="space-y-4">
                   <div className="flex justify-between items-end px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{ch.icon}</span>
                        <span className="text-[14px] font-black text-slate-700 uppercase">{ch.name}</span>
                      </div>
                      <span className="text-[14px] font-black text-slate-900 font-mono">Rp {ch.amount.toLocaleString()} ({ch.percentage}%)</span>
                   </div>
                   <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${ch.color}`} 
                        style={{ width: `${ch.percentage}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* 3. 单品毛利榜 (Product Profitability) */}
        <div className="card-premium !p-6 space-y-4">
           <h4 className="text-label-caps !text-slate-900 border-b border-slate-50 pb-4">{t('marginRanking')}</h4>
           <div className="space-y-4">
              {(data.topProducts || [
                { name: 'Classic Milk Tea', margin: 72, cost: 4500 },
                { name: 'Brown Sugar Boba', margin: 68, cost: 5200 },
                { name: 'Mango Pomelo', margin: 62, cost: 8500 }
              ]).map((p, i) => (
                <div key={i} className="flex justify-between items-center group">
                   <div className="space-y-4">
                      <h5 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{p.name}</h5>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Cost: Rp {p.cost}</p>
                   </div>
                   <div className="text-right">
                      <div className="text-[15px] font-black text-emerald-600">{p.margin}%</div>
                      <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Margin</div>
                   </div>
                </div>
              ))}
           </div>
           <button className="w-full py-3 text-[12px] font-black uppercase tracking-widest text-slate-400 border border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 transition-all mt-4">{t('viewFullTable')}</button>
        </div>
      </div>

      {/* 4. 原料成本自动统计 (BOM Cost Auto-Audit) */}
      <div className="p-10 rounded-[40px] bg-slate-900 text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500 rounded-full blur-[120px] -mr-40 -mt-40 opacity-20" />
         <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
            <div className="w-20 h-20 bg-white/10 rounded-[24px] flex items-center justify-center text-4xl shadow-2xl">🔢</div>
            <div className="flex-1 space-y-4">
               <h4 className="text-xl font-black uppercase tracking-tight">{t('bomAutoSync')}</h4>
               <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-2xl">
                  系统已连接 BOM 配方数据库。当前的“原料成本”是基于 [已完成销量] × [配方单价] 自动对冲得出的理论值。
                  这帮助主理人实时掌握店内的利润流失情况，而无需等待月末盘点。
               </p>
            </div>
            <div className="w-full md:w-auto px-10 py-5 bg-emerald-500 text-white rounded-[24px] text-center font-black uppercase tracking-widest text-[14px] shadow-2xl shadow-emerald-500/30 cursor-pointer hover:scale-105 transition-all">
               生成财务月报
            </div>
         </div>
      </div>
    </div>
  );
}

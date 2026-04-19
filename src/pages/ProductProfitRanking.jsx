import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function ProductProfitRanking() {
  const { t, lang } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState([]);

  useEffect(() => {
    // 模拟高颗粒度商业核算数据
    const mockData = [
      { id: 1, name: '多肉葡萄 (Succulent Grape)', sales: 1250, revenue: 35000000, cost: 14000000, profit: 21000000, margin: 60, trend: 12 },
      { id: 2, name: '芝芝芒芒 (Cheese Mango)', sales: 980, revenue: 31360000, cost: 12544000, profit: 18816000, margin: 60, trend: 8 },
      { id: 3, name: '杨枝甘露 (Mango Sago)', sales: 850, revenue: 23800000, cost: 11900000, profit: 11900000, margin: 50, trend: -5 },
      { id: 4, name: '生椰拿铁 (Raw Coconut Latte)', sales: 720, revenue: 15840000, cost: 6336000, profit: 9504000, margin: 60, trend: 15 },
      { id: 5, name: '鸭屎香柠檬茶 (Lemon Tea)', sales: 600, revenue: 10800000, cost: 3240000, profit: 7560000, margin: 70, trend: 2 },
    ];
    
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 800);
  }, [period]);

  const formatCurrency = (num) => `${t('currencySymbol')} ${num.toLocaleString()}`;

  if (loading) return (
     <div className="flex items-center justify-center min-h-[40vh] text-slate-400 font-bold uppercase tracking-widest animate-pulse">
        {t('calculatingEconomics') || 'Calculating Economics...'}
     </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* 筛选与头部 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('profitRankingTitle') || 'Product Profit Ranking'}</h3>
            <p className="text-[14px] text-slate-500 font-medium mt-1">{t('profitRankingSubtitle') || 'In-depth analysis of marginal contribution and cost structure per cup'}</p>
         </div>
         <div className="flex p-1 bg-slate-100 rounded-xl">
            {['day', 'week', 'month'].map((p) => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={`px-4 py-3 rounded-lg text-[14px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t(p)}
              </button>
            ))}
         </div>
      </div>

      {/* 排行榜列表 */}
      <div className="space-y-4">
        {(data || []).map((item, idx) => (
          <div key={item.id} className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-marigold transition-all hover:shadow-md relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-marigold transition-colors"></div>
             
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* 左侧：排名与名称 */}
                <div className="flex items-center gap-6 flex-1 min-w-0">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-inner ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                      {idx + 1}
                   </div>
                   <div className="truncate">
                      <h4 className="font-black text-lg text-slate-800 tracking-tight truncate">
                         <BusinessDataTranslator text={item.name} />
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                         <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('soldCount') || 'Sold'}: {item.sales} {t('cup')}</span>
                         <span className={`text-[14px] font-black uppercase tracking-widest ${item.trend > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                            {item.trend > 0 ? '↑' : '↓'} {Math.abs(item.trend)}% vs Prev
                         </span>
                      </div>
                   </div>
                </div>

                {/* 右侧：核算细节 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                   <div className="text-right">
                      <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('grossSales') || 'Gross Sales'}</p>
                      <p className="font-black text-slate-800 tracking-tighter">{formatCurrency(item.revenue)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('cogs') || 'Total COGS'}</p>
                      <p className="font-black text-slate-500 tracking-tighter">{formatCurrency(item.cost)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('contribution') || 'Contribution'}</p>
                      <p className="font-black text-emerald-600 tracking-tighter">{formatCurrency(item.profit)}</p>
                   </div>
                   <div className="text-right pl-4 border-l border-slate-100">
                      <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('profitMargin')}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-marigold text-lg">{item.margin}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-marigold" style={{ width: `${item.margin}%` }}></div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
      
      <div className="p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="max-w-md">
               <h4 className="text-xl font-black tracking-tight mb-2">{t('aiStrategicAdviceTitle')}</h4>
               <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  {t('aiStrategicAdviceDesc')}
               </p>
            </div>
            <button className="px-8 py-3 bg-marigold text-slate-900 hover:bg-marigold/90 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-marigold/20 transition-all">
               {t('executeCampaign')}
            </button>
         </div>
         {/* 装饰 */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-marigold opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      </div>
    </div>
  );
}
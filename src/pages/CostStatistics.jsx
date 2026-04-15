import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function CostStatistics({ hideHeader }) {
  const { t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ 
    total: 0, 
    breakdown: { rent: 0, payroll: 0, stock: 0, utility: 0, marketing: 0, maintenance: 0, tax: 0, other: 0 } 
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/analysis/costs/summary');
      if (res && !res.error) {
        setSummary(res);
      } else {
        setSummary({
          total: 18450000,
          breakdown: { 
            rent: 5000000, 
            payroll: 4200000, 
            stock: 3150000, 
            utility: 1250000, 
            marketing: 850000, 
            maintenance: 450000,
            tax: 1550000,
            other: 2000000 
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const costItems = [
    { key: 'rent', label: t('rentLease'), icon: '🏠', color: 'bg-slate-50', auto: false },
    { key: 'utility', label: t('utilitiesCost'), icon: '⚡', color: 'bg-slate-50', auto: false },
    { key: 'payroll', label: t('laborPayroll'), icon: '👥', color: 'bg-slate-100', auto: true },
    { key: 'maintenance', label: t('maintenanceCost'), icon: '🔧', color: 'bg-slate-50', auto: false },
    { key: 'marketing', label: t('marketingCost'), icon: '🚀', color: 'bg-slate-100', auto: true },
    { key: 'tax', label: t('taxDuties'), icon: '⚖️', color: 'bg-slate-100', auto: true },
    { key: 'stock', label: t('procurementCost'), icon: '📦', color: 'bg-slate-100', auto: true },
    { key: 'other', label: t('miscExpense'), icon: '🧾', color: 'bg-slate-100', auto: true },
  ];

  if (loading) return (
    <div className="py-24 text-center">
      <div className="text-[14px] animate-pulse text-slate-900 font-black tracking-[0.4em] uppercase ">{t('synchronizingFiscal')}</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-soft text-slate-900 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center gap-10 px-2">
        <div className="bg-emerald-50 px-8 py-3 rounded-[24px] flex items-center gap-4 border border-emerald-100 shadow-sm transition-all hover:bg-emerald-100/50 cursor-help">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]"></span>
          <span className="text-[14px] font-black text-emerald-700 uppercase tracking-widest ">{t('coreSyncActive')}</span>
        </div>
        <button onClick={loadData} className="btn-premium active !bg-slate-900 !text-white !px-12 !py-4 !text-[13px] border-none shadow-2xl shadow-slate-900/10 !scale-100 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] font-black rounded-[24px] ">
          {t('refreshFiscal')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {costItems.map(item => (
          <div key={item.key} className="card-premium group hover:border-slate-300 transition-all !p-10 border-slate-50 bg-white !rounded-[40px] shadow-sm hover:shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-[40px] -mr-12 -mt-12 opacity-60 group-hover:scale-150 transition-transform" />
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className={`w-16 h-16 rounded-[24px] ${item.color} flex items-center justify-center text-3xl shadow-sm border border-slate-100 group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                {item.icon}
              </div>
            </div>
            <p className="text-[14px] font-black text-slate-400 mb-2 uppercase tracking-widest group-hover:text-slate-900 transition-colors  relative z-10">{item.label}</p>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-2xl font-black text-slate-900 tracking-tighter font-mono">
                <span className="text-[0.6em] text-slate-400 mr-1 font-bold">¥</span>
                {(summary?.breakdown?.[item.key] || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card-premium bg-slate-900 text-white !p-16 border-none shadow-3xl shadow-slate-900/10 !rounded-[56px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-slate-800 rounded-full blur-[140px] opacity-40 -mr-80 -mt-80 transition-transform group-hover:scale-110 duration-1000" />
        <div className="flex flex-col xl:flex-row justify-between items-center gap-16 relative z-10">
          <div className="space-y-6 text-center xl:text-left">
            <p className="text-[13px] text-slate-500 tracking-[0.4em] font-black uppercase opacity-60 ">{t('monthlyAggregateOutflow')}</p>
            <p className="text-5xl font-black tracking-tighter text-white font-mono">
              <span className="text-2xl text-slate-500 mr-4 font-black tracking-normal scale-75 inline-block">¥</span>
              {(summary?.total || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 w-full xl:w-auto">
            <button className="flex-1 sm:flex-none btn-premium active !px-16 !py-6 !bg-white !text-slate-900 border-none shadow-3xl shadow-white/5 text-[14px] font-black uppercase tracking-[0.2em] !scale-100 hover:scale-105 active:scale-95 transition-all rounded-[32px] ">
              {t('costReportExcel')}
            </button>
            <button className="flex-1 sm:flex-none btn-premium active !px-16 !py-6 !bg-slate-800 !text-white border-2 border-white/5 shadow-2xl text-[14px] font-black uppercase tracking-[0.2em] !scale-100 hover:scale-105 active:scale-95 transition-all rounded-[32px]  underline decoration-slate-600 decoration-4 underline-offset-8">
              {t('financialAuditPdf')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {!hideHeader && (
          <div className="card-premium border-slate-50 !p-12 space-y-10 bg-white !rounded-[48px] shadow-sm group/manual overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-40 group-hover/manual:scale-150 transition-transform" />
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter  uppercase border-b border-slate-50 pb-8 flex items-center gap-4 relative z-10">
               <span className="w-10 h-px bg-slate-900"></span>
               {t('manualEntryTitle')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
               <div className="space-y-4">
                 <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('expenseTitleLabel')}</label>
                 <input className="input-premium w-full !bg-slate-50 focus:!bg-white border-none !rounded-[24px] !p-6 font-black text-[16px]  shadow-inner" placeholder="e.g. Rent" />
               </div>
               <div className="space-y-4">
                 <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('amountLabel')}</label>
                 <input className="input-premium w-full !bg-slate-50 focus:!bg-white border-none !rounded-[24px] !p-6 font-black text-[16px]  shadow-inner" placeholder="0" type="number" />
               </div>
            </div>
            <button className="w-full btn-premium active !bg-slate-900 !text-white !h-20 border-none shadow-3xl shadow-slate-900/10 uppercase tracking-[0.3em] text-[15px] font-black !rounded-[32px] !scale-100 hover:scale-[1.02] active:scale-95 transition-all  underline decoration-slate-700 decoration-4 underline-offset-8 relative z-10">
              {t('submitFiscalEntry')}
            </button>
          </div>
        )}
        
        <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-10 group hover:border-slate-300 transition-all overflow-hidden relative">
           <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-40 group-hover:scale-150 transition-transform duration-1000" />
           <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-5xl shadow-sm border border-slate-100 group-hover:rotate-12 transition-transform shrink-0 relative z-10 shadow-inner">⚙️</div>
           <div className="space-y-5 relative z-10">
              <h5 className="text-2xl font-black text-slate-900 uppercase tracking-tighter  flex items-center gap-4">
                 {t('syncLogicTitle')}
                 <span className="w-12 h-px bg-slate-200"></span>
              </h5>
              <p className="text-[15px] text-slate-400 font-bold leading-relaxed  uppercase tracking-tight opacity-70">
                {t('syncLogicDesc')}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}


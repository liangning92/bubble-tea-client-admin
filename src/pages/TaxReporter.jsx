import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function TaxReporter({ hideHeader }) {
  const { t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ revenue: 125800000, taxRate: 10, taxAmount: 12580000 });
  const [storeInfo, setStoreInfo] = useState({
    name: 'Bubble Tea HQ - Jakarta',
    address: 'Sudirman Central Business District, Lot 11A',
    taxId: '01.234.567.8-123.000',
    filingMonth: 'April 2026',
    filingDate: new Date().toLocaleDateString()
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', `/analysis/tax/summary`);
      if (res && !res.error) {
        setData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="py-24 text-center">
      <div className="text-[14px] animate-pulse text-slate-900 font-black tracking-[0.4em] uppercase ">{t('synchronizingFiscal')}</div>
    </div>
  );

  return (
    <div className="space-y-12 animate-soft text-slate-900 pb-24">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 px-2">
          <div className="space-y-1.5">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase ">{t('taxHub')}</h3>
            <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em]  opacity-60 leading-none">{t('taxSubtitle')}</p>
          </div>
          <button onClick={() => window.print()} className="btn-premium active !bg-slate-900 !text-white !px-12 !py-4 !text-[13px] border-none shadow-2xl shadow-slate-900/10 !scale-100 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] font-black rounded-[24px]  underline decoration-slate-700 decoration-4 underline-offset-4">
            {t('downloadTaxDoc')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="card-premium border-slate-50 space-y-12 !p-12 transition-all hover:border-slate-300 bg-white shadow-sm !rounded-[48px] group/ident relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-40 group-hover/ident:scale-150 transition-transform duration-1000" />
           <div className="flex items-center gap-6 border-b border-slate-50 pb-8 relative z-10">
              <span className="text-3xl shrink-0">🏛️</span>
              <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter  flex items-center gap-4">
                 {t('merchantIdentity')}
                 <span className="w-12 h-px bg-slate-200"></span>
              </h4>
           </div>
           
           <div className="grid grid-cols-1 gap-10 relative z-10">
              <div className="space-y-4">
                 <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('storeNameLabel')}</label>
                 <input className="input-premium w-full !bg-slate-50 focus:!bg-white border-none !rounded-[24px] !p-6 font-black text-[16px]  shadow-inner" value={storeInfo.name} onChange={e => setStoreInfo({...storeInfo, name: e.target.value})} />
              </div>
              <div className="space-y-4">
                 <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('merchantAddressLabel')}</label>
                 <input className="input-premium w-full !bg-slate-50 focus:!bg-white border-none !rounded-[24px] !p-6 font-black text-[16px]  shadow-inner" value={storeInfo.address} onChange={e => setStoreInfo({...storeInfo, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('filingMonthLabel')}</label>
                    <input className="input-premium w-full !bg-slate-100 !rounded-[24px] !p-6 font-black text-[16px]  opacity-60 border-none cursor-not-allowed" value={storeInfo.filingMonth} readOnly />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('filingDateLabel')}</label>
                    <input className="input-premium w-full !bg-slate-100 !rounded-[24px] !p-6 font-black text-[16px]  opacity-60 border-none cursor-not-allowed" value={storeInfo.filingDate} readOnly />
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('taxpayerIdLabel')}</label>
                 <input className="input-premium w-full !bg-slate-50 focus:!bg-white font-mono tracking-[0.2em] text-slate-900 border-none !rounded-[24px] !p-6 font-black text-[16px]  shadow-inner" value={storeInfo.taxId || ''} onChange={e => setStoreInfo({...storeInfo, taxId: e.target.value})} placeholder={t('taxIdPlaceholder')} />
              </div>
           </div>
           
           <div className="pt-8 relative z-10">
              <button className="text-[14px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-900 hover:text-white px-10 py-4 bg-slate-50 rounded-full border border-slate-100 transition-all  underline decoration-slate-200 decoration-4 underline-offset-8">{t('updateLockHeader')}</button>
           </div>
        </div>

        <div className="card-premium border-none bg-slate-900 text-white space-y-12 shadow-3xl !p-16 relative overflow-hidden group/audit !rounded-[56px]">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[140px] -mr-64 -mt-64 transition-transform group-hover/audit:scale-125 duration-1000" />
           
           <div className="flex items-center gap-6 border-b border-white/5 pb-8 relative z-10">
              <span className="text-3xl shrink-0">📊</span>
              <h4 className="text-2xl text-slate-400 font-black uppercase tracking-tighter  flex items-center gap-4">
                 {t('taxAuditTitle')}
                 <span className="w-12 h-px bg-slate-800"></span>
              </h4>
           </div>
           
           <div className="space-y-16 relative z-10">
              <div className="flex justify-between items-end border-b border-white/5 pb-12">
                 <div className="space-y-4">
                    <p className="text-[14px] text-slate-600 font-black tracking-[0.3em] uppercase  opacity-60">{t('grossTurnover')}</p>
                    <p className="text-5xl font-black text-white tracking-tighter  font-mono underline decoration-slate-800 decoration-8 underline-offset-8">
                       <span className="text-2xl text-slate-600 mr-4 font-black tracking-normal">{t('currencySymbol')}</span>
                       {data.revenue.toLocaleString()}
                    </p>
                 </div>
                 <div className="text-right space-y-4">
                    <p className="text-[14px] text-slate-600 font-black tracking-[0.3em] uppercase  opacity-60">{t('taxRateLabel')}</p>
                    <p className="text-4xl font-black text-emerald-400  font-mono opacity-80">{data.taxRate}%</p>
                 </div>
              </div>

              <div className="py-16 bg-white/5 rounded-[48px] border border-white/10 px-12 shadow-inner group/amount relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover/amount:opacity-100 transition-opacity" />
                 <p className="text-[13px] text-slate-500 mb-8 font-black uppercase tracking-[0.4em]  opacity-80">{t('totalTaxPayable')}</p>
                 <p className="text-7xl font-black tracking-tighter text-white  relative z-10">
                    <span className="text-3xl text-emerald-500 mr-5 font-black tracking-normal not- underline decoration-slate-800 decoration-4 underline-offset-4">{t('currencySymbol')}</span>
                    {data.taxAmount.toLocaleString()}
                 </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                 <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 flex flex-col justify-center gap-3 group/item hover:bg-white/10 transition-all cursor-crosshair">
                    <span className="text-[14px] text-slate-600 font-black uppercase tracking-[0.3em] ">{t('billingCycle')}</span>
                    <span className="text-[18px] text-white font-black uppercase tracking-tighter ">{t('fullCalendarMonth')}</span>
                 </div>
                 <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 flex flex-col justify-center gap-3 group/item hover:bg-white/10 transition-all cursor-crosshair">
                    <span className="text-[14px] text-slate-600 font-black uppercase tracking-[0.3em] ">{t('complianceCode')}</span>
                    <span className="text-[18px] text-emerald-400 font-black uppercase tracking-tighter  underline decoration-emerald-900 decoration-4 underline-offset-4">{t('complianceStatus')}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="card-premium border-slate-50 bg-white !p-20 hover:border-slate-300 transition-all shadow-sm !rounded-[64px] relative overflow-hidden group/notice">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 rounded-full blur-[120px] -mr-64 -mt-64 opacity-60 transition-transform group-hover/notice:scale-125 duration-1000"></div>
         <div className="flex flex-col xl:flex-row gap-16 items-center relative z-10">
            <div className="w-28 h-28 bg-white rounded-[44px] flex items-center justify-center text-6xl shadow-2xl border border-slate-50 group-hover/notice:rotate-12 transition-transform relative z-10 shadow-inner shrink-0">📜</div>
            <div className="flex-1 space-y-6 text-center xl:text-left">
               <h4 className="font-black text-slate-900 uppercase tracking-tighter text-3xl  underline decoration-emerald-500 decoration-8 underline-offset-8 decoration-white/0 group-hover/notice:decoration-emerald-500/20 transition-all duration-700">{t('complianceNoticeTitle')}</h4>
               <p className="text-[16px] text-slate-400 font-bold leading-relaxed max-w-4xl uppercase tracking-tight  opacity-70">
                 {t('complianceNoticeDesc')}
               </p>
            </div>
            <div className="w-full xl:w-auto">
               <button className="w-full xl:w-80 btn-premium active !bg-slate-900 !text-white !h-24 border-none text-[15px] font-black tracking-[0.3em] uppercase !rounded-[32px] shadow-3xl shadow-slate-900/10 !scale-100 hover:scale-105 active:scale-95 transition-all  underline decoration-slate-700 decoration-8 underline-offset-8 decoration-white/0 hover:decoration-slate-700/50">
                  {t('lockExportPdf')}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

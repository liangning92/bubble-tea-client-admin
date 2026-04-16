import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function SmartOpsHub() {
  const { lang, t } = useAuth();
  
  // 1. SKU 可售状态监控 (Real Data)
  const [skuAvailability, setSkuAvailability] = useState([]);
  const [loadingSku, setLoadingSku] = useState(true);

  // 2. 营销策略利润护航 (Margin Guard)
  const [campaign, setCampaign] = useState({
     productName: '',
     discount: 20,
     marginFloor: 25
  });
  const [guardResult, setGuardResult] = useState(null);
  const [validating, setValidating] = useState(false);

  const loadSkus = async () => {
    setLoadingSku(true);
    const data = await api('GET', '/delivery/strategy/sku-availability');
    if (!data.error) {
      setSkuAvailability(data);
    }
    setLoadingSku(false);
  };

  useEffect(() => {
    loadSkus();
  }, []);

  const handleGuardCheck = async () => {
    if (!campaign.productName) return;
    setValidating(true);
    const res = await api('POST', '/delivery/strategy/campaign-guard', {
      productName: campaign.productName,
      discountPercent: campaign.discount,
      marginFloor: campaign.marginFloor
    });
    if (!res.error) {
      setGuardResult(res);
    }
    setValidating(false);
  };

  const tl = (id_text, zh_text) => (lang === 'zh' ? zh_text : id_text);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 核心看板：SKU 可售状态实时熔断 */}
      <section className="space-y-4">
         <div className="flex justify-between items-end">
            <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{t('skuMonitor')}</h2>
               <p className="text-slate-500 font-medium ">{t('skuMonitorDesc')}</p>
            </div>
            <button 
              onClick={loadSkus}
              className="px-4 py-3 bg-slate-900 text-white text-[14px] font-black rounded-2xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200"
            >
               {t('refreshStatus')}
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingSku ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse"></div>
              ))
            ) : skuAvailability.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-[32px]">{t('noProductsFound')}</div>
            ) : (
              skuAvailability.map((sku, idx) => (
               <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                     <div>
                        <div className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('stockLevel')}</div>
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">{sku.available} <span className="text-[14px] font-medium text-slate-400">{t('cupsUnit')}</span></div>
                     </div>
                     <span className={`px-3 py-1.5 rounded-xl text-[14px] font-black uppercase tracking-widest border ${
                        sku.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        sku.status === 'Warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                     }`}>
                        {sku.status === 'Active' ? t('skuStatusActive') : sku.status === 'Warning' ? t('skuStatusWarning') : t('skuStatusOOS')}
                     </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors relative z-10">{sku.name}</h4>
                  
                  {/* 背景装饰 */}
                  <div className="absolute -bottom-6 -right-6 text-6xl opacity-[0.03] group-hover:opacity-10 transition-opacity rotate-12">🥤</div>
               </div>
              ))
            )}
         </div>
      </section>

      {/* 智能模块：利润护航 & 营销策略 (Margin Guard) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-slate-950 p-10 rounded-[48px] shadow-2xl space-y-8 relative overflow-hidden">
            <div className="relative z-10">
               <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 text-[14px] font-black rounded-full border border-indigo-500/30 uppercase tracking-widest">{t('growthEnginePlugin')}</span>
               <h3 className="text-4xl font-black text-white tracking-tighter mt-4 mb-2">{t('marginGuardAI')}</h3>
               <p className="text-slate-400 font-medium">{t('marginGuardDesc')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
               <div className="space-y-4">
                  <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1 text-white">{t('targetProduct')}</label>
                  <select 
                    value={campaign.productName}
                    onChange={(e) => setCampaign({ ...campaign, productName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                     <option value="">{t('selectSku')}</option>
                     {skuAvailability.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
               </div>
               <div className="space-y-4 text-white">
                  <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('discountRate')}</label>
                  <input 
                    type="number" 
                    value={campaign.discount}
                    onChange={(e) => setCampaign({ ...campaign, discount: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
               </div>
               <div className="space-y-4 flex items-end">
                  <button 
                    onClick={handleGuardCheck}
                    disabled={validating || !campaign.productName}
                    className="w-full py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-white hover:text-indigo-900 transition-all shadow-xl shadow-indigo-900/40 disabled:opacity-50"
                  >
                     {validating ? t('validating') : t('validateCampaign')}
                  </button>
               </div>
            </div>

            {guardResult && (
               <div className={`p-8 rounded-[32px] border animate-in zoom-in duration-300 ${guardResult.safe ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                  <div className="flex items-center justify-between mb-4">
                     <span className={`px-4 py-1.5 rounded-full text-[14px] font-black uppercase tracking-widest ${guardResult.safe ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {guardResult.safe ? t('safeToExecute') : t('marginAlert')}
                     </span>
                     <div className="text-right">
                        <div className="text-[14px] text-slate-500 font-bold uppercase">{t('projectedMargin')}</div>
                        <div className={`text-3xl font-black ${guardResult.safe ? 'text-emerald-400' : 'text-rose-400'}`}>{guardResult.projectedMargin}%</div>
                     </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                     {guardResult.safe 
                       ? `本次方案执行后毛利率为 ${guardResult.projectedMargin}%，符合门店 ${campaign.marginFloor}% 的利润红线要求。` 
                       : `警告：当前折扣将导致毛利降至 ${guardResult.projectedMargin}%，低于预警线。建议最高折扣不超过 ${guardResult.recommendedDiscount}%。`}
                  </p>
               </div>
            )}

            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -mr-20 -mt-20"></div>
         </div>

         <div className="bg-white border border-slate-200 p-8 rounded-[48px] shadow-sm flex flex-col justify-between">
            <div>
               <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-4">{t('bufferConfig')}</h4>
               <p className="text-sm text-slate-400 font-medium mb-8 ">{t('bufferConfigDesc')}</p>
               
               <div className="space-y-4">
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('oosTrigger')}</span>
                        <span className="text-[14px] font-bold text-indigo-600">5 Cups</span>
                     </div>
                     <p className="text-[14px] text-slate-400 font-medium">{t('oosTriggerDesc')}</p>
                  </div>
               </div>
            </div>
            <button className="w-full py-3 mt-8 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all">{t('saveConfig')}</button>
         </div>
      </section>

    </div>
  );
}

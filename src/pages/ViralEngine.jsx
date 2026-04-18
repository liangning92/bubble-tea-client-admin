import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function ViralEngine({ hideHeader }) {
  const { lang, t } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);

  // 核心裂变策略配置
  const [strategy, setStrategy] = useState({
    referralBonus: 5000,      // 拉新奖励 (Rp)
    inviteeDiscount: 48,     // 被邀请人折扣 %
    minSpendForBonus: 20000, // 触发奖励的最低消费
    campaignDuration: 30,    // 活动周期 (天)
    targetROI: 4.5
  });

  const [stats, setStats] = useState({
    totalInvites: 1250,
    successfulConversions: 450,
    growthRate: '12.5%',
    referralROI: '4.2x'
  });

  const [campaigns, setCampaigns] = useState([
    { id: 1, name: '老带新专属权益 (MGM)', incentive: '5K Coupon for both', status: 'Active', participants: 850, success: 320 },
    { id: 2, name: '社交推荐达人奖励', incentive: 'Free Drink after 3 invites', status: 'Active', participants: 400, success: 130 },
  ]);

  const tl = (id_text, zh_text) => (lang === 'zh' ? zh_text : id_text);

  const handleSaveStrategy = async () => {
    setLoading(true);
    try {
      // 模拟保存至系统配置
      await api('POST', '/system/config', {
        // 假设后端已支持扩展营销字段,此处模拟同步
        marketingViralStrategy: JSON.stringify(strategy)
      });
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('strategyUpdated') }));
      setIsEditingStrategy(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!hideHeader && (
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{tl('Mesin Viral & Fisi', '社交裂变引擎 (MGM)')}</h3>
            <p className="text-[14px] text-slate-500 font-medium mt-1 leading-relaxed max-w-md">
              {t('viralEngineDesc')}
            </p>
          </div>
          <div className="flex gap-3">
              <button
                onClick={() => setIsEditingStrategy(!isEditingStrategy)}
                className="bg-indigo-600 px-4 py-3.5 rounded-xl text-white text-[14px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
                {isEditingStrategy ? t('backToDashboard') : t('adjustGrowthStrategy')}
              </button>
          </div>
        </div>
      )}

      {isEditingStrategy ? (
        /* 策略管理面板 (Strategy Management Panel) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
            <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
               <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">🎯</span>
               {t('coreIncentiveRules')}
            </h4>

            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('referrerBonus')}</label>
                    <input
                      type="number" value={strategy.referralBonus}
                      onChange={(e) => setStrategy({...strategy, referralBonus: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('inviteeDiscountLabel')}</label>
                    <input
                      type="number" value={strategy.inviteeDiscount}
                      onChange={(e) => setStrategy({...strategy, inviteeDiscount: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('activationThreshold')}</label>
                  <input
                    type="number" value={strategy.minSpendForBonus}
                    onChange={(e) => setStrategy({...strategy, minSpendForBonus: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[14px] text-slate-400">{t('bonusActivationDesc')}</p>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl space-y-8 flex flex-col justify-between">
            <div className="space-y-8">
               <h4 className="text-xl font-black flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">📊</span>
                  {t('cycleAndRiskControl')}
               </h4>

               <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('campaignDurationLabel')}</label>
                      <span className="text-xl font-black text-indigo-400">{strategy.campaignDuration} Days</span>
                    </div>
                    <input
                      type="range" min="7" max="180" step="1"
                      value={strategy.campaignDuration}
                      onChange={(e) => setStrategy({...strategy, campaignDuration: parseInt(e.target.value)})}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('targetROIAlert')}</label>
                      <span className="text-xl font-black text-indigo-400">{strategy.targetROI}x</span>
                    </div>
                    <input
                      type="range" min="1" max="10" step="0.5"
                      value={strategy.targetROI}
                      onChange={(e) => setStrategy({...strategy, targetROI: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
               </div>
            </div>

            <button
              onClick={handleSaveStrategy}
              disabled={loading}
              className="w-full py-5 bg-white text-slate-900 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl">
              {loading ? t('syncing') : t('confirmDeployStrategy')}
            </button>
          </div>
        </div>
      ) : (
        /* 数据展示面板 (Stats Display Panel) - 原有逻辑 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: t('totalInvites'), value: stats.totalInvites, color: 'text-slate-800' },
                  { label: t('conversions'), value: stats.successfulConversions, color: 'text-emerald-600' },
                  { label: t('growthRateLabel'), value: stats.growthRate, color: 'text-indigo-600' },
                  { label: t('referralROILabel'), value: stats.referralROI, color: 'text-slate-800' }
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
             </div>

             <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('activeCampaigns')}</h4>
             {campaigns.map(c => (
               <div key={c.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="text-2xl">🤝</div>
                     <span className={`px-4 py-1 rounded text-[14px] font-black uppercase tracking-widest ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {c.status}
                     </span>
                  </div>
                  <h5 className="font-black text-slate-800 text-lg">{c.name}</h5>
                  <div className="mt-2 space-y-4">
                     <p className="text-[14px] text-slate-500 font-bold">Incentive: <span className="text-indigo-600">{c.incentive}</span></p>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Participants</p>
                        <p className="text-xl font-black text-slate-800">{c.participants}</p>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Success</p>
                        <p className="text-xl font-black text-blue-600">{c.success}</p>
                     </div>
                  </div>
                  <div className="mt-6">
                     <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[14px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                        {t('viewReferralPath')}
                     </button>
                  </div>
               </div>
             ))}
          </div>

          <div className="bg-slate-50 rounded-[48px] p-10 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
             <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-6">{t('previewCardSharing')}</h4>
             <div className="w-64 bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:rotate-2 transition-all cursor-pointer border border-slate-100">
                <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 flex flex-col justify-end relative">
                   <div className="absolute top-0 right-0 p-4 text-4xl opacity-20">🥤</div>
                   <h6 className="text-white font-black text-xl leading-tight">{t('inviteTea')}</h6>
                   <p className="text-indigo-100 text-[14px] font-bold mt-1">{t('friendInvite')}</p>
                </div>
                <div className="p-5 text-center">
                   <p className="text-slate-800 font-black text-sm mb-4">{t('newUserFreeCoupon')}</p>
                   <div className="w-24 h-24 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                      <div className="grid grid-cols-2 gap-1 opacity-20">
                         {Array.from({length: 4}).map((_, i) => <div key={i} className="w-4 h-4 bg-slate-800 rounded-sm"></div>)}
                      </div>
                   </div>
                   <p className="text-[14px] text-slate-400 font-bold uppercase tracking-widest  font-mono">INVITE CODE: BUBBLE-MAX</p>
                </div>
             </div>
             <p className="text-[14px] text-slate-400 mt-8 text-center max-w-xs leading-relaxed font-medium">
               {t('autoShareLinkDesc')}
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

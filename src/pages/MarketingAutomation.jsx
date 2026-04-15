import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MarketingAutomation({ hideHeader }) {
  const { lang, user } = useAuth();
  
  // 核心漏斗配置 (Funnel Strategy)
  const [config, setConfig] = useState({
    memberThreshold: 30000,
    lapseShort: 3,
    lapseLong: 7,
    autoNotify: true
  });

  const [automations, setAutomations] = useState([
    { id: 1, name: '流失挽回 (Retention)', trigger: `Lapse > ${config.lapseShort} Days`, action: 'Send 4.8折券', status: 'active', reached: 450, converted: 82 },
    { id: 2, name: '深度激活 (Re-activation)', trigger: `Lapse > ${config.lapseLong} Days`, action: 'Send 买一赠一', status: 'active', reached: 180, converted: 35 },
    { id: 3, name: '新客欢迎 (Welcome)', trigger: 'Spend > Rp 30,000', action: 'Send 5K + 10K Pack', status: 'active', reached: 1200, converted: 450 },
    { id: 4, name: '会员生日 (Birthday)', trigger: 'Birthday Month', action: 'Send Special Coupon', status: 'active', reached: 25, converted: 12 },
  ]);

  const tl = (id_text, zh_text) => (lang === 'zh' ? zh_text : id_text);

  return (
    <div className="space-y-10 animate-soft text-slate-900 pb-12">
      
      {/* 漏斗全局参数配置 (Lock-in & Trigger Settings) */}
      <div className="bg-slate-900 rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
         <div className="relative z-10 space-y-10">
            <div className="flex items-center gap-4">
               <span className="w-12 h-12 bg-orange-600/20 text-orange-500 rounded-2xl flex items-center justify-center text-2xl border border-orange-500/30">⚙️</span>
               <div>
                  {!hideHeader && (
                    <>
                      <h3 className="text-xl font-black tracking-tight uppercase">{tl('Growth Strategic Parameters', '自动化营销策略中心')}</h3>
                      <p className="text-[14px] font-black text-slate-500 uppercase tracking-widest mt-1">Real-time behavior triggers & algorithm control</p>
                    </>
                  )}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <div className="space-y-4">
                  <label className="block text-label-caps !text-slate-500">{tl('Membership Threshold', '会员准入门槛 (单笔消费)')}</label>
                  <div className="flex items-center gap-4">
                     <span className="text-slate-600 font-black text-xl">Rp</span>
                     <input 
                        type="number" 
                        value={config.memberThreshold} 
                        onChange={e => setConfig({...config, memberThreshold: parseInt(e.target.value)})}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-orange-500 w-full focus:ring-2 focus:ring-orange-500/30 outline-none transition-all"
                     />
                  </div>
                  <p className="text-[14px] text-slate-500 font-bold leading-relaxed ">当非会员在 POS 端单次消费满足条件，系统自动触发会员转化流程。</p>
               </div>

               <div className="space-y-4">
                  <label className="block text-label-caps !text-slate-500">{tl('Purchasing Cycle Triggers', '复购衰减周期 (天)')}</label>
                  <div className="flex items-center gap-4">
                     <input 
                        type="number" 
                        value={config.lapseShort} 
                        onChange={e => setConfig({...config, lapseShort: parseInt(e.target.value)})}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-white w-24 text-center"
                     />
                     <span className="text-slate-700 font-black">/</span>
                     <input 
                        type="number" 
                        value={config.lapseLong} 
                        onChange={e => setConfig({...config, lapseLong: parseInt(e.target.value)})}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-white w-24 text-center"
                     />
                     <span className="text-slate-500 font-black text-[14px] uppercase">Days</span>
                  </div>
                  <p className="text-[14px] text-slate-500 font-bold leading-relaxed ">设置“短周期失联”与“长周期沉睡”的计算阈值，用于差异化券包派发。</p>
               </div>

               <div className="flex flex-col justify-end">
                  <button className="btn-primary w-full !h-16">
                     {tl('Apply & Sync', '全域同步策略配置')}
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* 自动化任务列表 */}
      <div className="space-y-8">
        <div className="flex justify-between items-end px-2">
          <div>
             <h4 className="text-h3">{tl('Agentic Automations', '执行中的智能策略')}</h4>
             <p className="text-label-caps mt-1">Real-time conversions monitored by AI</p>
          </div>
          <div className="flex items-center gap-4 bg-orange-50 px-5 py-2.5 rounded-2xl border border-orange-100">
             <span className="text-[14px] font-black text-orange-600 uppercase tracking-widest">Global Auto-Send</span>
             <div className="w-10 h-5 bg-orange-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {automations.map(auto => (
            <div key={auto.id} className="card-premium !p-8 border-slate-100 bg-white group hover:border-orange-500/20 transition-all">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-6 items-center">
                     <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner border border-slate-100">
                        {auto.id === 1 ? '🧲' : auto.id === 2 ? '🔥' : auto.id === 3 ? '🎁' : '🎂'}
                     </div>
                     <div>
                        <h5 className="font-black text-slate-800 text-lg tracking-tight leading-snug">{auto.name}</h5>
                        <div className="text-[14px] font-black text-orange-600 uppercase tracking-widest mt-1">Triggered by: {auto.trigger}</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-4xl font-black text-slate-900 tracking-tighter ">{auto.reached > 0 ? Math.round(auto.converted/auto.reached*100) : 0}%</div>
                     <div className="text-[14px] text-slate-400 font-black uppercase tracking-widest mt-1">Conv. Rate</div>
                  </div>
               </div>
               
               {/* 自动生成的文案预览 (Content Generation) */}
               <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 relative mb-8 ">
                  <div className="absolute top-2 right-4 text-[8px] font-black text-slate-300 uppercase tracking-widest">AI Preview</div>
                  <div className="text-[13px] text-slate-500 leading-relaxed font-bold pr-10">
                     {auto.id === 1 ? '“感谢您支持 Bubble Tea。为您准备了一份老会员专属回馈礼：4.8折券已到账。期待您的再次光临！”' : 
                      auto.id === 2 ? '“温馨提示：您已有7天未光顾。点击领取买一赠一专属权益，开启美好的午后奶茶时光吧！”' :
                      '“欢迎成为品牌高级会员！总价值 Rp 30,000 的入会专属礼包已派发至您的账户...”'}
                  </div>
               </div>
 
               <div className="flex gap-3">
                  <button className="flex-1 btn-premium active !bg-slate-900 !text-white !h-12 border-none text-[14px] font-black uppercase tracking-widest">
                     策略分析
                  </button>
                  <button className="flex-1 px-6 py-2 text-slate-400 text-[14px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors">
                     规则编辑
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

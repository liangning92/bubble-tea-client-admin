import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubNav from '../components/SubNav';
import CRMHub from './CRMHub';
import MarketingCalendar from './MarketingCalendar';
import AutomationPage from './MarketingAutomation';
import DeliveryHub from './DeliveryHub';

export default function MarketingHub() {
  const { lang } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = [
    { key: 'members', icon: '👥', label: '会员中心' },
    { key: 'calendar', icon: '📅', label: '营销活动日历' },
    { key: 'automate', icon: '🤖', label: '自动化营销漏斗' },
    { key: 'delivery', icon: '🛵', label: '外卖平台对账' },
    { key: 'loyalty', icon: '🎁', label: '会员分销权益' },
    { key: 'assets', icon: '🖼️', label: '品牌视觉资产' },
  ];

  let tab = searchParams.get('tab') || 'members';
  const handleTabChange = (key) => setSearchParams({ tab: key });

  return (
    <div className="animate-soft space-y-10 focus:outline-none text-slate-900 pb-20">
      <div className="flex flex-col gap-2 px-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
           <span className="text-3xl">🚀</span> 智慧营销与品牌增长引擎
        </h2>
      </div>

      <div className="overflow-x-auto no-scrollbar py-2">
        <SubNav 
          tabs={tabs} 
          activeTab={tab} 
          onTabChange={handleTabChange} 
        />
      </div>

      <div className="min-h-[60vh] bg-white rounded-[48px] p-10 border border-slate-50 shadow-sm relative overflow-hidden">
        {tab === 'members' && <CRMHub hideHeader={true} />}
        {tab === 'calendar' && <MarketingCalendar hideHeader={true} />}
        {tab === 'automate' && <AutomationPage hideHeader={true} />}
        {tab === 'delivery' && <DeliveryHub hideHeader={true} />}
        {tab === 'loyalty' && <LoyaltyProgram hideHeader={true} />}
        {tab === 'assets' && <MarketingAssets hideHeader={true} />}
      </div>
    </div>
  );
}

function LoyaltyProgram({ hideHeader }) {
  return (
    <div className="space-y-10 animate-soft text-slate-900">
       <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <h3 className="text-xl font-black text-slate-900 uppercase">会员成长与分销矩阵</h3>
          <button className="btn-premium active !bg-slate-900 !text-white !px-10 !h-14 border-none shadow-xl !rounded-[20px] text-[13px] font-black uppercase tracking-widest">
             + 设定新权益
          </button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: '注册欢迎礼', desc: '新人专享礼包', active: true },
            { label: '多倍积分日', desc: '全线产品积分翻倍', active: true },
            { label: '生日专享权益', desc: '生日尊享 5 折优惠', active: false }
          ].map((item, i) => (
            <div key={i} className={`card-premium !p-10 border-slate-50 !rounded-[40px] ${!item.active && 'opacity-50 grayscale'}`}>
               <p className="text-[12px] font-black uppercase tracking-widest text-orange-600 mb-4">{item.label}</p>
               <h4 className="text-xl font-black text-slate-800 leading-tight mb-8">{item.desc}</h4>
               <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                  <span className={`text-[12px] font-black uppercase tracking-widest ${item.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {item.active ? '活动进行中' : '已暂停'}
                  </span>
                  <button className="text-[13px] font-black text-slate-900 uppercase tracking-widest hover:text-orange-600">配置参数</button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

function MarketingAssets({ hideHeader }) {
  return (
    <div className="space-y-10 animate-soft text-slate-900">
       <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <h3 className="text-xl font-black text-slate-900 uppercase">品牌视觉资产库</h3>
          <button className="btn-premium active !bg-slate-900 !text-white !px-10 !h-14 border-none shadow-xl !rounded-[20px] text-[13px] font-black uppercase tracking-widest">
             上传品牌素材
          </button>
       </div>
       
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => (
             <div key={i} className="card-premium !p-0 overflow-hidden border-slate-50 group hover:shadow-2xl transition-all !rounded-[32px]">
                <div className="aspect-square bg-slate-50 flex items-center justify-center text-slate-200">
                   <span className="text-5xl group-hover:scale-110 transition-transform">📸</span>
                </div>
                <div className="p-6 space-y-2 bg-white text-center">
                   <p className="text-[14px] font-black text-slate-800 truncate">品牌活动位_0{i}.png</p>
                   <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">素材尺寸: 1080x1080 / 2.4MB</p>
                </div>
             </div>
          ))}
       </div>

       <div className="p-16 rounded-[48px] bg-slate-900 text-white flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md">☁️</div>
          <div className="max-w-md mx-auto space-y-2">
             <h4 className="font-black uppercase tracking-widest text-[16px] text-orange-400">视觉资产云端同步已就绪</h4>
             <p className="text-[14px] text-white/50 font-bold leading-relaxed">
               所有上传的视觉资产将自动通过 CDN 指纹同步至全球收银终端。修改品牌 Logo 或海报将在下一次终端心跳周期内强制更新。
             </p>
          </div>
       </div>
    </div>
  );
}

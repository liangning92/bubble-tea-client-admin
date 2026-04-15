import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PRESET_HOLIDAYS = [
  { id: 'h1', date: '2024-02-10', name: 'Chinese New Year', zh: '春节', strategy: 'LTO Red Velvet Milk Tea', color: 'bg-red-500' },
  { id: 'h2', date: '2024-04-10', name: 'Eid al-Fitr (Lebaran)', zh: '开斋节', strategy: 'Family Bundle Buy 3 Get 1', color: 'bg-orange-500' },
  { id: 'h3', date: '2024-08-17', name: 'ID Independence Day', zh: '印尼国庆节', strategy: 'Merdeka Discount 17%', color: 'bg-red-600' },
  { id: 'h4', date: '2024-12-25', name: 'Christmas Day', zh: '圣诞节', strategy: 'Gift with Purchase: Xmas Cup Holder', color: 'bg-green-600' },
  { id: 'h5', date: '2025-01-29', name: 'Lunar New Year 2025', zh: '2025 春节', strategy: 'Golden Boba Series Launch', color: 'bg-amber-500' },
  { id: 'h6', date: '2025-03-31', name: 'Eid al-Fitr 2025', zh: '2025 开斋节', strategy: 'Ramadan Night Special Menu', color: 'bg-orange-600' },
];

export default function MarketingCalendar({ hideHeader }) {
  const { lang } = useAuth();
  const [events, setEvents] = useState(PRESET_HOLIDAYS);
  const [isEditing, setIsEditing] = useState(null);

  const handleUpload = () => {
    window.dispatchEvent(new CustomEvent('app:success', { detail: lang === 'zh' ? '营销素材上传成功' : 'Marketing assets uploaded' }));
  };

  return (
    <div className="space-y-10 animate-soft text-slate-900 pb-20">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
          <div>
            <h2 className="text-h2">📅 品牌营销策略排期</h2>
            <p className="text-label-caps mt-1">{lang === 'zh' ? '2024-2025 全域增长日历与自动大促节点' : '2024-2025 Growth Roadmap & Campaigns'}</p>
          </div>
          <button 
            onClick={handleUpload}
            className="btn-premium active !bg-slate-900 !text-white !px-8 border-none shadow-xl shadow-slate-900/10 !scale-100 hover:!scale-105 transition-all"
          >
            {lang === 'zh' ? '＋ 上传营销素材' : '＋ UPLOAD ASSETS'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {events.map((event) => (
            <div key={event.id} className="card-premium !p-8 border-slate-100 bg-white group hover:border-orange-500/20 transition-all">
              <div className="flex items-start gap-8">
                <div className={`w-20 h-20 ${event.color} rounded-[28px] flex flex-col items-center justify-center text-white shrink-0 shadow-lg border-2 border-white/20`}>
                  <div className="text-[14px] font-black uppercase opacity-70">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                  <div className="text-2xl font-black">{new Date(event.date).getDate()}</div>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                       <h3 className="font-black text-xl text-slate-800 tracking-tight">{lang === 'zh' ? event.zh : event.name}</h3>
                       <div className="text-[14px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{event.date}</div>
                    </div>
                    <button 
                      onClick={() => setIsEditing(event.id)}
                      className="px-5 py-2 bg-slate-50 text-slate-400 text-[14px] font-black rounded-xl border border-slate-100 uppercase hover:bg-slate-900 hover:text-white transition-all tracking-widest"
                    >
                      {lang === 'zh' ? '管理排单' : 'Manage'}
                    </button>
                  </div>
                  
                  <div className="mt-6 p-6 bg-orange-50 rounded-2xl border border-orange-100/30">
                    <p className="text-sm font-bold text-orange-900 leading-relaxed ">
                       <span className="text-[14px] uppercase font-black text-orange-400 block mb-1 tracking-widest not-">Strategy Logic / 营销逻辑:</span>
                       "{event.strategy}"
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3 flex-wrap">
                    {['POS Popup', 'Inventory Reserve', 'Push Notification'].map(tag => (
                       <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black rounded-lg border border-slate-100 uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="card-premium !p-10 bg-slate-900 border-none shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full" />
            <h3 className="text-[14px] font-black tracking-widest mb-6 border-b border-white/5 pb-4 uppercase text-slate-400">{lang === 'zh' ? 'AI 季度增长洞察' : 'Quarterly AI Insight'}</h3>
            <p className="text-sm font-bold leading-relaxed text-slate-300 ">
              {lang === 'zh' 
                ? '基于历史趋势，您的 Q2 营收预计在开斋节期间增长 350%。系统已自动开放库存预定权限。' 
                : 'Q2 revenue is projected to spike 350% during Eid holidays. Inventory reservation mode activated.'}
            </p>
            <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[14px] font-black uppercase text-slate-500 tracking-widest">Growth Confidence</span>
                  <span className="text-[14px] font-black text-orange-500">92%</span>
               </div>
               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-[92%] transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
               </div>
            </div>
          </div>

          <div className="card-premium !p-8 border-slate-100 bg-white shadow-sm">
            <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-6">Execution Pipeline / 执行状态</h3>
            <div className="space-y-4">
               {[
                 { label: 'POS Terminal Sync', status: 'Ready' },
                 { label: 'Stock Reservation', status: 'Ready' },
                 { label: 'Staff Campaign Notice', status: 'Pending' },
                 { label: 'WhatsApp Automation', status: 'Active' },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-slate-50 last:border-none pb-3 mb-3 last:pb-0 last:mb-0">
                    <span className="text-[13px] font-bold text-slate-600">{item.label}</span>
                    <span className={`text-[14px] font-black uppercase px-2.5 py-1 rounded-lg border ${item.status === 'Ready' || item.status === 'Active' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                      {item.status}
                    </span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

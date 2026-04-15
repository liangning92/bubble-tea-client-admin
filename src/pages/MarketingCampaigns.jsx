import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function MarketingCampaigns({ hideHeader }) {
  const { lang } = useAuth();
  const tl = (id_text, zh_text) => (lang === 'zh' ? zh_text : id_text);

  const campaigns = [
    { id: 1, name: '雨天暖心行动', status: 'ready', icon: '🌧️', desc: '系统实时抓取天气：当降雨概率 > 70% 时，热饮享 20% 折扣。', impact: '+15% Sales on Rain' },
    { id: 2, name: '开学季金榜题名', status: 'active', icon: '🎓', desc: '学生持学生证，购买“厚乳系列”买大杯赠小杯。', impact: 'High Traffic' },
    { id: 3, name: '新店开业全城狂欢', status: 'completed', icon: '🎊', desc: '针对新注册会员：单次充值 100 赠 50 积分。', impact: '+200 Members' },
  ];

  return (
    <div className="space-y-10 animate-soft text-slate-900 pb-12">
       {!hideHeader && (
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
          <div>
             <h3 className="text-h2">{tl('Marketing Campaigns', '全链路营销活动执行')}</h3>
             <p className="text-label-caps mt-1">Lifecycle event orchestration & outcome auditing</p>
          </div>
          <button className="btn-premium active !bg-slate-900 !text-white !px-8 border-none shadow-xl shadow-slate-900/10 !scale-100 hover:!scale-105 transition-all">
            {tl('Mulai Campaign Baru', '策划新活动')}
          </button>
        </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.map(c => (
          <div key={c.id} className="card-premium !p-8 border-slate-100 bg-white group hover:border-orange-500/20 transition-all relative overflow-hidden">
             {/* 状态徽章 */}
             <div className="mb-6 flex justify-between items-start">
                <div className="text-4xl bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-100">{c.icon}</div>
                <div className={`px-2.5 py-1 rounded-lg text-[14px] font-black uppercase tracking-widest border ${
                  c.status === 'active' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                  c.status === 'ready' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-slate-50 text-slate-300 border-slate-50'
                }`}>
                  {c.status}
                </div>
             </div>
             
             <h4 className="font-black text-xl text-slate-800 mb-3 tracking-tight leading-snug">{c.name}</h4>
             <p className="text-[13px] text-slate-400 mb-8 leading-relaxed font-bold  h-12 overflow-hidden">"{c.desc}"</p>
             
             <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                <div className="text-[14px] font-black text-orange-600 uppercase tracking-[0.2em]">
                   {tl('Impact', '预期影响')}: <span className="text-slate-800 ml-1">{c.impact}</span>
                </div>
                <button className="text-[14px] font-black text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-widest">Analytics →</button>
             </div>
             
             {/* 装饰渐变 */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
        
        {/* 添加位 */}
        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-12 cursor-pointer hover:bg-slate-50 hover:border-orange-200 transition-all group min-h-[300px]">
            <div className="w-16 h-16 rounded-full border-2 border-slate-300 flex items-center justify-center text-3xl text-slate-400 group-hover:scale-110 group-hover:border-orange-500 group-hover:text-orange-500 transition-all">+</div>
            <p className="text-slate-400 font-bold mt-6 text-[14px] uppercase tracking-widest group-hover:text-orange-600 transition-colors">{tl('Gunakan Template', '从模板库导入方案')}</p>
        </div>
      </div>
    </div>
  );
}

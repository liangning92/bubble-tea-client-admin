import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SmartOpsHub from './SmartOpsHub';
import BusinessDataTranslator from '../components/BusinessDataTranslator';
import DeliverySettings from '../components/DeliverySettings';
import SubNav from '../components/SubNav';

export default function DeliveryHub({ hideHeader }) {
  const { lang, user, t } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline'); // pipeline | smartops | settings
  
  // 模拟外卖订单数据 (Simulated Delivery Orders)
  const [orders, setOrders] = useState([
    { id: 'GRB-9901', platform: 'GrabFood', items: 'Jasmine Milk Tea x2', total: 'Rp 45,000', status: 'PENDING', time: '5m ago', color: 'bg-orange-500' },
    { id: 'SHP-2231', platform: 'ShopeeFood', items: 'Brown Sugar Cocoa x1', total: 'Rp 28,000', status: 'MAKING', time: '12m ago', color: 'bg-slate-900' },
    { id: 'GOJ-7711', platform: 'GoFood', items: 'Mango Pomelo Sago x3', total: 'Rp 115,000', status: 'READY', time: '18m ago', color: 'bg-orange-600' },
    { id: 'GRB-9905', platform: 'GrabFood', items: 'Oolong Tea x1', total: 'Rp 18,000', status: 'DELIVERY', time: '25m ago', color: 'bg-orange-400' },
  ]);

  const stats = [
    { label: '今日订单 (DPU)', value: '142', sub: t('totalOrderVolume'), icon: '🛵', color: 'text-orange-600' },
    { label: '峰值出餐 (Peak)', value: '6.4min', sub: t('efficiency'), icon: '⏱️', color: 'text-slate-900' },
    { label: '实到利润 (NTP)', value: 'Rp 2.4M', sub: t('netProfit'), icon: '💰', color: 'text-orange-600' },
    { label: '顾客好评 (CSAT)', value: '98.5%', sub: t('satisfaction'), icon: '⭐', color: 'text-slate-900' },
  ];

  const updateStatus = (id, nextStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    window.dispatchEvent(new CustomEvent('app:success', { detail: `Order ${id} updated to ${nextStatus}` }));
  };

  const tabs = [
    { key: 'pipeline', zh: '全域流水线', en: 'Pipeline', icon: '📺' },
    { key: 'smartops', zh: 'AI 调度中心', en: 'Smart Ops', icon: '🧠' },
    { key: 'settings', zh: '渠道接入配置', en: 'Integrations', icon: '⚙️' },
  ];

  const PipelineColumn = ({ title, status, icon }) => {
    const filteredOrders = orders.filter(o => o.status === status);
    return (
      <div className="flex-1 min-w-[340px] bg-slate-50/50 rounded-[40px] p-8 flex flex-col h-[750px] border border-slate-100/50">
        <div className="flex items-center justify-between mb-8 px-2">
           <div className="flex items-center gap-4">
              <span className="text-2xl">{icon}</span>
              <h4 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{title}</h4>
           </div>
           <span className="bg-white px-3 py-1.5 rounded-xl text-[14px] font-black text-slate-400 border border-slate-100 shadow-sm">
              {filteredOrders.length}
           </span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 px-1 no-scrollbar">
           {filteredOrders.map(order => (
             <div key={order.id} className="card-premium !p-8 group hover:scale-[1.02] active:scale-[0.98] transition-all border-slate-100 bg-white">
                <div className="flex justify-between items-start mb-6">
                   <div className={`px-2.5 py-1 rounded-lg text-[14px] font-black text-white uppercase tracking-widest ${order.color} border-2 border-white/20 shadow-sm`}>
                      {order.platform}
                   </div>
                   <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest ">{order.time}</span>
                </div>
                <div className="font-black text-slate-900 text-2xl mb-2 tracking-tight">{order.id}</div>
                <div className="text-[14px] font-bold text-slate-500 mb-8 leading-relaxed ">
                   <BusinessDataTranslator text={order.items} />
                 </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                   <span className="text-base font-black text-slate-900 tracking-tighter">{order.total}</span>
                   <div className="flex gap-2">
                      {status === 'PENDING' && (
                        <button onClick={() => updateStatus(order.id, 'MAKING')} className="btn-primary">开始接单</button>
                      )}
                      {status === 'MAKING' && (
                        <button onClick={() => updateStatus(order.id, 'READY')} className="btn-premium active !bg-slate-900 !text-white !px-6 !py-2.5 border-none shadow-lg shadow-slate-900/10 !text-[14px] uppercase font-black">核销出餐</button>
                      )}
                      {status === 'READY' && (
                        <div className="flex gap-2">
                           <button 
                             onClick={() => {
                                const msg = `🛵 您的外卖订单 ${order.id} 已制作完成！骑手正在赶来。`;
                                window.open(`https://wa.me/6281277889901?text=${encodeURIComponent(msg)}`, '_blank');
                             }}
                             className="px-4 py-2.5 bg-white text-orange-600 border border-orange-100 text-[14px] font-black rounded-xl uppercase hover:bg-orange-50 transition-all"
                           >
                              {t('notifyRider')}
                           </button>
                           <button onClick={() => updateStatus(order.id, 'DELIVERY')} className="btn-primary">骑手已取</button>
                        </div>
                      )}
                   </div>
                </div>
             </div>
           ))}
           {filteredOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale">
                 <span className="text-6xl mb-4">💤</span>
                 <p className="text-[14px] font-black uppercase tracking-widest">{t('noActiveTasks')}</p>
              </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-soft space-y-10 focus:outline-none">
      
      {/* Premium Header Header */}
      {!hideHeader && (
        <div className="flex flex-col gap-2 px-2">
          <h1 className="text-h1">{lang === 'zh' ? '全链路外卖中枢' : 'Delivery Backbone'}</h1>
          <p className="text-label-caps">{lang === 'zh' ? '多平台外卖实时对账与调度中心' : 'Multi-Channel Reconciliation & Ops Hub'}</p>
        </div>
      )}

      <div className="overflow-x-auto no-scrollbar pb-2 px-1">
        <SubNav 
          tabs={tabs.map(t => ({ ...t, label: lang === 'zh' ? t.zh : t.en }))} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>

      {activeTab === 'pipeline' ? (
        <div className="space-y-12">
          {/* 实时统计矩阵 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
             {stats.map((s, i) => (
               <div key={i} className="card-premium group relative !p-8 border-slate-100">
                  <p className="text-label-caps !text-[14px] !text-slate-400 mb-3 uppercase tracking-widest">{s.label}</p>
                  <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
                  <p className="text-[14px] font-black text-orange-400 mt-2 uppercase tracking-tighter ">{s.sub}</p>
                  <span className="absolute top-8 right-8 opacity-5 text-4xl group-hover:scale-125 transition-transform">{s.icon}</span>
               </div>
             ))}
          </div>

          {/* 交互流水线看板 */}
          <div className="overflow-x-auto pb-4 no-scrollbar">
             <div className="flex gap-10 min-w-max">
                <PipelineColumn title={t('statusPending')} status="PENDING" icon="🆕" />
                <PipelineColumn title={t('statusMaking')} status="MAKING" icon="🔥" />
                <PipelineColumn title={t('statusReady')} status="READY" icon="✅" />
                <PipelineColumn title={t('statusDelivery')} status="DELIVERY" icon="💨" />
             </div>
          </div>

          {/* 运营控制底部 */}
          <div className="bg-slate-900 rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 border border-white/5">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] -mr-64 -mt-64"></div>
             <div className="relative z-10 flex items-center gap-10">
                <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center text-4xl border border-white/10 shadow-inner">🛵</div>
                <div>
                   <h4 className="text-2xl font-black tracking-tight mb-2 uppercase ">外卖链路策略中心</h4>
                   <p className="text-[14px] text-slate-500 font-bold leading-relaxed max-w-md">当前有 8 名专送骑手在线，核心配送区覆盖良好。系统已自动根据高峰期延迟情况动态调整 Grab/GoJek 预计送达时间。</p>
                </div>
             </div>
             <div className="relative z-10 flex gap-4 w-full md:w-auto">
                <button className="flex-1 md:flex-none btn-premium active !bg-white/5 !text-slate-400 border border-white/10 !px-10 hover:!bg-white/10 transition-all">导出对账报告</button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="flex-1 md:flex-none btn-premium active !bg-white !text-slate-900 !px-12 shadow-2xl !scale-100 hover:!scale-105 transition-all text-[14px] font-black uppercase tracking-widest border-none">运营策略配置</button>
             </div>
          </div>
        </div>
      ) : activeTab === 'smartops' ? (
        <SmartOpsHub />
      ) : (
        <div className="max-w-4xl mx-auto pb-20 px-2">
          <DeliverySettings />
        </div>
      )}

    </div>
  );
}

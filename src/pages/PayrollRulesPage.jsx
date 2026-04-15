import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function PayrollRulesPage() {
  const { lang, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([
    { id: 'r1', name: '全勤奖励', type: 'fixed', amount: 300000, frequency: 'monthly' },
    { id: 'r2', name: '基础销售提成', type: 'per_cup', amount: 100, frequency: 'daily' }
  ]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/system/config');
      if (res && res.payrollRules) setRules(res.payrollRules);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRules(); }, []);

  const handleSave = async () => {
    const res = await api('POST', '/system/config', { payrollRules: rules });
    if (!res?.error) {
      window.dispatchEvent(new CustomEvent('app:success', { detail: '薪资结算规则已全线同步' }));
    }
  };

  return (
    <div className="space-y-10 animate-soft text-slate-900 pb-24 !max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
             <span className="text-3xl">⚙️</span> 薪资提成与结算标准配置
          </h2>
        </div>
        <button onClick={handleSave} className="btn-premium active !bg-slate-900 !text-white !px-12 !h-16 border-none shadow-2xl text-[14px] font-black uppercase tracking-widest !rounded-[24px]">
           保存并下发全局规则
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 1. 基础福利设置 */}
        <div className="card-premium border-slate-50 !p-12 space-y-10 bg-white shadow-xl !rounded-[48px]">
           <h4 className="text-xl font-black uppercase tracking-tight border-b border-slate-50 pb-8 text-slate-900">
             岗位基础福利设定
           </h4>
           <div className="space-y-6">
              {[
                { label: '月度全勤奖金', key: 'attendance', icon: '🏆' },
                { label: '工作餐补标 (每日)', key: 'meal', icon: '🍱' },
                { label: '通讯与路补', key: 'travel', icon: '🚗' }
              ].map(item => (
                <div key={item.key} className="flex justify-between items-center bg-slate-50 p-6 rounded-[28px] border border-slate-100 group transition-all">
                   <div className="flex items-center gap-5">
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-[15px] font-black text-slate-900 uppercase tracking-widest">{item.label}</span>
                   </div>
                   <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-inner border border-slate-100">
                      <span className="text-[12px] font-black text-slate-300">Rp</span>
                      <input className="bg-transparent text-right font-black text-slate-900 w-32 focus:outline-none" defaultValue="300,000" />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* 2. 核心：阶梯提成设置 */}
        <div className="card-premium border-orange-100 !p-12 space-y-10 bg-orange-50/20 shadow-xl !rounded-[48px] relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8">
              <div className="w-32 h-32 bg-orange-500 rounded-full blur-[80px] opacity-10" />
           </div>
           <h4 className="text-xl font-black uppercase tracking-tight border-b border-orange-200 pb-8 text-orange-600">
             销售阶梯提成矩阵
           </h4>
           
           <div className="space-y-6">
              <div className="p-8 bg-white rounded-[40px] border border-orange-100 flex justify-between items-center shadow-lg shadow-orange-500/5">
                 <div className="space-y-1">
                    <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">第一阶梯门槛</span>
                    <h5 className="text-[15px] font-black text-slate-900">单日 0 - 100 杯</h5>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-[12px] font-black text-orange-400">Rp</span>
                    <input className="bg-slate-50 px-5 py-3 rounded-2xl text-right font-black text-slate-900 w-28 border-none" defaultValue="150" />
                    <span className="text-[11px] font-black text-slate-300">/ 杯</span>
                 </div>
              </div>

              <div className="p-8 bg-white rounded-[40px] border-2 border-orange-500 flex justify-between items-center shadow-2xl shadow-orange-500/10 scale-[1.05]">
                 <div className="space-y-1">
                    <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">第二阶梯 (活跃推荐)</span>
                    <h5 className="text-[15px] font-black text-slate-900">单日 101 - 300 杯</h5>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-[12px] font-black text-orange-500">Rp</span>
                    <input className="bg-orange-50 px-5 py-3 rounded-2xl text-right font-black text-slate-900 w-28 border-none focus:ring-2 ring-orange-200" defaultValue="300" />
                    <span className="text-[11px] font-black text-slate-300">/ 杯</span>
                 </div>
              </div>

              <div className="p-8 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200 flex justify-between items-center opacity-70">
                 <h5 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">+ 新增进阶收益规则</h5>
                 <button className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm transition-all hover:scale-110">+</button>
              </div>
           </div>
           
           <div className="p-6 bg-white/50 rounded-[32px] border border-orange-100 flex items-center gap-4">
              <span className="text-2xl">🤖</span>
              <p className="text-[12px] text-slate-500 font-bold leading-relaxed">
                系统将实时监听云端 POS 核心成交点，根据每位店员的分账 ID 自动匹配提成级别，次日零点自动结算。
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

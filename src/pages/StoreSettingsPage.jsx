import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function StoreSettingsPage() {
  const { lang, user, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState({
    name: '',
    address: '',
    phone: '',
    taxId: '',
    currency: 'Rp',
    description: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/store');
      if (res && !res.error) setStore(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    const res = await api('PUT', '/store', store);
    if (!res?.error) {
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('settingsSaved') }));
    }
  };

  if (loading) return <div className="py-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">{t('loading') || '正在加载系统配置...'}</div>;

  return (
    <div className="space-y-10 animate-soft text-slate-900 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
          <div className="space-y-1">
             <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">品牌与商户基础配置</h2>
          </div>
          <button onClick={handleSave} className="btn-primary !h-16 !px-10">
             保存全局品牌改动
          </button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：基础资料 - 纯净化覆盖 */}
          <div className="card-premium border-slate-50 !p-10 space-y-10 !rounded-[48px] bg-white shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                <h4 className="text-[16px] font-black text-slate-900 uppercase tracking-widest">商户基础资料</h4>
             </div>
             <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">品牌/门店名称</label>
                   <input className="input-premium w-full !p-6 font-black text-[18px] !rounded-[24px] bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all" value={store.name} onChange={e => setStore({...store, name: e.target.value})} />
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">品牌标语/愿景</label>
                   <input className="input-premium w-full !p-6 !rounded-[24px] bg-slate-50 border-none transition-all placeholder:text-slate-300 font-bold" placeholder="写一句动人的品牌标语..." value={store.description} onChange={e => setStore({...store, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">品牌联系电话</label>
                      <input className="input-premium w-full !p-6 !rounded-[24px] bg-slate-50 border-none" value={store.phone} onChange={e => setStore({...store, phone: e.target.value})} />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">法定结算货币</label>
                      <input className="input-premium w-full !p-6 !rounded-[24px] bg-slate-100 border-none font-black text-orange-600 tracking-widest" value={store.currency} readOnly />
                   </div>
                </div>
             </div>
          </div>

          {/* 右侧：税务背景 - 纯净化覆盖 */}
          <div className="card-premium border-slate-50 !p-10 space-y-10 !rounded-[48px] bg-white shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
                <h4 className="text-[16px] font-black text-slate-900 uppercase tracking-widest">税务与法定合规</h4>
             </div>
             <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">门店/经营注册地址</label>
                   <textarea className="input-premium w-full !p-6 !rounded-[24px] bg-slate-50 border-none h-[155px] resize-none font-bold" value={store.address} onChange={e => setStore({...store, address: e.target.value})} />
                </div>
                <div className="space-y-3">
                   <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">纳税人识别号 (NPWP)</label>
                   <input className="input-premium w-full !p-6 !rounded-[24px] bg-slate-50 border-none font-mono text-[18px] tracking-widest" value={store.taxId} onChange={e => setStore({...store, taxId: e.target.value})} placeholder="99.999.999.9-999.999" />
                </div>
             </div>
          </div>
       </div>

       {/* 底部重要声明 - 纯净化覆盖 */}
       <div className="p-10 bg-slate-900 text-white rounded-[48px] shadow-2xl shadow-slate-900/10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8">
             <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center text-4xl backdrop-blur-md border border-white/5">⚠️</div>
             <div className="space-y-2">
                <h4 className="text-[16px] font-black uppercase tracking-widest text-orange-400">危急操作声明</h4>
                <p className="text-[14px] text-white/60 font-bold leading-relaxed max-w-xl">
                   修改全局商户参数将立即同步至该品牌下的所有收银终端与移动端。为保证业务连续性，请务必在非高峰营业时段进行重大变更。
                </p>
             </div>
          </div>
          <button className="px-10 py-5 bg-white/10 hover:bg-white hover:text-slate-900 text-white font-black text-[13px] uppercase tracking-[0.3em] rounded-2xl transition-all border border-white/10 backdrop-blur-md">
             重置为初始配置
          </button>
       </div>
    </div>
  );
}

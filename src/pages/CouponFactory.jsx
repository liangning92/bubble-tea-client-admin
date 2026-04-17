import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CouponFactory({ hideHeader }) {
  const { lang, t } = useAuth();
  const [coupons, setCoupons] = useState([
    { id: 1, name: '新人专享大额券', type: 'fixed', value: 10000, minSpend: 25000, expires: '2026-12-31', status: 'active', usedCount: 45, totalCount: 200 },
    { id: 2, name: '全场 8.5 折', type: 'percent', value: 15, minSpend: 15000, expires: '2026-05-01', status: 'active', usedCount: 120, totalCount: 500 },
  ]);

  const [showConfig, setShowConfig] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ name: '', type: 'fixed', value: '', minSpend: '', totalCount: '' });

  const tl = (id_text, zh_text) => (lang === 'zh' ? zh_text : id_text);

  const handleCreate = (e) => {
    e.preventDefault();
    const coupon = {
      ...newCoupon,
      id: Date.now(),
      value: parseInt(newCoupon.value),
      minSpend: parseInt(newCoupon.minSpend),
      totalCount: parseInt(newCoupon.totalCount),
      usedCount: 0,
      expires: '2026-12-31',
      status: 'active'
    };
    setCoupons([coupon, ...coupons]);
    setShowConfig(false);
    window.dispatchEvent(new CustomEvent('app:success', { detail: tl('Kupon berhasil dibuat!', '营销优惠券已发布，即刻生效。') }));
  };

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex justify-between items-center">
          <div>
             <h3 className="text-xl font-black text-slate-800 tracking-tight">{tl('Pabrik Kupon', '优惠券工厂')}</h3>
             <p className="text-[14px] text-slate-500 font-medium mt-1">{t('couponFactoryDesc')}</p>
          </div>
          <button 
            onClick={() => setShowConfig(true)}
            className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            {tl('Buat Baru', '新建优惠券')}
          </button>
        </div>
      )}

      {showConfig && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 animate-in zoom-in duration-200">
           <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[14px] font-bold text-slate-500 mb-1">{t('couponName')} (Name)</label>
                    <input type="text" className="input w-full bg-white" placeholder={t('placeholderCategoryExample')} required value={newCoupon.name} onChange={e=>setNewCoupon({...newCoupon, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[14px] font-bold text-slate-500 mb-1">{t('couponType')} (Type)</label>
                    <select className="input w-full bg-white font-bold h-11" value={newCoupon.type} onChange={e=>setNewCoupon({...newCoupon, type: e.target.value})}>
                       <option value="fixed">{t('optionCouponFixed')}</option>
                       <option value="percent">{t('optionCouponPercent')}</option>
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-[14px] font-bold text-slate-500 mb-1">{t('couponValue')}</label>
                    <input type="number" className="input w-full bg-white font-black text-emerald-600" required value={newCoupon.value} onChange={e=>setNewCoupon({...newCoupon, value: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[14px] font-bold text-slate-500 mb-1">{t('minSpendLabel')}</label>
                    <input type="number" className="input w-full bg-white" required value={newCoupon.minSpend} onChange={e=>setNewCoupon({...newCoupon, minSpend: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[14px] font-bold text-slate-500 mb-1">发行总量 (Qnty)</label>
                    <input type="number" className="input w-full bg-white" required value={newCoupon.totalCount} onChange={e=>setNewCoupon({...newCoupon, totalCount: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-2 pt-2">
                 <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">发步券码 (Deploy)</button>
                 <button type="button" onClick={()=>setShowConfig(false)} className="px-4 bg-white border border-slate-200 rounded-xl font-bold">取消</button>
              </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {coupons.map(cp => (
           <div key={cp.id} className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-blue-400 transition-all">
              {/* 装饰性打孔圆 */}
              <div className="absolute top-1/2 -left-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-200 -translate-y-1/2"></div>
              <div className="absolute top-1/2 -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-200 -translate-y-1/2 border-l-0"></div>
              
              <div className="p-5 pl-8 pr-8 flex items-center justify-between">
                 <div className="flex-1">
                    <div className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{cp.type === 'fixed' ? 'Direct Discount' : 'Rebate Promo'}</div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{cp.name}</h4>
                    <p className="text-[14px] text-slate-500 font-bold mt-1 uppercase">门槛: 满 {cp.minSpend.toLocaleString()} 可用 · 有效期至 {cp.expires}</p>
                 </div>
                 <div className="text-right pl-4">
                    <div className="text-3xl font-black text-blue-600 tracking-tighter">
                       {cp.type === 'fixed' ? `Rp ${(cp.value / 1000).toFixed(0)}K` : `${cp.value}%`}
                    </div>
                    <div className="text-[14px] font-black text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1">{t('offerReady')}</div>
                 </div>
              </div>

              <div className="bg-slate-50 px-5 py-3 flex justify-between items-center border-t border-slate-100">
                 <div className="flex-1">
                    <div className="flex justify-between text-[14px] font-black text-slate-400 mb-1 uppercase">
                       <span>核销进度 ({cp.usedCount}/{cp.totalCount})</span>
                       <span>{Math.round((cp.usedCount / cp.totalCount) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${(cp.usedCount/cp.totalCount)*100}%` }}></div>
                    </div>
                 </div>
                 <button className="ml-4 p-2 text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}

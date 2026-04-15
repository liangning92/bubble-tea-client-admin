import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function SupplierManagement() {
  const { lang, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    api('GET', '/suppliers')
      .then(res => {
        if (res && !res.error) setSuppliers(res);
        else {
          setSuppliers([
             { id: 1, name: 'Susu Fresh Indo (乳品直供)', category: 'DAIRY', contact: 'Adi 经理', phone: '+62 812-3456-7800' },
             { id: 2, name: 'Global Tea Source (原叶茶源)', category: 'TEA', contact: 'Lin 经理', phone: '+86 138-0013-8000' },
             { id: 3, name: 'Packaging Pro (包材定制)', category: 'PACKAGING', contact: '客服', phone: '+62 21-555-0199' }
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const categoryMap = { DAIRY: '专业乳制品', TEA: '核心茶基底', PACKAGING: '包材/易耗品' };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">同步供应商协同中...</div>;

  return (
    <div className="space-y-8 animate-soft pb-24 !max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
             <span className="text-4xl">🚛</span>
             <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">核心供应商协同矩阵</h2>
          </div>
        </div>
        <button className="btn-premium active !bg-slate-900 !text-white !px-12 !h-16 border-none shadow-2xl text-[14px] font-black uppercase tracking-widest !rounded-[20px]">
           + 录入新合作伙伴
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {suppliers.map(s => (
          <div key={s.id} className="card-premium !p-10 !rounded-[48px] bg-white border-slate-50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group overflow-hidden">
            <div className="flex justify-between items-start mb-8">
               <div className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  {categoryMap[s.category] || s.category}
               </div>
               <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                  <span className="text-2xl group-hover:rotate-12 transition-transform">📦</span>
               </div>
            </div>
            
            <h3 className="text-[20px] font-black text-slate-900 mb-8 leading-tight">{s.name}</h3>
            
            <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 mb-8">
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">关键联系人</p>
                  <p className="font-black text-slate-600 text-[14px]">{s.contact}</p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">直连电话</p>
                  <p className="font-black text-slate-600 text-[14px]">{s.phone}</p>
               </div>
            </div>

            <div className="flex gap-4">
               <button className="flex-1 h-14 bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest rounded-[20px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                  访问供应链系统
               </button>
               <button className="w-14 h-14 bg-white border border-slate-100 rounded-[20px] flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all">
                  ⚙️
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

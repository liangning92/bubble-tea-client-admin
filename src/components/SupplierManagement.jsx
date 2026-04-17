import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function SupplierManagement() {
  const { lang, t } = useAuth();
  const [suppliers, setSuppliers] = useState([
     { id: 1, name: 'Banten Tea Estate', contact: 'Mr. Rudy', phone: '0812-3344-5566', category: 'Tea Leaves' },
     { id: 2, name: 'Susu Indo Dist', contact: 'Santi', phone: '0813-9988-7766', category: 'Dairy' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', category: 'Material' });

  const handleAdd = (e) => {
    e.preventDefault();
    setSuppliers([...suppliers, { ...form, id: Date.now() }]);
    setShowAdd(false);
    setForm({ name: '', contact: '', phone: '', category: 'Material' });
    window.dispatchEvent(new CustomEvent('app:success', { detail: t('supplierSaved') }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-xl font-bold text-slate-800 tracking-tight">{t('supplierTitle')}</h3>
           <p className="text-[14px] text-slate-400 mt-1">{lang === 'zh' ? '管理所有物料供应源头及紧急联系方式。' : 'Manage your supply chain sources and emergency contact information.'}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[14px] uppercase tracking-widest hover:scale-105 transition shadow-xl shadow-indigo-500/10">
           + {t('addSupplier')}
        </button>
      </div>

      {showAdd && (
         <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <input className="input" placeholder="Supplier Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
               <input className="input" placeholder="Contact Person" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
               <input className="input" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
               <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="Tea">Tea Leaves</option>
                  <option value="Dairy">Dairy & Milk</option>
                  <option value="Syrup">Syrup & Toppings</option>
                  <option value="Packaging">Packaging</option>
               </select>
               <div className="lg:col-span-4 flex gap-2">
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Save Supplier</button>
                  <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold">Cancel</button>
               </div>
            </form>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {suppliers.map(s => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-100 transition"></div>
               <div className="relative z-10">
                  <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mb-2 inline-block tracking-widest">{s.category}</span>
                  <h4 className="text-xl font-black text-slate-800 mb-4">{s.name}</h4>
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="opacity-60">👤</span>
                        <span className="font-bold">{s.contact}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="opacity-60">📞</span>
                        <span className="font-mono font-bold">{s.phone}</span>
                     </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                     <button className="text-[14px] font-bold text-slate-400 hover:text-red-500 transition">Remove ✕</button>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}

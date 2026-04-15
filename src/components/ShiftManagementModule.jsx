import React, { useState } from 'react';
import { api, useAuth } from '../context/AuthContext';

/**
 * 班次设置中枢
 */
export default function ShiftManagementModule({ shifts, onUpdate, lang }) {
  const { t } = useAuth();
  const [form, setForm] = useState({ name: '', startTime: '09:00', endTime: '18:00', color: '#3B82F6' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api('POST', '/schedule/shifts', form);
      if (!res.error) {
        setForm({ name: '', startTime: '09:00', endTime: '18:00', color: '#3B82F6' });
        onUpdate();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteShiftConfirm'))) return;
    await api('DELETE', `/schedule/shifts/${id}`);
    onUpdate();
  };

  return (
    <div className="space-y-8 animate-soft">
      {/* 班次列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map(s => (
          <div key={s.id} className="group relative bg-white border border-slate-100 p-6 rounded-[32px] hover:shadow-xl hover:scale-[1.02] transition-all cursor-default overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 font-bold p-2">✕</button>
            </div>
            <div className="flex items-center gap-5">
              <div 
                className="w-14 h-14 rounded-2xl shadow-lg border-4 border-white flex-shrink-0" 
                style={{ backgroundColor: s.color }}
              ></div>
              <div className="min-w-0">
                <h4 className="text-[16px] font-black text-slate-800 uppercase truncate">{s.name}</h4>
                <p className="text-[14px] text-slate-400 font-bold mt-1">🕒 {s.startTime} - {s.endTime}</p>
              </div>
            </div>
          </div>
        ))}

        {/* 新增表单卡片 */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-[32px]">
           <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <input 
                    className="input-premium !bg-white !rounded-2xl !p-4 !h-14 text-[14px] font-black uppercase" 
                    placeholder={t('name')}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                 />
                 <div className="flex items-center gap-3 bg-white px-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">COLOR</span>
                    <input 
                        type="color" 
                        className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" 
                        value={form.color}
                        onChange={e => setForm({ ...form, color: e.target.value })}
                    />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-300 uppercase pl-2">In</label>
                    <input type="time" className="input-premium !bg-white !rounded-2xl !p-4 !h-12 text-[14px] font-black" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-300 uppercase pl-2">Out</label>
                    <input type="time" className="input-premium !bg-white !rounded-2xl !p-4 !h-12 text-[14px] font-black" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                 </div>
              </div>
              <button 
                disabled={loading}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {t('addShift')}
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}

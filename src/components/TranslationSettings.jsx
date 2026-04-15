import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function TranslationSettings() {
  const { lang, t } = useAuth();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ sourceText: '', translatedText: '', targetLang: 'id', category: 'UI' });

  const loadData = async () => {
    setLoading(true);
    const res = await api('GET', '/system/mappings');
    setMappings(Array.isArray(res) ? res : (res?.data || []));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api('POST', '/system/mappings', form);
    if (!res.error) {
       window.dispatchEvent(new CustomEvent('app:success', { detail: lang === 'zh' ? '字典已更新' : 'Translation updated' }));
       setShowAdd(false);
       setForm({ sourceText: '', translatedText: '', targetLang: 'id', category: 'UI' });
       loadData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(lang === 'zh' ? '确定删除此翻译映射？' : 'Delete mapping?')) {
       await api('DELETE', `/system/mappings/${id}`);
       loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-xl font-bold text-slate-800 tracking-tight">{lang === 'zh' ? '双语词典管控' : 'Dictionary Control'}</h3>
           <p className="text-[14px] text-slate-400 mt-1">{lang === 'zh' ? '自定义产品名或 UI 标签的翻译映射。' : 'Override system labels or product names with custom translations.'}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[14px] uppercase tracking-widest hover:scale-105 transition shadow-xl">
           + {lang === 'zh' ? '新增映射' : 'Add Entry'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 animate-in slide-in-from-top-4 duration-300">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input className="input" placeholder="源文本 (Source Text)" value={form.sourceText} onChange={e => setForm({...form, sourceText: e.target.value})} required />
              <input className="input" placeholder="翻译文 (Translated Text)" value={form.translatedText} onChange={e => setForm({...form, translatedText: e.target.value})} required />
              <select className="input" value={form.targetLang} onChange={e => setForm({...form, targetLang: e.target.value})}>
                 <option value="id">Bahasa Indonesia</option>
                 <option value="zh">简体中文</option>
                 <option value="en">English</option>
              </select>
              <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                 <option value="UI">Universal UI</option>
                 <option value="Product">Product Name</option>
                 <option value="System">System Prompt</option>
              </select>
              <div className="lg:col-span-4 flex gap-2">
                 <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">{lang === 'zh' ? '保存映射' : 'Save'}</button>
                 <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold">{lang === 'zh' ? '取消' : 'Cancel'}</button>
              </div>
           </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
           <thead className="bg-slate-50 text-slate-400">
              <tr>
                 <th className="px-6 py-4 font-black uppercase text-[14px] tracking-widest border-b border-slate-100">Source Text</th>
                 <th className="px-6 py-4 font-black uppercase text-[14px] tracking-widest border-b border-slate-100">Target Language</th>
                 <th className="px-6 py-4 font-black uppercase text-[14px] tracking-widest border-b border-slate-100">Translated Meaning</th>
                 <th className="px-6 py-4 font-black uppercase text-[14px] tracking-widest border-b border-slate-100 text-right">Action</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {mappings.length === 0 ? (
                <tr>
                   <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest ">{loading ? 'Syncing...' : 'No Custom Translations'}</td>
                </tr>
              ) : (
                mappings.map(m => (
                  <tr key={m.id} className="group hover:bg-slate-50/50 transition">
                     <td className="px-6 py-4 font-black text-slate-800">{m.sourceText}</td>
                     <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[14px] font-black uppercase">{m.targetLang}</span>
                     </td>
                     <td className="px-6 py-4 font-bold text-blue-600">{m.translatedText}</td>
                     <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">✕</button>
                     </td>
                  </tr>
                ))
              )}
           </tbody>
        </table>
      </div>
    </div>
  );
}

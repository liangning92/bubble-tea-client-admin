import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function SupplierManagement() {
  const { lang, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'GENERAL', contact: '', phone: '', email: '', address: '' });

  const categoryOptions = [
    { key: 'DAIRY', label: t('catMilk') || '乳制品' },
    { key: 'TEA', label: t('catTea') || '茶叶' },
    { key: 'PACKAGING', label: t('catPackaging') || '包材' },
    { key: 'TOPPING', label: t('catTopping') || '小料/配料' },
    { key: 'FRUIT', label: t('catFruit') || '鲜果' },
    { key: 'GENERAL', label: t('catOther') || '其他' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/suppliers');
      if (res && !res.error) {
        setSuppliers(Array.isArray(res) ? res : (res?.data || []));
      } else {
        setSuppliers([
          { id: 1, name: 'Susu Fresh Indo (乳品直供)', category: 'DAIRY', contact: 'Adi 经理', phone: '+62 812-3456-7800' },
          { id: 2, name: 'Global Tea Source (原叶茶源)', category: 'TEA', contact: 'Lin 经理', phone: '+86 138-0013-8000' },
          { id: 3, name: 'Packaging Pro (包材定制)', category: 'PACKAGING', contact: '客服', phone: '+62 21-555-0199' }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ name: '', category: 'GENERAL', contact: '', phone: '', email: '', address: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name || '',
      category: s.category || 'GENERAL',
      contact: s.contact || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      let res;
      if (editId) {
        res = await api('PUT', `/suppliers/${editId}`, form);
      } else {
        res = await api('POST', '/suppliers', form);
      }
      if (res && !res.error) {
        setShowForm(false);
        loadData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete') || '确定删除？')) return;
    setDeletingId(id);
    try {
      const res = await api('DELETE', `/suppliers/${id}`);
      if (res && !res.error) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getCatLabel = (key) => categoryOptions.find(c => c.key === key)?.label || key;
  const getCatColor = (key) => {
    const colors = {
      DAIRY: 'bg-blue-100 text-blue-700',
      TEA: 'bg-amber-100 text-amber-700',
      PACKAGING: 'bg-slate-100 text-slate-700',
      TOPPING: 'bg-pink-100 text-pink-700',
      FRUIT: 'bg-green-100 text-green-700',
      GENERAL: 'bg-slate-100 text-slate-600'
    };
    return colors[key] || colors.GENERAL;
  };

  if (loading) return (
    <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">
      {t('accessingProcurement') || '同步供应商协同中...'}
    </div>
  );

  return (
    <div className="space-y-8 animate-soft pb-24 !max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🚛</span>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{t('tabSuppliers') || '供应链管理'}</h2>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mt-1">{suppliers.length} 家合作伙伴</p>
            </div>
          </div>
        </div>
        <button onClick={handleOpenAdd} className="btn-premium active !bg-[#FF7700] !text-white !px-10 !h-14 border-none shadow-2xl shadow-orange-500/20 text-[13px] font-black uppercase tracking-widest !rounded-[20px] active:scale-95 transition-all">
          + 录入新合作伙伴
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {suppliers.map(s => (
          <div key={s.id} className="card-premium !p-8 !rounded-[40px] bg-white border-slate-50 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start mb-6">
              <span className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-full shadow-sm ${getCatColor(s.category)}`}>
                {getCatLabel(s.category)}
              </span>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-[#FF7700] group-hover:text-white group-hover:rotate-12 transition-all shadow-inner">
                <span className="text-xl">📦</span>
              </div>
            </div>

            <h3 className="text-[18px] font-black text-slate-900 mb-5 leading-tight">{s.name}</h3>

            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50/50 rounded-[28px] border border-slate-100 mb-6">
              <div className="space-y-4.5">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('staffName') || '联系人'}</p>
                <p className="font-black text-slate-700 text-[13px]">{s.contact || '-'}</p>
              </div>
              <div className="space-y-4.5">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('contactPhone') || '电话'}</p>
                <p className="font-black text-slate-700 text-[13px]">{s.phone || '-'}</p>
              </div>
              {s.email && (
                <div className="space-y-4.5 col-span-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Email</p>
                  <p className="font-black text-slate-700 text-[13px]">{s.email}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleOpenEdit(s)} className="flex-1 h-12 bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest rounded-[20px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                ✏️ 编辑
              </button>
              <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                className="w-12 h-12 bg-white border border-slate-100 rounded-[20px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-95 disabled:opacity-40">
                {deletingId === s.id ? '...' : '🗑️'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {suppliers.length === 0 && !loading && (
        <div className="text-center py-40 card-premium !bg-slate-50 border-2 border-dashed border-slate-100 !rounded-[56px]">
          <div className="text-7xl mb-8 grayscale opacity-10">🚛</div>
          <p className="text-slate-300 font-black uppercase tracking-widest text-sm">{t('noRecordsFound') || '暂无供应商记录'}</p>
          <button onClick={handleOpenAdd} className="btn-premium active !bg-[#FF7700] !text-white !px-12 !py-3 !mt-8 border-none shadow-xl text-[13px] font-black uppercase tracking-widest !rounded-[20px]">
            + 录入第一家供应商
          </button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="card-premium w-full max-w-md m-0 shadow-2xl animate-soft bg-white !rounded-[40px] !p-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {editId ? '✏️ 编辑供应商' : '+ 新增供应商'}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-900 hover:text-white transition-all">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{t('name') || '名称'}</label>
                <input className="input-premium w-full !bg-slate-50 !rounded-[20px] !p-5 font-black text-[15px] border-none" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="供应商名称" />
              </div>
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{t('category') || '类别'}</label>
                <select className="input-premium w-full !bg-slate-50 !rounded-[20px] !p-5 font-black text-[15px] border-none appearance-none" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {categoryOptions.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{t('staffName') || '联系人'}</label>
                  <input className="input-premium w-full !bg-slate-50 !rounded-[20px] !p-5 font-black text-[15px] border-none" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="联系人姓名" />
                </div>
                <div className="space-y-4">
                  <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{t('contactPhone') || '电话'}</label>
                  <input className="input-premium w-full !bg-slate-50 !rounded-[20px] !p-5 font-black text-[15px] border-none" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+62 xxx" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                <input className="input-premium w-full !bg-slate-50 !rounded-[20px] !p-5 font-black text-[15px] border-none" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="supplier@example.com" />
              </div>
              <div className="space-y-4">
                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{t('address') || '地址'}</label>
                <input className="input-premium w-full !bg-slate-50 !rounded-[20px] !p-5 font-black text-[15px] border-none" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="供应商地址" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="flex-1 btn-premium active !bg-[#FF7700] !text-white !h-14 border-none shadow-xl shadow-orange-500/20 text-[14px] font-black uppercase tracking-widest !rounded-[20px] active:scale-95 disabled:opacity-50 transition-all">
                  {saving ? (t('processingDatabase') || '处理中...') : (t('save') || '保存')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-premium active !bg-slate-50 !text-slate-400 !h-14 !px-8 border-none text-[14px] font-black uppercase tracking-widest !rounded-[20px] active:scale-95 transition-all">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

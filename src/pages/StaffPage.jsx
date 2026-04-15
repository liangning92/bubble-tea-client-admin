import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function StaffPage({ defaultTab, hideHeader }) {
  const { t } = useAuth();
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState(defaultTab || 'info');
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: '', phone: '', role: 'barista', position: '', baseSalary: '',
    hireDate: new Date().toISOString().split('T')[0], status: 'active',
    permissions: null, salaryView: 'all'
  });

  const roles = [
    { value: 'manager', label: t('manager', '店长') },
    { value: 'barista', label: t('barista', '茶艺师') },
    { value: 'cashier', label: t('cashier', '收银员') },
    { value: 'crew', label: t('crew', '普通员工') },
    { value: 'admin', label: t('admin', '系统管理员') },
  ];

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const data = await api('GET', '/staff');
      setStaff(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) {
      console.error("Load Staff Failed", e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 严谨性处理：物理提取数字，防止非数字字符搞崩数据库
    const cleanSalary = String(form.baseSalary).replace(/[^\d]/g, '');
    const submitData = { 
      ...form, 
      baseSalary: parseFloat(cleanSalary) || 0,
      position: form.position || roles.find(r => r.value === form.role)?.label || form.role
    };

    try {
      let res;
      if (editId) res = await api('PUT', `/staff/${editId}`, submitData);
      else res = await api('POST', '/staff', submitData);

      if (res && !res.error) {
        setShowForm(false);
        loadData();
        showToast(t('saveSuccess', '档案物理保存成功'));
      } else {
        showToast(res?.error || 'Server Error', 'error');
      }
    } catch (e) {
      showToast('Network Crash', 'error');
    }
  };

  const handleEdit = (s) => {
    setForm({
      name: s.name || '', phone: s.phone || '', role: s.role || 'barista',
      position: s.position || '', baseSalary: s.baseSalary || 0,
      hireDate: s.hireDate ? s.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
      status: s.status || 'active', permissions: s.permissions, salaryView: s.salaryView || 'all',
    });
    setEditId(s.id);
    setShowForm(true);
  };

  return (
    <div className={`animate-soft space-y-6 pb-24 !max-w-7xl mx-auto ${hideHeader ? '!pt-0' : ''}`}>
      {toast && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[300] px-10 py-4 rounded-2xl shadow-3xl font-black text-[13px] border-4 border-white animate-soft ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
           {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-end px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
             <span className="text-3xl">👤</span> {t('staffManagement', '员工档案数字化管理')}
          </h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Data-driven personnel operations</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', phone: '', role: 'barista', position: '', baseSalary: '', hireDate: new Date().toISOString().split('T')[0], status: 'active', permissions: null, salaryView: 'all' }); }}
          className="h-14 bg-slate-900 text-white px-10 rounded-[20px] shadow-2xl text-[13px] font-black uppercase tracking-widest active:scale-95 transition-all">
          + {t('addNewStaff', '录入新员工档案')}
        </button>
      </div>

      <div className="card-premium !p-0 bg-white border-slate-100 shadow-xl !rounded-[40px] overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('staffName', '档案主体')}</th>
              <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('rolePosition', '角色岗位')}</th>
              <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{t('baseSalary', '薪资底薪')}</th>
              <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{t('status', '当前状态')}</th>
              <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{t('actions', '操作')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staff.length > 0 ? staff.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-all group">
                <td className="p-8 font-black text-slate-900 text-[15px]">{s.name}</td>
                <td className="p-8"><span className="px-5 py-1.5 bg-slate-100 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-500">{roles.find(r => r.value === s.role)?.label || s.role}</span></td>
                <td className="p-8 text-right font-mono font-black text-slate-900 leading-none">
                   <span className="text-[10px] text-slate-300 mr-2 uppercase tracking-widest">IDR</span>
                   {parseFloat(s.baseSalary || 0).toLocaleString()}
                </td>
                <td className="p-8 text-center"><span className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">{t('onDuty', '正式在职')}</span></td>
                <td className="p-8 text-right">
                    <button onClick={() => handleEdit(s)} className="w-12 h-12 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm mx-auto float-right text-xl">✏️</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="p-32 text-center text-slate-200 font-black uppercase tracking-widest italic">{t('noData', '暂无档案记录')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-soft">
          <div className="bg-white rounded-[48px] shadow-3xl w-full max-w-xl overflow-hidden border-8 border-white p-2">
            <div className="px-10 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-[40px] mb-4">
                <h3 className="text-xl font-black text-slate-900 uppercase">{editId ? t('editStaff', '编辑档案') : t('newStaffEntry', '新员工录入')}</h3>
              <button onClick={() => setShowForm(false)} className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm text-xl font-black">✕</button>
            </div>
            <div className="p-10">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('name', '姓名')}</label>
                     <input className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all placeholder:opacity-30" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Enter name" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phone', '电话')}</label>
                     <input className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="e.g. 0812..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('role', '岗位')}</label>
                      <select className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all appearance-none cursor-pointer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('baseSalary', '底薪')} (IDR)</label>
                      <input className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-orange-600 outline-none border-2 border-transparent focus:border-orange-500 transition-all" type="text" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: e.target.value })} required placeholder="e.g. 5000000" />
                   </div>
                </div>
                <button type="submit" className="w-full h-20 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all text-[15px]">{t('saveProfile', '确认物理保存档案')}</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

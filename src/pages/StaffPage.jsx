import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

// 按模块分组的权限配置 [groupKey, icon, [[labelKey, viewKey, editKey/null]]]
const PERMISSION_GROUPS = [
  { group: 'perm.cashier', icon: '🖥️', permissions: [
      ['perm.cashierLogin', 'pos_sales', null],
  ]},
  { group: 'perm.inventory', icon: '📦', permissions: [
      ['perm.view', 'inventory_view', 'inventory_edit'],
  ]},
  { group: 'perm.product', icon: '🧋', permissions: [
      ['perm.view', 'products_view', 'products_edit'],
      ['perm.shelve', 'products_shelve', null],
  ]},
  { group: 'perm.profit', icon: '💰', permissions: [
      ['perm.view', 'profit_view', null],
      ['perm.export', 'profit_export', null],
  ]},
  { group: 'perm.attendance', icon: '📅', permissions: [
      ['perm.view', 'attendance_view', 'attendance_edit'],
      ['perm.scheduleEdit', 'schedule_edit', null],
  ]},
  { group: 'perm.payroll', icon: '💳', permissions: [
      ['perm.view', 'salary_view', null],
      ['perm.rewardRecord', 'reward_edit', null],
  ]},
  { group: 'perm.hygiene', icon: '🧹', permissions: [
      ['perm.view', 'hygiene_view', 'hygiene_record'],
      ['perm.executeCheck', 'hygiene_check', null],
  ]},
  { group: 'perm.training', icon: '📚', permissions: [
      ['perm.view', 'training_view', 'training_edit'],
  ]},
  { group: 'perm.marketing', icon: '🚀', permissions: [
      ['perm.view', 'marketing_view', 'marketing_edit'],
  ]},
  { group: 'perm.system', icon: '⚙️', permissions: [
      ['perm.view', 'system_view', null],
      ['perm.merchantConfig', 'system_config', null],
  ]},
];

// 新员工默认勾选的权限
const DEFAULT_PERMISSIONS = ['pos_sales', 'inventory_view', 'hygiene_check', 'hygiene_record'];

export default function StaffPage({ defaultTab, hideHeader }) {
  const { t } = useAuth();
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [resetPasswordId, setResetPasswordId] = useState(null);

  const [form, setForm] = useState({
    name: '', phone: '', role: 'barista', position: '', baseSalary: '',
    hireDate: new Date().toISOString().split('T')[0], status: 'active',
    permissions: [], salaryView: 'all'
  });

  const roles = [
    { value: 'manager', label: t('manager') },
    { value: 'barista', label: t('barista') },
    { value: 'cashier', label: t('cashier') },
    { value: 'crew', label: t('crew') },
    { value: 'admin', label: t('adminRole') },
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

  function generatePassword() {
    return Math.random().toString().slice(2, 8).padStart(6, '0');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanSalary = String(form.baseSalary).replace(/[^\d]/g, '');
    const password = !editId ? generatePassword() : undefined;
    const submitData = {
      ...form,
      baseSalary: parseFloat(cleanSalary) || 0,
      position: form.position || roles.find(r => r.value === (form.role || '').toLowerCase())?.label || form.role,
      ...(password ? { password } : {})
    };

    try {
      let res;
      if (editId) res = await api('PUT', `/staff/${editId}`, submitData);
      else res = await api('POST', '/staff', submitData);

      if (res && !res.error) {
        setShowForm(false);
        loadData();
        if (password) setTempPassword(password);
        showToast(editId ? t('saveSuccess') : t('staffCreated'));
      } else {
        showToast(res?.error?.startsWith('ERR_') ? t(res.error) : (res?.error || t('serverError')), 'error');
      }
    } catch (e) {
      showToast(t('networkError'), 'error');
    }
  }

  async function handleResetPassword(id) {
    const pwd = generatePassword();
    try {
      const res = await api('POST', `/staff/${id}/reset-password`, { password: pwd });
      if (res && !res.error) {
        showToast(t('passwordResetSuccess') + ` 新密码: ${pwd}`, 'success');
      } else {
        showToast(res?.error?.startsWith('ERR_') ? t(res.error) : (res?.error || t('serverError')), 'error');
      }
    } catch {
      showToast(t('networkError'), 'error');
    }
  }

  const handleEdit = (s) => {
    const perms = Array.isArray(s.permissions) ? s.permissions : (s.permissions ? JSON.parse(s.permissions || '[]') : []);
    setForm({
      name: s.name || '', phone: s.phone || '', role: s.role || 'barista',
      position: s.position || '', baseSalary: s.baseSalary || 0,
      hireDate: s.hireDate ? s.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
      status: s.status || 'active', permissions: perms, salaryView: s.salaryView || 'all',
    });
    setTempPassword('');
    setEditId(s.id);
    setShowForm(true);
    setShowPermissions(false);
  };

  function openAddForm() {
    setForm({ name: '', phone: '', role: 'barista', position: '', baseSalary: '', hireDate: new Date().toISOString().split('T')[0], status: 'active', permissions: [...DEFAULT_PERMISSIONS], salaryView: 'all' });
    setTempPassword('');
    setShowPermissions(false);
    setEditId(null);
    setShowForm(true);
  }

  function togglePerm(viewKey, editKey) {
    setForm(f => {
      let perms = [...f.permissions];
      // Toggle view permission
      if (viewKey) {
        perms = perms.includes(viewKey) ? perms.filter(p => p !== viewKey) : [...perms, viewKey];
      }
      // Toggle edit permission (requires view first)
      if (editKey) {
        if (perms.includes(editKey)) {
          perms = perms.filter(p => p !== editKey);
        } else {
          // If edit is checked but view is not, auto-add view
          if (!perms.includes(viewKey)) perms.push(viewKey);
          perms.push(editKey);
        }
      }
      return { ...f, permissions: perms };
    });
  }

  function isChecked(formPerms, viewKey, editKey) {
    if (editKey && formPerms.includes(editKey)) return 'edit';
    if (formPerms.includes(viewKey)) return 'view';
    return null;
  }

  return (
    <div className={`animate-soft space-y-4 pb-24 !max-w-7xl mx-auto ${hideHeader ? '!pt-0' : ''}`}>
      {toast && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[300] px-10 py-3 rounded-2xl shadow-3xl font-black text-[13px] border-4 border-white animate-soft ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
           {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-end px-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
             <span className="text-3xl">👤</span> {t('staffManagement')}
          </h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('staffManagementSubtitle')}</p>
        </div>
        <button onClick={openAddForm}
          className="h-14 bg-slate-900 text-white px-10 rounded-[20px] shadow-2xl text-[13px] font-black uppercase tracking-widest active:scale-95 transition-all">
          + {t('addNewStaff')}
        </button>
      </div>

      <div className="card-premium !p-0 bg-white border-slate-100 shadow-xl !rounded-[40px] overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('staffName')}</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('rolePosition')}</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{t('baseSalary')}</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{t('status')}</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{t('permissions')}</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {staff.length > 0 ? staff.map(s => {
              const perms = Array.isArray(s.permissions) ? s.permissions : (s.permissions ? JSON.parse(s.permissions || '[]') : []);
              return (
              <tr key={s.id} className="hover:bg-slate-50 transition-all group">
                <td className="p-4 font-black text-slate-900 text-[15px]">{s.name}</td>
                <td className="p-4"><span className="px-5 py-1.5 bg-slate-100 rounded-lg text-[11px] font-black tracking-widest text-slate-500">{roles.find(r => r.value === (s.role || '').toLowerCase())?.label || s.role}</span></td>
                <td className="p-4 text-right font-mono font-black text-slate-900 leading-none">
                   <span className="text-[10px] text-slate-300 mr-2 uppercase tracking-widest">{t('currencyIDR')}</span>
                   {parseFloat(s.baseSalary || 0).toLocaleString()}
                </td>
                <td className="p-4 text-center"><span className="px-5 py-3 bg-emerald-500 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">{t('onDuty')}</span></td>
                <td className="p-4 text-center">
                  <span className="text-[11px] text-slate-400">{perms.length || 0} {t('permissions') || '项权限'}</span>
                </td>
                <td className="p-4 text-right flex gap-2 justify-end">
                    <button onClick={() => handleResetPassword(s.id)} className="px-3 py-2 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all" title={t('resetPassword')}>🔑</button>
                    <button onClick={() => handleEdit(s)} className="w-12 h-12 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm text-xl">✏️</button>
                </td>
              </tr>);
            }) : (
              <tr><td colSpan="6" className="p-32 text-center text-slate-200 font-black uppercase tracking-widest italic">{t('noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-soft">
          <div className="bg-white rounded-[32px] shadow-3xl w-full max-w-2xl overflow-hidden border-4 border-white">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900 uppercase">{editId ? t('editStaff') : t('newStaffEntry')}</h3>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm text-lg font-black">✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('name')}</label>
                     <input className="w-full h-11 bg-slate-50 rounded-xl px-3 font-black text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all placeholder:opacity-30 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder={t('namePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phone')}</label>
                     <input className="w-full h-11 bg-slate-50 rounded-xl px-3 font-black text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder={t('phonePlaceholder')} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('role')}</label>
                      <select className="w-full h-11 bg-slate-50 rounded-xl px-3 font-black text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all appearance-none cursor-pointer text-sm" value={(form.role || '').toLowerCase()} onChange={e => setForm({ ...form, role: e.target.value })}>
                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('baseSalary')} ({t('currencyIDR')})</label>
                      <input className="w-full h-11 bg-slate-50 rounded-xl px-3 font-black text-orange-600 outline-none border-2 border-transparent focus:border-orange-500 transition-all text-sm" type="text" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: e.target.value })} required placeholder={t('salaryPlaceholder')} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('salaryViewRange')}</label>
                      <select className="w-full h-11 bg-slate-50 rounded-xl px-3 font-black text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all appearance-none cursor-pointer text-sm" value={form.salaryView} onChange={e => setForm({ ...form, salaryView: e.target.value })}>
                        <option value="all">{t('salaryViewAll')}</option>
                        <option value="own_only">{t('salaryViewOwnOnly')}</option>
                        <option value="none">{t('salaryViewNone')}</option>
                      </select>
                   </div>
                </div>

                {/* 权限设置 */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('permissionSettings') || '权限设置'}</label>
                    <button type="button" onClick={() => setShowPermissions(!showPermissions)}
                      className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200">
                      {showPermissions ? t('collapse') || '收起' : t('expand') || '展开'}
                    </button>
                  </div>
                  {showPermissions && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1 px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('permModule')}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('permView')}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('permEdit')}</span>
                      </div>
                      {PERMISSION_GROUPS.map(g => (
                        <div key={g.group}>
                          <div className="flex items-center gap-1 py-0.5">
                            <span className="text-xs">{g.icon}</span>
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide">{t(g.group)}</span>
                          </div>
                          {g.permissions.map(([label, viewKey, editKey]) => {
                            return (
                              <div key={viewKey} className="grid grid-cols-3 gap-1 items-center px-1 py-0.5 hover:bg-slate-50 rounded-lg transition-colors">
                                <span className="text-[11px] text-slate-500 font-medium pl-5">{t(label)}</span>
                                <div className="flex justify-center">
                                  <button type="button"
                                    onClick={() => togglePerm(viewKey, editKey)}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs transition-all ${
                                      form.permissions.includes(viewKey)
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-slate-200 text-slate-300 hover:border-emerald-300'
                                    }`}>
                                    {form.permissions.includes(viewKey) ? '✓' : ''}
                                  </button>
                                </div>
                                <div className="flex justify-center">
                                  {editKey ? (
                                    <button type="button"
                                      onClick={() => togglePerm(viewKey, editKey)}
                                      className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs transition-all ${
                                        form.permissions.includes(editKey)
                                          ? 'bg-orange-500 border-orange-500 text-white'
                                          : 'border-slate-200 text-slate-300 hover:border-orange-300'
                                      }`}>
                                      {form.permissions.includes(editKey) ? '✓' : ''}
                                    </button>
                                  ) : (
                                    <div className="w-6 h-6" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  {!showPermissions && (
                    <div className="text-[11px] text-slate-400">{form.permissions.length} {t('permissions') || '项权限已配置'}</div>
                  )}
                </div>

                <button type="submit" className="w-full h-12 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-[13px]">{t('saveProfile')}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 临时密码弹窗 */}
      {tempPassword && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-3xl shadow-3xl w-full max-w-sm p-8 text-center">
            <div className="text-5xl mb-4">🔑</div>
            <h3 className="text-xl font-black mb-2">{t('tempPasswordTitle') || '员工账号已创建'}</h3>
            <p className="text-slate-500 text-sm mb-6">{t('tempPasswordDesc') || '请将临时密码告知员工'}（员工登录时需要手机号+此密码）</p>
            <div className="bg-slate-50 rounded-2xl p-4 mb-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{t('phone')}</div>
              <div className="text-xl font-black text-slate-900">{form.phone}</div>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 mb-6">
              <div className="text-[10px] text-orange-400 uppercase tracking-widest mb-1">{t('tempPassword') || '临时密码'}</div>
              <div className="text-4xl font-black text-orange-600 tracking-widest">{tempPassword}</div>
            </div>
            <button onClick={() => setTempPassword('')} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest">{t('confirm') || '确认'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
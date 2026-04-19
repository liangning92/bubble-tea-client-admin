import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

const TABS = [
  { id: 'categories', labelKey: 'productCategory' },
  { id: 'functions', labelKey: 'quickActionsTab' },
  { id: 'payments', labelKey: 'paymentMethodsConfig' },
];

const DEFAULT_DATA = {
  categories: [
    { id: 'milk_tea', name: { zh: '奶茶', en: 'Milk Tea', id: 'Teh Susu' }, icon: '🧋', color: '#f97316', enabled: true, sortOrder: 1 },
    { id: 'juice', name: { zh: '果汁', en: 'Juice', id: 'Jus' }, icon: '🍹', color: '#22c55e', enabled: true, sortOrder: 2 },
    { id: 'coffee', name: { zh: '咖啡', en: 'Coffee', id: 'Kopi' }, icon: '☕', color: '#92400e', enabled: true, sortOrder: 3 },
    { id: 'smoothie', name: { zh: '冰沙', en: 'Smoothie', id: 'Smoothie' }, icon: '🧊', color: '#06b6d4', enabled: false, sortOrder: 4 },
  ],
  functions: [
    { id: 'hold', name: { zh: '挂单', en: 'Hold', id: 'Tunda' }, icon: '📋', enabled: true, sortOrder: 1 },
    { id: 'recall', name: { zh: '取单', en: 'Recall', id: 'Ambil' }, icon: '📜', enabled: true, sortOrder: 2 },
    { id: 'print', name: { zh: '小票', en: 'Print', id: 'Struk' }, icon: '🖨️', enabled: true, sortOrder: 3 },
    { id: 'report', name: { zh: '报表', en: 'Report', id: 'Laporan' }, icon: '📊', enabled: true, sortOrder: 4 },
    { id: 'clock', name: { zh: '考勤', en: 'Clock', id: 'Absen' }, icon: '🔔', enabled: true, sortOrder: 5 },
    { id: 'shift', name: { zh: '交接', en: 'Shift', id: 'Ganti Shift' }, icon: '🔄', enabled: true, sortOrder: 6 },
  ],
  payments: [
    { id: 'cash', name: { zh: '现金', en: 'Cash', id: 'Tunai' }, icon: '💵', enabled: true },
    { id: 'dana', name: { zh: 'DANA', en: 'DANA', id: 'DANA' }, icon: '📱', enabled: true },
    { id: 'ovo', name: { zh: 'OVO', en: 'OVO', id: 'OVO' }, icon: '💳', enabled: true },
    { id: 'gopay', name: { zh: 'GoPay', en: 'GoPay', id: 'GoPay' }, icon: '🟢', enabled: true },
    { id: 'bca', name: { zh: 'BCA', en: 'BCA', id: 'BCA' }, icon: '🏦', enabled: false },
    { id: 'mandiri', name: { zh: 'Mandiri', en: 'Mandiri', id: 'Mandiri' }, icon: '🏦', enabled: false },
    { id: 'wechat', name: { zh: '微信', en: 'WeChat', id: 'WeChat' }, icon: '💬', enabled: false },
    { id: 'alipay', name: { zh: '支付宝', en: 'Alipay', id: 'Alipay' }, icon: '💰', enabled: false },
    { id: 'qris', name: { zh: 'QRIS', en: 'QRIS', id: 'QRIS' }, icon: '📲', enabled: true },
  ],
};

const ICON_OPTIONS = ['🧋', '🍹', '☕', '🧊', '🍨', '🍵', '🧃', '🥤', '🍺', '🧇', '🍰', '🍩', '🍪', '🌸', '⭐', '💎'];
const COLOR_OPTIONS = ['#f97316', '#22c55e', '#92400e', '#06b6d4', '#8b5cf6', '#ec4899', '#ef4444', '#3b82f6', '#eab308', '#84cc16'];

export default function POSCategoriesPage() {
  const { t, lang } = useAuth();
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState(DEFAULT_DATA.categories);
  const [functions, setFunctions] = useState(DEFAULT_DATA.functions);
  const [payments, setPayments] = useState(DEFAULT_DATA.payments);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  // 将API返回的字符串名称转换为对象格式
  function normalizeName(name) {
    if (typeof name === 'string') return { zh: name, en: name, id: name };
    if (typeof name === 'object' && name !== null) return name;
    return { zh: '', en: '', id: '' };
  }

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await api('GET', '/pos/config');
      if (res?.config) {
        if (res.config.categories?.length) {
          setCategories(res.config.categories.map(c => ({
            ...c,
            name: normalizeName(c.name),
          })));
        }
        if (res.config.quickActions?.length) {
          setFunctions(res.config.quickActions.map(f => ({
            ...f,
            name: normalizeName(f.label || f.name),
          })));
        }
        if (res.config.paymentMethods?.length) {
          setPayments(res.config.paymentMethods.map(p => ({
            ...p,
            name: normalizeName(p.label || p.name),
          })));
        }
      }
    } catch (e) {
      console.error('Failed to load POS config:', e);
    }
    setLoading(false);
  }

  async function saveConfig() {
    setSaving(true);
    setSaveMsg('');
    try {
      // 将对象名称转换回字符串格式
      const catPayload = categories.map(c => ({ ...c, name: c.name?.zh || c.name || '' }));
      const fnPayload = functions.map(f => ({ ...f, label: f.name?.zh || f.name || '', name: undefined }));
      const pmPayload = payments.map(p => ({ ...p, label: p.name?.zh || p.name || '', name: undefined }));

      const res = await api('POST', '/api/pos/config', {
        categories: catPayload,
        quickActions: fnPayload,
        paymentMethods: pmPayload,
      });
      if (res?.success) {
        setSaveMsg('✅ 保存成功');
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setSaveMsg('❌ 保存失败');
      }
    } catch (e) {
      setSaveMsg('❌ 保存失败: ' + (e.message || '未知错误'));
    }
    setSaving(false);
  }

  // --- Category helpers ---
  function moveCategory(index, direction) {
    const arr = [...categories];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    arr.forEach((item, i) => (item.sortOrder = i + 1));
    setCategories(arr);
  }

  function openCategoryModal(item = null) {
    setEditingItem(item ? { ...item, name: { ...item.name } } : {
      id: 'cat_' + Date.now(),
      name: { zh: '', en: '', id: '' },
      icon: '🧋',
      color: '#f97316',
      enabled: true,
      sortOrder: categories.length + 1,
    });
    setShowModal(true);
  }

  function saveCategory() {
    if (!editingItem.name.zh.trim()) {
      alert('请输入中文名称');
      return;
    }
    const existing = categories.findIndex(c => c.id === editingItem.id);
    if (existing >= 0) {
      const arr = [...categories];
      arr[existing] = editingItem;
      setCategories(arr);
    } else {
      setCategories([...categories, editingItem]);
    }
    setShowModal(false);
  }

  function deleteCategory(id) {
    if (!confirm('确定要删除该分类吗？')) return;
    setCategories(categories.filter(c => c.id !== id));
  }

  // --- Function helpers ---
  function moveFunction(index, direction) {
    const arr = [...functions];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    arr.forEach((item, i) => (item.sortOrder = i + 1));
    setFunctions(arr);
  }

  function toggleFunction(id) {
    setFunctions(functions.map(f =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  }

  // --- Payment helpers ---
  function togglePayment(id) {
    setPayments(payments.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">📱 {t('posCategoriesTitle')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('categoryConfigDesc')}</p>
        </div>
        <div className="flex items-center gap-4">
          {saveMsg && <span className="text-sm font-bold">{saveMsg}</span>}
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-500 transition-all disabled:opacity-50"
          >
            {saving ? t('saving') : `💾 ${t('saveConfig')}`}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-2 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'categories' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🧋 {t('productCategory')}
        </button>
        <button
          onClick={() => setActiveTab('functions')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'functions' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🔘 {t('quickActionsTab')}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'payments' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          💳 {t('paymentMethodsConfig')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
        {/* === Tab 1: Categories === */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{t('categoryConfig')}</h3>
                <p className="text-sm text-slate-500">{t('categoryConfigDesc')}</p>
              </div>
              <button
                onClick={() => openCategoryModal()}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-500 transition-all text-sm"
              >
                + {t('addButton')}
              </button>
            </div>

            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm font-bold text-slate-500 border-b border-slate-100">
                  <th className="pb-3 w-24">{t('sortOrder')}</th>
                  <th className="pb-3 w-16">{t('icon')}</th>
                  <th className="pb-3">{t('nameZh')}</th>
                  <th className="pb-3">EN</th>
                  <th className="pb-3">ID</th>
                  <th className="pb-3 w-20">{t('color')}</th>
                  <th className="pb-3 w-20">{t('enabled')}</th>
                  <th className="pb-3 w-24">{t('operation')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.sort((a, b) => a.sortOrder - b.sortOrder).map((cat, index) => (
                  <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveCategory(index, -1)}
                          disabled={index === 0}
                          className="w-7 h-7 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveCategory(index, 1)}
                          disabled={index === categories.length - 1}
                          className="w-7 h-7 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-2xl">{cat.icon}</td>
                    <td className="py-3 font-bold text-slate-900">{cat.name.zh}</td>
                    <td className="py-3 text-slate-600">{cat.name.en}</td>
                    <td className="py-3 text-slate-600">{cat.name.id}</td>
                    <td className="py-3">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: cat.color }} />
                    </td>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={cat.enabled}
                        onChange={() => {
                          const arr = [...categories];
                          arr[index] = { ...arr[index], enabled: !arr[index].enabled };
                          setCategories(arr);
                        }}
                        className="w-5 h-5 accent-orange-600"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCategoryModal(cat)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === Tab 2: Functions === */}
        {activeTab === 'functions' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-black text-slate-900">{t('quickActionsConfig')}</h3>
              <p className="text-sm text-slate-500">{t('quickActionsConfigDesc')}</p>
            </div>

            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm font-bold text-slate-500 border-b border-slate-100">
                  <th className="pb-3 w-24">{t('sortOrder')}</th>
                  <th className="pb-3 w-16">{t('icon')}</th>
                  <th className="pb-3">{t('nameZh')}</th>
                  <th className="pb-3">EN</th>
                  <th className="pb-3">ID</th>
                  <th className="pb-3 w-20">{t('enabled')}</th>
                </tr>
              </thead>
              <tbody>
                {functions.sort((a, b) => a.sortOrder - b.sortOrder).map((fn, index) => (
                  <tr key={fn.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveFunction(index, -1)}
                          disabled={index === 0}
                          className="w-7 h-7 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveFunction(index, 1)}
                          disabled={index === functions.length - 1}
                          className="w-7 h-7 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-2xl">{fn.icon}</td>
                    <td className="py-3 font-bold text-slate-900">{fn.name.zh}</td>
                    <td className="py-3 text-slate-600">{fn.name.en}</td>
                    <td className="py-3 text-slate-600">{fn.name.id}</td>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={fn.enabled}
                        onChange={() => toggleFunction(fn.id)}
                        className="w-5 h-5 accent-orange-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === Tab 3: Payments === */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-black text-slate-900">{t('paymentMethodsConfig')}</h3>
              <p className="text-sm text-slate-500">{t('paymentMethodsConfigDesc')}</p>
            </div>

            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm font-bold text-slate-500 border-b border-slate-100">
                  <th className="pb-3 w-16">{t('icon')}</th>
                  <th className="pb-3">{t('nameZh')}</th>
                  <th className="pb-3">EN</th>
                  <th className="pb-3">ID</th>
                  <th className="pb-3 w-20">{t('enabled')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 text-2xl">{payment.icon}</td>
                    <td className="py-3 font-bold text-slate-900">{payment.name.zh}</td>
                    <td className="py-3 text-slate-600">{payment.name.en}</td>
                    <td className="py-3 text-slate-600">{payment.name.id}</td>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={payment.enabled}
                        onChange={() => togglePayment(payment.id)}
                        className="w-5 h-5 accent-orange-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Edit Modal */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-6">
              {categories.find(c => c.id === editingItem.id) ? t('edit') : t('addButton')}
            </h3>

            <div className="space-y-4">
              {/* Icon Picker */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('icon')}</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setEditingItem({ ...editingItem, icon })}
                      className={`w-10 h-10 text-xl rounded-xl transition-all ${
                        editingItem.icon === icon ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Fields */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">中文名称 *</label>
                <input
                  type="text"
                  value={editingItem.name.zh}
                  onChange={e => setEditingItem({ ...editingItem, name: { ...editingItem.name, zh: e.target.value } })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                  placeholder="例如：奶茶"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">English Name</label>
                <input
                  type="text"
                  value={editingItem.name.en}
                  onChange={e => setEditingItem({ ...editingItem, name: { ...editingItem.name, en: e.target.value } })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                  placeholder="例如：Milk Tea"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama (Bahasa Indonesia)</label>
                <input
                  type="text"
                  value={editingItem.name.id}
                  onChange={e => setEditingItem({ ...editingItem, name: { ...editingItem.name, id: e.target.value } })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 focus:outline-none"
                  placeholder="例如：Teh Susu"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">颜色</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditingItem({ ...editingItem, color })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        editingItem.color === color ? 'ring-2 ring-offset-2 ring-slate-900' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Enabled Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingItem.enabled}
                  onChange={e => setEditingItem({ ...editingItem, enabled: e.target.checked })}
                  className="w-5 h-5 accent-orange-600"
                />
                <span className="font-bold text-slate-700">启用该分类</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={saveCategory}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-500 transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

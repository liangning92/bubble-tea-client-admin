import React, { useState, useEffect, useRef } from 'react';
import { useAuth, api } from '../context/AuthContext';

// 采购明细页面
// 功能：采购明细、自动生成采购清单、安全库存设置、目标使用周期设置
export default function PurchaseDetailPage() {
  const { t, lang } = useAuth();
  const tl = (zh, en, id) => lang === 'zh' ? zh : lang === 'en' ? en : id;

  // ========== 状态 ==========
  const [activeTab, setActiveTab] = useState('purchase-list'); // purchase-list | auto-generate | settings
  const [inventory, setInventory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 安全库存/目标周期设置
  const [editingItem, setEditingItem] = useState(null);
  const [editSafeStock, setEditSafeStock] = useState(0);
  const [editTargetDays, setEditTargetDays] = useState(7);
  const [showEditModal, setShowEditModal] = useState(false);

  // 采购明细筛选
  const [filterInvName, setFilterInvName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // 生成采购清单
  const [targetDays, setTargetDays] = useState(7); // 默认目标使用周期
  const [autoSuggestions, setAutoSuggestions] = useState([]);
  const [generating, setGenerating] = useState(false);

  // 分页
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // 下拉ref
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // ========== 加载数据 ==========
  const loadInventory = async () => {
    const data = await api('GET', '/inventory');
    if (Array.isArray(data)) {
      setInventory(data?.items || data);
    } else if (data && Array.isArray(data.items)) {
      setInventory(data.items);
    } else {
      setInventory([]);
    }
  };

  const loadPurchaseHistory = async () => {
    const params = new URLSearchParams();
    if (filterInvName) params.append('name', filterInvName);
    if (filterStartDate) params.append('startDate', filterStartDate);
    if (filterEndDate) params.append('endDate', filterEndDate);
    const url = `/purchases${params.toString() ? '?' + params.toString() : ''}`;
    const data = await api('GET', url);
    setPurchaseHistory(Array.isArray(data) ? data : (data?.data || []));
  };

  const loadPurchaseOrders = async () => {
    const data = await api('GET', '/purchase-orders');
    setPurchaseOrders(Array.isArray(data) ? data : (data?.data || []));
  };

  const loadSuggestions = async () => {
    const data = await api('GET', '/alerts/order-suggestions');
    setSuggestions(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadInventory();
    loadPurchaseHistory();
    loadPurchaseOrders();
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (activeTab === 'purchase-list') loadPurchaseHistory();
    if (activeTab === 'auto-generate') loadInventory();
  }, [filterInvName, filterStatus, filterStartDate, filterEndDate]);

  // 外部点击关闭下拉
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ========== 格式化 ==========
  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return `${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const fmtFull = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
  };

  // ========== 计算日均用量 ==========
  // 根据历史销售数据估算日均用量（简化：默认每原料每日基础消耗量）
  // 实际由后端计算，前端只展示
  const getDailyUsage = (item) => {
    // 安全库存天数和目标使用周期决定建议采购量
    // 公式：建议采购 = 日均用量 × 目标周期 - 当前库存 - 已购未到
    const safeDays = item.safeStockDays || 7;
    const targetCycle = item.targetUsageCycle || 7;
    const dailyUsage = item.stock / Math.max(safeDays, 1);
    return dailyUsage;
  };

  // ========== 自动生成采购清单 ==========
  const handleGenerateList = async () => {
    setGenerating(true);
    try {
      // 获取15天的销售数据来估算日均用量
      const data = await api('GET', `/purchase/suggest?days=${targetDays}`);
      setAutoSuggestions(data?.items || []);
    } catch (err) {
      // 如果API不存在，用本地计算
      const items = inventory.map(inv => {
        const orderedQty = purchaseOrders
          .filter(o => o.inventoryId === inv.id && o.status === 'pending')
          .reduce((sum, o) => sum + o.quantity, 0);
        const safeDays = inv.safeStockDays || 7;
        const targetCycle = inv.targetUsageCycle || targetDays;
        const currentStock = inv.stock || 0;
        // 日均估算：简化处理，用安全库存天数反推
        const estimatedDailyUsage = currentStock / Math.max(safeDays, 1);
        const neededStock = estimatedDailyUsage * targetCycle;
        const suggestedOrder = Math.max(0, neededStock - currentStock - orderedQty);
        return {
          ...inv,
          orderedQty,
          estimatedDailyUsage,
          suggestedOrder,
          unit: inv.unit || 'g',
        };
      });
      // 只显示需要采购的
      setAutoSuggestions(items.filter(i => i.suggestedOrder > 0));
    }
    setGenerating(false);
  };

  // ========== 一键创建采购订单 ==========
  const handleCreateOrders = async () => {
    let failed = 0;
    for (const item of autoSuggestions) {
      if (item.suggestedOrder > 0) {
        const r = await api('POST', '/purchase-orders', {
          inventoryId: item.id,
          quantity: item.suggestedOrder,
        });
        if (r?.error) failed++;
      }
    }
    if (failed === 0) {
      window.dispatchEvent(new CustomEvent('app:success', { detail: tl('采购清单已生成', 'Purchase list created', 'Daftar pembelian dibuat') }));
    } else {
      window.dispatchEvent(new CustomEvent('app:error', { detail: `${failed} orders failed` }));
    }
    loadPurchaseOrders();
    loadSuggestions();
    setAutoSuggestions([]);
  };

  // ========== 复制采购清单 ==========
  const handleCopyList = () => {
    const lines = autoSuggestions.map(s =>
      `${s.name} x ${s.suggestedOrder}${s.unit}`
    );
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert(tl('已复制到剪贴板', 'Copied to clipboard', 'Disalin ke clipboard'));
    });
  };

  // ========== 下载采购清单CSV ==========
  const handleDownloadCsv = () => {
    const headers = [tl('原料名', 'Ingredient', 'Bahan'), tl('当前库存', 'Current Stock', 'Stok Saat Ini'), tl('已购未到', 'On Order', 'Dipesan'), tl('日均估算', 'Est. Daily', 'Per Hari'), tl('目标周期', 'Target Days', 'Hari Target'), tl('建议采购', 'Suggested', 'Saran'), tl('单位', 'Unit', 'Satuan')];
    const rows = autoSuggestions.map(s => [
      s.name, s.stock, s.orderedQty, s.estimatedDailyUsage?.toFixed(2), s.targetUsageCycle || targetDays,
      s.suggestedOrder, s.unit
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `采购清单_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== 保存安全库存/目标周期设置 ==========
  const handleSaveSettings = async (item) => {
    try {
      await api('PATCH', `/inventory/${item.id}/settings`, {
        safeStockDays: parseInt(editSafeStock) || 7,
        targetUsageCycle: parseInt(editTargetDays) || 7,
      });
      setShowEditModal(false);
      setEditingItem(null);
      loadInventory();
      alert(tl('设置已保存', 'Settings saved', 'Pengaturan disimpan'));
    } catch (err) {
      alert(err.message || tl('保存失败', 'Save failed', 'Gagal menyimpan'));
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditSafeStock(item.safeStockDays || 7);
    setEditTargetDays(item.targetUsageCycle || 7);
    setShowEditModal(true);
  };

  // ========== 确认入库（采购订单→入库）==========
  const handleReceive = async (orderId) => {
    if (!confirm(tl('确认入库？', 'Confirm stock in?', 'Konfirmasi masuk?'))) return;
    const r = await api('POST', `/purchases/${orderId}/receive`);
    if (r?.error) return;
    loadPurchaseOrders();
    loadInventory();
    window.dispatchEvent(new CustomEvent('app:success', { detail: tl('入库成功', 'Stock in successful', 'Berhasil masuk') }));
  };

  // ========== 删除采购订单 ==========
  const handleDeleteOrder = async (orderId) => {
    if (!confirm(tl('确认删除？', 'Confirm delete?', 'Konfirmasi hapus?'))) return;
    const r = await api('DELETE', `/purchases/${orderId}`);
    if (r?.error) return;
    loadPurchaseOrders();
  };

  // ========== 采购明细列表（过滤后）==========
  const filteredHistory = purchaseHistory.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterInvName) {
      const name = (r.inventory?.name || '').toLowerCase();
      if (!name.includes(filterInvName.toLowerCase())) return false;
    }
    return true;
  });

  const paginatedHistory = filteredHistory.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredHistory.length / pageSize);

  // ========== Tabs ==========
  const tabs = [
    { key: 'purchase-list', zh: '📋 采购明细', en: '📋 Purchase Details', id: '📋 Rincian Pembelian' },
    { key: 'auto-generate', zh: '⚡ 自动生成采购', en: '⚡ Auto Generate', id: '⚡ Generate Otomatis' },
    { key: 'settings', zh: '⚙️ 库存设置', en: '⚙️ Stock Settings', id: '⚙️ Pengaturan Stok' },
  ];

  return (
    <div className="space-y-5 animate-soft text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{tl('库存采购运营明细', 'Purchase Operations', 'Rincian Pembelian')}</h2>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 ">{t('procurementHubTitle')}</p>
        </div>
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`whitespace-nowrap px-4 py-3 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all ${activeTab === tab.key ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}>
              {tl(tab.zh, tab.en, tab.id)}
            </button>
          ))}
        </div>
      </div>

      {/* ========== Tab1: 采购明细 ========== */}
      {activeTab === 'purchase-list' && (
        <>
          {/* 筛选区 */}
          <div className="card-premium border-slate-200 bg-white mb-8">
            <h3 className="text-[14px] font-black mb-6 text-slate-800 uppercase tracking-widest">{tl('采购流水筛选', 'Filter Audit', 'Filter')}</h3>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  className="input-premium w-full"
                  placeholder={tl('搜索原料名称', 'Search ingredient', 'Cari bahan')}
                  value={filterInvName}
                  onChange={e => setFilterInvName(e.target.value)}
                />
                <select
                  className="input-premium w-full text-[14px]"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">{tl('全部', 'All', 'Semua')}</option>
                  <option value="pending">{tl('待入库', 'Pending', 'Menunggu')}</option>
                  <option value="received">{tl('已入库', 'Received', 'Diterima')}</option>
                </select>
              </div>
                <div className="flex gap-3">
                  <input type="date" className="input-premium flex-1 text-[14px]" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                  <input type="date" className="input-premium flex-1 text-[14px]" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                  <button onClick={() => { setFilterInvName(''); setFilterStatus('all'); setFilterStartDate(''); setFilterEndDate(''); }} className="btn-action bg-slate-100 text-slate-400 border border-slate-200">
                    {tl('重置', 'Reset', 'Clear')}
                  </button>
                  <button onClick={loadPurchaseHistory} className="btn-action btn-primary-dark">
                    🔍 {tl('查询', 'Search', 'Cari')}
                  </button>
                </div>
              </div>
            </div>

          {/* 采购订单快速操作栏 */}
          <div className="card-premium border-amber-200 bg-amber-50/30 mb-8 border-l-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-black text-amber-800 uppercase tracking-widest">{tl('📝 待入库核销任务', '📝 Pending Inbound', '📝 Pesanan Menunggu')}</h3>
              <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[14px] font-black">{purchaseOrders.filter(o => o.status === 'pending').length}</span>
            </div>
            {purchaseOrders.filter(o => o.status === 'pending').length === 0 ? (
              <p className="text-gray-400 text-[14px]">{tl('暂无待入库订单', 'No pending orders', 'Tidak ada pesanan')}</p>
            ) : (
              <div className="space-y-4">
                {purchaseOrders.filter(o => o.status === 'pending').slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{order.inventory?.name || '-'}</div>
                      <div className="text-[14px] text-gray-500">
                        {order.quantity} {order.inventory?.unit || 'g'} · {fmtFull(order.createdAt)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReceive(order.id)} className="px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-[14px] font-black uppercase tracking-widest hover:shadow-lg transition-all">
                        📥 {tl('核销入库', 'Receive', 'Masuk')}
                      </button>
                      <button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 bg-white text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-50 transition-all">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 采购明细列表 */}
          <div className="card-premium !p-0 overflow-hidden border-slate-200 bg-white shadow-xl">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">
                {tl('采购全景流水明细', 'Purchase History', 'Riwayat Pembelian')} ({filteredHistory.length})
              </h3>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">🎉 {tl('暂无记录', 'No records', 'Tidak ada catatan')}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('核销日期', 'Date', 'Tgl')}</th>
                        <th className="p-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('原料品项', 'Ingredient', 'Bahan')}</th>
                        <th className="p-4 text-right text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('入库量', 'Qty', 'Jml')}</th>
                        <th className="p-4 text-right text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('当前单价', 'Price', 'Harga')}</th>
                        <th className="p-4 text-right text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('资金流转合计', 'Total', 'Total')}</th>
                        <th className="p-4 text-center text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('交付状态', 'Status', 'Status')}</th>
                        <th className="p-4 text-center text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('操作管理', 'Action', 'Aksi')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map(record => (
                        <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 text-gray-500">{fmtFull(record.receivedAt || record.createdAt)}</td>
                          <td className="py-3 font-medium">{record.inventory?.name || '-'}</td>
                          <td className="py-3 text-right">{record.quantity} {record.unit || ''}</td>
                          <td className="py-3 text-right text-gray-500">
                            {record.unitPrice > 0 ? `Rp${record.unitPrice.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 text-right font-medium text-blue-600">
                            Rp{(record.totalPrice || 0).toLocaleString()}
                          </td>
                          <td className="py-3 text-center">
                            {record.status === 'received' ? (
                              <span className="badge badge-success text-[14px]">{tl('已入库', 'Received', 'Diterima')}</span>
                            ) : (
                              <span className="badge bg-yellow-100 text-yellow-800 text-[14px]">{tl('待入库', 'Pending', 'Menunggu')}</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {record.status === 'pending' && (
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleReceive(record.id)} className="btn btn-xs btn-success">{tl('入库', 'In', 'M')}</button>
                                <button onClick={() => { if(confirm(tl('确认删除？','Confirm delete?','Konfirmasi?'))) api('DELETE', `/purchases/${record.id}`).then(loadPurchaseHistory); }} className="btn btn-xs btn-danger">🗑️</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-sm btn-secondary">
                      ← {tl('上一页', 'Prev', 'Sebelumnya')}
                    </button>
                    <span className="text-sm text-gray-500">
                      {page} / {totalPages}
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-sm btn-secondary">
                      {tl('下一页', 'Next', 'Selanjutnya')} →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ========== Tab2: 自动生成采购清单 ========== */}
      {activeTab === 'auto-generate' && (
        <div className="space-y-4 animate-soft">
          <div className="card-premium border-slate-200 bg-white shadow-lg p-8">
            <h3 className="text-[14px] font-black mb-6 text-slate-800 uppercase tracking-widest">{tl('⚡ 智能补货策略引擎', '⚡ AI Restock Engine', '⚡ Generate Daftar Pembelian Otomatis')}</h3>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest">
                  {tl('目标补货周期 (天):', 'Target Cycle (Days):', 'Periode Penggunaan Target:')}
                </label>
                <div className="flex gap-2 flex-1 w-full">
                  <select
                    className="input-premium flex-1 text-[14px]"
                    value={targetDays}
                    onChange={e => setTargetDays(parseInt(e.target.value))}
                  >
                    <option value={3}>{tl('3天 (极速流转)', '3 Days', '3 Hari')}</option>
                    <option value={7}>{tl('7天 (标准周转)', '7 Days', '7 Hari')}</option>
                    <option value={14}>{tl('14天 (大批量采购)', '14 Days', '14 Hari')}</option>
                    <option value={30}>{tl('30天 (战略囤货)', '30 Days', '30 Hari')}</option>
                  </select>
                  <button onClick={handleGenerateList} disabled={generating} className="btn-action btn-primary-dark !px-10">
                    {generating ? tl('计算中...', 'Calculating...', 'Menghitung...') : `⚡ ${tl('生成建议清单', 'Generate List', 'Generate')}`}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[14px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                  {tl('计算逻辑: 建议采购量 = (日均估算用量 × 目标周期) - 当前库存 - 已购未到库存', 'Formula: Suggested = (Avg Daily × Target) - Current - On-Order', 'Rumus: Saran = Rata2 Penggunaan Harian × Periode Target - Stok Saat Ini - Stok Dipesan')}
                </p>
              </div>

              {autoSuggestions.length > 0 && (
                <div className="flex gap-4 mt-2">
                  <button onClick={handleCopyList} className="flex-1 btn-action bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
                    📋 {tl('复制清单', 'Copy All', 'Salin')}
                  </button>
                  <button onClick={handleDownloadCsv} className="flex-1 btn-action bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
                    📥 {tl('下载 CSV', 'Download CSV', 'Download CSV')}
                  </button>
                  <button onClick={handleCreateOrders} className="flex-1 btn-action btn-primary-dark">
                    ✅ {tl('批量转为采购单', 'Create Orders', 'Buat Pesanan')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 订货建议（来自API） */}
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">{tl('📦 订货建议', '📦 Order Suggestions', '📦 Saran Pemesanan')}</h3>
              <button onClick={loadSuggestions} className="btn btn-secondary btn-xs">
                🔄 {tl('刷新', 'Refresh', 'Refresh')}
              </button>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-3">
                🎉 {tl('库存充足，暂无建议', 'Stock sufficient, no suggestions', 'Stok cukup, tidak ada saran')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-3">{tl('原料', 'Ingredient', 'Bahan')}</th>
                      <th className="py-3 text-right">{tl('当前', 'Current', 'Saat Ini')}</th>
                      <th className="py-3 text-right">{tl('已购', 'On Order', 'Dipesan')}</th>
                      <th className="py-3 text-right">{tl('安全库存', 'Safe Stock', 'Aman')}</th>
                      <th className="py-3 text-right">{tl('建议采购', 'Suggested', 'Saran')}</th>
                      <th className="py-3 text-center">{tl('状态', 'Status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((item, i) => (
                      <tr key={i} className={`border-b ${item.status === 'suggest_order' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                        <td className="py-3 font-medium">{item.inventoryName}</td>
                        <td className="py-3 text-right">{item.currentStock}{item.unit}</td>
                        <td className="py-3 text-right text-blue-600">{item.orderedStock}{item.unit}</td>
                        <td className="py-3 text-right">{item.safeStock}{item.unit}</td>
                        <td className={`py-3 text-right font-bold ${item.suggestedOrder > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {item.suggestedOrder}{item.unit}
                        </td>
                        <td className="py-3 text-center">
                          {item.status === 'suggest_order' ? (
                            <button
                              onClick={async () => {
                                const inv = inventory.find(x => x.name.includes(item.inventoryName) || item.inventoryName.includes(x.name));
                                if (!inv) { window.dispatchEvent(new CustomEvent('app:error', { detail: tl('未找到匹配原料', 'Ingredient not found', 'Bahan tidak ditemukan') })); return; }
                                const r = await api('POST', '/purchase-orders', { inventoryId: inv.id, quantity: item.suggestedOrder });
                                if (r?.error) return;
                                loadSuggestions();
                                loadPurchaseOrders();
                                alert(tl('采购单已创建', 'Purchase order created', 'Pesanan dibuat'));
                              }}
                              className="btn btn-xs btn-primary"
                            >
                              📝 {tl('订购', 'Order', 'Pesan')}
                            </button>
                          ) : (
                            <span className="badge badge-success text-[14px]">{tl('充足', 'OK', 'Cukup')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 自动生成的采购清单表格 */}
          {autoSuggestions.length > 0 && (
            <div className="card-premium !p-0 overflow-hidden border-indigo-200 bg-white shadow-2xl">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">
                  ⚡ {tl('AI 推荐采购清单', 'AI Suggested List', 'Daftar Pembelian Otomatis')}
                  <span className="ml-3 px-4 py-0.5 bg-indigo-600 text-white rounded text-[14px]">{autoSuggestions.length} {t('suggestions')}</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white border-b border-slate-100">
                      <th className="p-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('原料名称', 'Ingredient', 'Bahan')}</th>
                      <th className="p-4 text-right text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('当前剩余', 'Current', 'Saat Ini')}</th>
                      <th className="p-4 text-right text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('在途库存', 'On Order', 'Dipesan')}</th>
                      <th className="p-4 text-right text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('日均估算', 'Est. Daily', 'Per Hari')}</th>
                      <th className="p-4 text-right text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('建议采购', 'Suggested', 'Saran')}</th>
                      <th className="p-4 text-center text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('核准', 'Action', 'Aksi')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {autoSuggestions.map((item, i) => (
                      <tr key={i} className={`hover:bg-slate-50 transition-colors ${item.suggestedOrder > 0 ? 'bg-rose-50/20' : 'bg-green-50/20'}`}>
                        <td className="p-4 font-black text-slate-900">{item.name}</td>
                        <td className="p-4 text-right font-bold text-slate-600">{item.stock}{item.unit}</td>
                        <td className="p-4 text-right text-indigo-500 font-bold">{item.orderedQty}{item.unit}</td>
                        <td className="p-4 text-right text-slate-400 text-[14px] font-bold">{item.estimatedDailyUsage?.toFixed(2)}{item.unit}/天</td>
                        <td className={`p-8 text-right font-black ${item.suggestedOrder > 0 ? 'text-rose-600 text-lg' : 'text-emerald-600'}`}>
                          {item.suggestedOrder > 0 ? `+ ${item.suggestedOrder.toFixed(0)}${item.unit}` : '充足'}
                        </td>
                        <td className="p-4 text-center">
                          {item.suggestedOrder > 0 && (
                            <button
                              onClick={async () => {
                                const r = await api('POST', '/purchase-orders', { inventoryId: item.id, quantity: item.suggestedOrder });
                                if (r?.error) return;
                                setAutoSuggestions(prev => prev.map((s, idx) => idx === i ? { ...s, orderedQty: s.orderedQty + s.suggestedOrder, suggestedOrder: 0 } : s));
                                loadPurchaseOrders();
                                window.dispatchEvent(new CustomEvent('app:success', { detail: tl('采购单已创建', 'Purchase order created', 'Pesanan dibuat') }));
                              }}
                              className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all mx-auto"
                            >
                              ✓
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {autoSuggestions.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-500 text-sm">
                {tl('点击"生成清单"开始计算建议采购量', 'Click "Generate List" to calculate suggested quantities', 'Klik "Generate" untuk menghitung jumlah yang disarankan')}
              </p>
              <p className="text-gray-400 text-[14px] mt-2">
                {tl('根据历史消耗数据自动计算各原料的建议采购量', 'Auto-calculate suggested quantities based on historical consumption', 'Hitung otomatis berdasarkan data konsumsi historis')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========== Tab3: 安全库存/目标周期设置 ========== */}
      {activeTab === 'settings' && (
        <div className="space-y-4 animate-soft">
          <div className="card-premium border-slate-200 bg-white shadow-sm p-8">
            <h3 className="text-[14px] font-black mb-4 text-slate-800 uppercase tracking-widest">{tl('💡 库存策略说明', '💡 Strategy Info', '💡 Info')}</h3>
            <div className="text-[14px] text-slate-400 font-bold space-y-4 uppercase tracking-widest">
              <p>• <strong>{tl('安全库存天数', 'Safe Stock Days', 'Hari Stok Aman')}</strong>: {tl('库存低于此天数用量时触发预警', 'Triggers alert when stock is below this many days of usage', 'Peringatan saat stok di bawah penggunaan')}</p>
              <p>• <strong>{tl('目标使用周期', 'Target Usage Period', 'Periode Penggunaan Target')}</strong>: {tl('自动生成采购清单的目标周期', 'Target period for auto-generated purchase list', 'Periode target')}</p>
            </div>
          </div>

          <div className="card-premium !p-0 overflow-hidden border-slate-200 bg-white">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">
                {tl('物料安全水位设置', 'Ingredient Safety Settings', 'Pengaturan Keamanan Bahan')}
              </h3>
              <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{inventory.length} {tl('项物料', 'items', 'bahan')}</span>
            </div>

            {inventory.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">{tl('暂无原料数据', 'No ingredients', 'Tidak ada bahan')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white border-b border-slate-100">
                      <th className="p-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('原料品项', 'Ingredient', 'Bahan')}</th>
                      <th className="p-4 text-right text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('当前结存', 'Current', 'Stok')}</th>
                      <th className="p-4 text-center text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('安全防御天数', 'Safe Days', 'Hari Aman')}</th>
                      <th className="p-4 text-center text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('补货目标周期', 'Target Cycle', 'Siklus Target')}</th>
                      <th className="p-4 text-center text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('健康度监测', 'Status', 'Status')}</th>
                      <th className="p-4 text-center text-[14px] font-black text-slate-400 uppercase tracking-widest">{tl('交互', 'Action', 'Aksi')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => {
                      const safeDays = item.safeStockDays || 7;
                      const targetDays2 = item.targetUsageCycle || 7;
                      const currentStock = item.stock || 0;
                      const estimatedDaily = currentStock / Math.max(safeDays, 1);
                      const daysLeft = estimatedDaily > 0 ? (currentStock / estimatedDaily).toFixed(1) : '∞';
                      const isLow = estimatedDaily > 0 && currentStock / estimatedDaily < safeDays;
                      return (
                        <tr key={item.id} className={`border-b border-gray-50 ${isLow ? 'bg-red-50' : ''}`}>
                          <td className="py-3 font-medium">{item.name}</td>
                          <td className={`py-3 text-right font-medium ${isLow ? 'text-red-600' : ''}`}>
                            {currentStock} <span className="text-gray-400">{item.unit}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-4 py-0.5 rounded ${isLow ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {safeDays} {tl('天', 'd', 'h')}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-4 py-0.5 rounded bg-green-100 text-green-700">
                              {targetDays2} {tl('天', 'd', 'h')}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            {isLow ? (
                              <span className="badge badge-danger text-[14px]">{tl('预警', 'Alert', 'Peringatan')}</span>
                            ) : (
                              <span className="badge badge-success text-[14px]">{tl('正常', 'OK', 'Normal')}</span>
                            )}
                            <div className="text-[14px] text-gray-400 mt-0.5">
                              {tl('剩余', 'Left', 'Tersisa')}: {daysLeft} {tl('天', 'd', 'h')}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="btn btn-xs btn-secondary"
                            >
                              ⚙️ {tl('设置', 'Set', 'Atur')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== 编辑弹窗 ========== */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) { setShowEditModal(false); setEditingItem(null); } }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-4 text-base">
              ⚙️ {tl('设置安全库存', 'Safety Stock Settings', 'Pengaturan Stok Aman')}
            </h3>
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">{editingItem.name}</div>
              <div className="text-[14px] text-gray-500">
                {tl('当前库存', 'Current Stock', 'Stok Saat Ini')}: {editingItem.stock} {editingItem.unit}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[14px] text-gray-500 mb-1 block">
                  {tl('安全库存天数', 'Safe Stock Days', 'Hari Stok Aman')} ({tl('低于此值预警', 'Alert when below', 'Peringatan bila di bawah')})
                </label>
                <input
                  className="input w-full"
                  type="number"
                  min="1"
                  max="365"
                  value={editSafeStock}
                  onChange={e => setEditSafeStock(parseInt(e.target.value) || 7)}
                />
                <p className="text-[14px] text-gray-400 mt-1">
                  {tl('建议值: 3-7天，频繁采购选小值', 'Recommended: 3-7 days, smaller for frequent orders', 'Saran: 3-7 hari, lebih kecil untuk pemesanan sering')}
                </p>
              </div>

              <div>
                <label className="text-[14px] text-gray-500 mb-1 block">
                  {tl('目标使用周期', 'Target Usage Period', 'Periode Penggunaan Target')} ({tl('自动采购的目标天数', 'Target days for auto purchase', 'Hari target untuk beli otomatis')})
                </label>
                <input
                  className="input w-full"
                  type="number"
                  min="1"
                  max="365"
                  value={editTargetDays}
                  onChange={e => setEditTargetDays(parseInt(e.target.value) || 7)}
                />
                <p className="text-[14px] text-gray-400 mt-1">
                  {tl('建议值: 7-14天，根据采购周期调整', 'Recommended: 7-14 days, adjust by purchase cycle', 'Saran: 7-14 hari, sesuaikan dengan siklus pembelian')}
                </p>
              </div>

              {/* 预览 */}
              <div className="bg-blue-50 rounded-lg p-3 text-[14px]">
                <div className="font-medium mb-1">{tl('预估效果', 'Preview', 'Pratinjau')}</div>
                <div className="text-gray-600 space-y-0.5">
                  <div>• {tl('日均估算', 'Est. Daily Usage', 'Perkiraan Harian')}: {(editingItem.stock / Math.max(editSafeStock, 1)).toFixed(2)} {editingItem.unit}/天</div>
                  <div>• {tl('安全库存', 'Safe Stock', 'Stok Aman')}: {(editingItem.stock / Math.max(editSafeStock, 1) * editSafeStock).toFixed(0)} {editingItem.unit}</div>
                  <div>• {tl('目标库存', 'Target Stock', 'Stok Target')}: {(editingItem.stock / Math.max(editSafeStock, 1) * editTargetDays).toFixed(0)} {editingItem.unit}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => handleSaveSettings(editingItem)} className="btn btn-primary flex-1">
                ✅ {tl('保存', 'Save', 'Simpan')}
              </button>
              <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} className="btn btn-secondary flex-1">
                {tl('取消', 'Cancel', 'Batal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

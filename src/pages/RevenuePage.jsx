// ============ 营收统计页面 P009 ============
import React, { useState, useEffect, useRef } from 'react';
import { parseFile, findColumnIndex } from '../utils/fileParser';
import { api } from '../context/AuthContext';

// ============ 销量导入弹窗 ============
function ImportModal({ products, onClose, onSuccess }) {
  const lang = localStorage.getItem('lang') || 'zh';
  const [mode, setMode] = useState('file'); // file | manual
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualRows, setManualRows] = useState([{ productName: '', quantity: 1 }]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const tl = (zh, en, id) => lang === 'zh' ? zh : lang === 'en' ? en : id;

  const addRow = () => setManualRows([...manualRows, { productName: '', quantity: 1 }]);
  const removeRow = (i) => setManualRows(manualRows.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => {
    const rows = [...manualRows];
    rows[i] = { ...rows[i], [field]: val };
    setManualRows(rows);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError(tl('未选择文件', 'No file selected', 'Tidak ada file'));
      return;
    }
    setImporting(true);
    setError('');
    try {
      const result = await parseFile(file);
      const { rows, error: parseErr } = result || {};
      if (parseErr) {
        setError(parseErr);
        setImporting(false);
        return;
      }
      if (!rows || rows.length < 2) {
        setError(tl('文件中没有找到有效数据行（需要表头+至少1行数据）', 'No valid data found (need header + 1 data row)', 'Tidak ada data valid (butuh judul + 1 baris)'));
        setImporting(false);
        return;
      }

      const header = rows[0];
      const productNameIdx = findColumnIndex(header, ['product', '产品', 'produk', 'name', '名称', 'nama']);
      const quantityIdx = findColumnIndex(header, ['quantity', 'qty', '数量', 'jumlah', '杯', 'cup', 'pcs']);
      const dateIdx = findColumnIndex(header, ['date', '日期', 'tanggal', 'sale_date', '时间']);
      const getVal = (row, idx) => idx >= 0 && idx < row.length ? String(row[idx] || '').trim() : '';

      let imported = 0;
      let failed = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row.some(c => c)) continue;

        const productName = productNameIdx >= 0 ? getVal(row, productNameIdx) : getVal(row, 0);
        const quantityStr = quantityIdx >= 0 ? getVal(row, quantityIdx) : getVal(row, 1);
        const saleDate = dateIdx >= 0 ? getVal(row, dateIdx) : '';
        if (!productName) continue;

        const quantity = parseInt(quantityStr) || 1;
        let parsedDate;
        if (saleDate) {
          const d = new Date(saleDate);
          if (!isNaN(d.getTime())) parsedDate = d.toISOString().split('T')[0];
        }

        // 预查找单价以同步营收
        const product = products.find(p => p.name === productName);
        const unitPrice = product ? product.sellingPrice : 0;

        const result = await api('POST', '/sales', { 
          productName, 
          quantity, 
          sale_date: parsedDate,
          unitPrice,
          totalPrice: unitPrice * quantity
        });
        if (result?.error) failed++;
        else imported++;
      }

      if (imported === 0 && failed === 0) {
        setError(tl('未能识别数据，请检查文件格式', 'Could not parse data. Check format.', 'Tidak dapat membaca data. Periksa format.'));
      } else {
        window.dispatchEvent(new CustomEvent('app:success', { detail: tl(`完成：成功 ${imported}，失败 ${failed}`, `Done: ${imported} ok, ${failed} failed`, `Selesai: ${imported} ok, ${failed} gagal`) }));
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      setError(tl('导入失败：' + err.message, 'Import failed: ' + err.message, 'Gagal impor: ' + err.message));
    } finally {
      setImporting(false);
    }
  };

  const handleManualSubmit = async () => {
    const validRows = (manualRows || []).filter(r => r.productName && r.quantity > 0);
    if (validRows.length === 0) {
      setError(tl('请至少填写一行有效数据', 'Please fill at least one valid row', 'Isi setidaknya satu baris valid'));
      return;
    }
    setImporting(true);
    setError('');
    let failed = 0;
    try {
      for (const row of validRows) {
        const product = products.find(p => p.name === row.productName);
        const unitPrice = product ? product.sellingPrice : 0;

        const r = await api('POST', '/sales', {
          productName: row.productName,
          quantity: parseInt(row.quantity) || 1,
          sale_date: manualDate,
          unitPrice,
          totalPrice: unitPrice * (parseInt(row.quantity) || 1)
        });
        if (r?.error) failed++;
      }
      window.dispatchEvent(new CustomEvent('app:success', { detail: tl(`录入完成`, `Done`, `Selesai`) }));
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(tl('录入失败', 'Failed', 'Gagal'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="card-premium w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-black text-xl text-slate-900 tracking-widest">{tl('📥 销量导入', '📥 IMPORT SALES', '📥 IMPOR')}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors">&times;</button>
        </div>

        {/* Mode switch */}
        <div className="flex bg-slate-50 p-1 mx-6 mt-6 rounded-2xl border border-slate-100">
          <button onClick={() => setMode('file')} className={`flex-1 py-3 text-[14px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'file' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>
            {tl('📁 文件导入', '📁 FILE IMPORT', '📁 FILE')}
          </button>
          <button onClick={() => setMode('manual')} className={`flex-1 py-3 text-[14px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>
            {tl('✏️ 手动输入', '✏️ MANUAL', '✏️ MANUAL')}
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto no-scrollbar space-y-4">
          {mode === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-indigo-500 transition-all cursor-pointer bg-slate-50/50" onClick={() => fileInputRef.current?.click()}>
                <div className="text-5xl mb-4">📤</div>
                <div className="text-[14px] font-black text-slate-900 mb-2 uppercase tracking-widest">{tl('点击上传 CSV/Excel', 'Click to upload CSV/Excel', 'Klik untuk upload')}</div>
                <div className="text-[14px] text-slate-500 uppercase">
                  {t('importFormatHint')}
                </div>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.txt" className="hidden" onChange={handleFile} disabled={importing} />
              </div>
              {importing && <div className="text-center text-indigo-600 font-black animate-pulse text-[14px] uppercase tracking-widest">Processing Engine...</div>}
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4">
              <div className="space-y-4">
                <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-2">{tl('销售日期', 'Sale Date', 'Tanggal')}</label>
                <input type="date" className="input-premium w-full !p-3" value={manualDate} onChange={e => setManualDate(e.target.value)} />
              </div>

              <div className="space-y-4">
                {(manualRows || []).map((row, i) => (
                  <div key={i} className="flex gap-2 items-center animate-soft">
                    <select
                      className="input-premium flex-1 !p-3 text-[14px]"
                      value={row.productName}
                      onChange={e => updateRow(i, 'productName', e.target.value)}
                    >
                      <option value="">{tl('选择产品', 'Product', 'Pilih')}</option>
                      {(products || []).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="input-premium w-24 !p-3 text-[14px]"
                      min="1"
                      value={row.quantity}
                      onChange={e => updateRow(i, 'quantity', e.target.value)}
                    />
                    {manualRows.length > 1 && (
                      <button onClick={() => removeRow(i)} className="text-rose-500 w-8 flex justify-center">✕</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addRow} className="text-[14px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 ml-2">
                + {tl('添加一行', 'Add Row', 'Tambah')}
              </button>

              {error && <div className="text-rose-500 text-[14px] font-bold text-center bg-rose-500/10 py-3 rounded-xl">{error}</div>}

              <button
                onClick={handleManualSubmit}
                disabled={importing}
                className="w-full bg-indigo-500 text-white font-black uppercase text-[14px] tracking-widest py-3 rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all"
              >
                {importing ? tl('提交中...', 'Submitting...', 'Mengirim...') : tl('确认录入', 'Confirm Entry', 'Konfirmasi')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RevenuePage() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'zh');
  const [t, setT] = useState({});
  const [timeTab, setTimeTab] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [products, setProducts] = useState([]);

  const i18n = {
    zh: { title: '💰 营收统计', totalRevenue: '营业额', orderCount: '订单数', avgOrderValue: '客单价', topProducts: '热销排行', currency: 'Rp' },
    en: { title: '💰 Revenue Analytics', totalRevenue: 'Gross', orderCount: 'Orders', avgOrderValue: 'Avg Basket', topProducts: 'Ranking', currency: 'Rp' }
  };

  useEffect(() => { setT(i18n[lang] || i18n.en); }, [lang]);

  function getDateRange(tab) {
    const now = new Date();
    const today = new Date(now.toISOString().split('T')[0]);
    let start, end;
    if (tab === 'today') { start = today; end = new Date(today.getTime() + 86400000 - 1); }
    else if (tab === 'yesterday') { start = new Date(today.getTime() - 86400000); end = new Date(today.getTime() - 1); }
    else if (tab === 'thisWeek') { const d = now.getDay(); start = new Date(today.getTime() - (d === 0 ? 6 : d - 1) * 86400000); end = new Date(start.getTime() + 7 * 86400000 - 1); }
    else if (tab === 'thisMonth') { start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); }
    else if (tab === 'custom' && customStart && customEnd) { start = new Date(customStart); end = new Date(new Date(customEnd).getTime() + 86400000 - 1); }
    else return null;
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0], start, end };
  }

  async function loadData() {
    const range = getDateRange(timeTab);
    if (!range) return;
    setLoading(true);
    try {
      const rawSales = await api('GET', `/sales?startDate=${range.startDate}&endDate=${range.endDate}`);
      // Ensure sales is always an array, handling both direct array response and standardized { data: [] } response
      const sales = Array.isArray(rawSales) ? rawSales : (rawSales?.data && Array.isArray(rawSales.data) ? rawSales.data : []);
      const productsRes = await api('GET', '/products');
      const prodList = Array.isArray(productsRes) ? productsRes : (productsRes?.data && Array.isArray(productsRes.data) ? productsRes.data : []);

      let totalRevenue = 0;
      const productSales = {};
      (sales || []).forEach(sale => {
        const product = prodList.find(p => p.name === sale.productName);
        const unitPrice = product ? product.sellingPrice : 0;
        const rev = unitPrice * sale.quantity;
        totalRevenue += rev;
        if (!productSales[sale.productName]) productSales[sale.productName] = { name: sale.productName, quantity: 0, revenue: 0 };
        productSales[sale.productName].quantity += sale.quantity;
        productSales[sale.productName].revenue += rev;
      });

      const topProducts = Object.values(productSales || {}).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
      setData({ 
        totalRevenue: totalRevenue || 0, 
        orderCount: (sales || []).length, 
        avgOrderValue: sales && sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0, 
        topProducts: topProducts || [], 
        periodLabel: `${range.startDate} ~ ${range.endDate}` 
      });
    } catch (err) { 
      console.error('RevenuePage loadData error:', err);
      setData(null);
} finally { setLoading(false); }
  }

  useEffect(() => {
    loadData();
    api('GET', '/products').then(res => setProducts(Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : [])));
  }, [timeTab, customStart, customEnd]);

  const formatCurrency = (num) => `Rp ${num.toLocaleString()}`;

  return (
    <div className="space-y-10 animate-soft">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.title}</h2>
        <button onClick={() => setShowImport(true)} className="btn-premium active !px-8 shadow-sm">
          📥 {t('import')}
        </button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit overflow-x-auto no-scrollbar">
        {['today', 'yesterday', 'thisWeek', 'thisMonth', 'custom'].map(k => (
          <button key={k} onClick={() => setTimeTab(k)} className={`px-4 py-3 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all ${timeTab === k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            {(k === 'today' ? t('today') : k === 'yesterday' ? t('yesterday') : k === 'thisWeek' ? t('thisWeek') : k === 'thisMonth' ? t('thisMonth') : t('custom'))}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[14px] font-black text-indigo-400 animate-pulse tracking-[0.3em]">{t('calculatingRevenue')}</div>
      ) : data ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-premium p-8 border-emerald-500/10">
              <p className="text-label-caps mb-4 uppercase tracking-widest">{t.totalRevenue}</p>
              <div className="text-3xl font-black text-emerald-400">{formatCurrency(data.totalRevenue)}</div>
            </div>
            <div className="card-premium p-8 border-indigo-500/10">
              <p className="text-label-caps mb-4 uppercase tracking-widest">{t.orderCount}</p>
              <div className="text-3xl font-black text-slate-900">{data.orderCount}</div>
            </div>
            <div className="card-premium p-8 border-purple-500/10">
              <p className="text-label-caps mb-4 uppercase tracking-widest">{t.avgOrderValue}</p>
              <div className="text-3xl font-black text-slate-900">{formatCurrency(data.avgOrderValue)}</div>
            </div>
          </div>

          <div className="card-premium !p-0 overflow-hidden border-slate-200 bg-white shadow-xl">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-label-caps">{t.topProducts}</h3>
            </div>
            <div className="p-8 space-y-4">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex gap-6 items-center group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[14px] ${i < 3 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-black text-slate-900 text-sm">{p.name}</div>
                    <div className="text-[14px] text-slate-500 font-bold mt-1 uppercase tracking-tight">{p.quantity} {t('cups')} · {formatCurrency(p.revenue)}</div>
                  </div>
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block border border-slate-200/50">
                    <div className="h-full bg-indigo-500" style={{ width: `${(p.quantity / (data.topProducts[0].quantity || 1)) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showImport && <ImportModal products={products} onClose={() => setShowImport(false)} onSuccess={() => loadData()} />}
    </div>
  );
}

export default RevenuePage;

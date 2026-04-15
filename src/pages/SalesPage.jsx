import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';
import { translateBusinessText } from '../utils/autoTranslate';
import { parseFile, findColumnIndex } from '../utils/fileParser';

export default function SalesPage() {
  const { t } = useAuth();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [importing, setImporting] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [parsedSales, setParsedSales] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    let url = '/sales';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const [productsData, salesData] = await Promise.all([
      api('GET', '/products'),
      api('GET', url)
    ]);
    setProducts(Array.isArray(productsData) ? productsData : (productsData?.data || []));
    setSales(Array.isArray(salesData) ? salesData : (salesData?.data || []));
  };

  useEffect(() => { loadData(); }, [startDate, endDate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const result = await api('POST', '/sales', { productName, quantity, sale_date: new Date().toISOString().split('T')[0] });
    if (result?.error) return;
    setQuantity(1);
    loadData();
    window.dispatchEvent(new CustomEvent('app:success', { detail: '销售已录入' }));
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    const result = await api('POST', '/sales/import', formData);
    setImporting(false);
    if (result?.error) return;
    loadData();
    window.dispatchEvent(new CustomEvent('app:success', { detail: t.importSuccess || 'Import successful' }));
  };

  const handleExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { rows, error } = await parseFile(file);
      if (error || rows.length < 2) {
        window.dispatchEvent(new CustomEvent('app:error', { detail: error || '文件无有效数据' }));
        return;
      }

      const header = rows[0];
      const productNameIdx = findColumnIndex(header, ['product', '产品', 'produk', 'name', '名称', 'nama']);
      const quantityIdx = findColumnIndex(header, ['quantity', 'qty', '数量', 'jumlah', 'cup', 'pcs']);
      const dateIdx = findColumnIndex(header, ['date', '日期', 'tanggal', 'sale_date', '时间']);
      const getVal = (row, idx) => idx >= 0 && idx < row.length ? String(row[idx] || '').trim() : '';

      const today = new Date().toISOString().split('T')[0];
      const allItems = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row.some(c => c)) continue;
        const productName = productNameIdx >= 0 ? getVal(row, productNameIdx) : getVal(row, 0);
        if (!productName) continue;
        const quantity = parseInt(quantityIdx >= 0 ? getVal(row, quantityIdx) : getVal(row, 1)) || 1;
        const saleDate = dateIdx >= 0 ? getVal(row, dateIdx) : today;
        allItems.push({ productName, quantity, sale_date: saleDate || today });
      }

      setParsedSales(allItems.filter(i => i.productName));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: '解析失败: ' + err.message }));
    }
  };

  const parseBatchText = () => {
    if (!batchText.trim()) { setParsedSales([]); return; }
    const lines = batchText.trim().split('\n');
    const today = new Date().toISOString().split('T')[0];
    const items = lines.map(line => {
      const parts = line.trim().split(/[\t\s,]+/).filter(p => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const qty = parseInt(parts[1]) || 1;
        let date = today;
        if (parts[2]) {
          const d = new Date(parts[2]);
          if (!isNaN(d.getTime())) date = d.toISOString().split('T')[0];
        }
        return { productName: name, quantity: qty, sale_date: date, _raw: line };
      }
      return null;
    }).filter(Boolean);
    setParsedSales(items);
  };

  const handleBatchImport = async () => {
    let failed = 0;
    for (const item of parsedSales) {
      // 预查找产品单价以实现财务同步
      const product = products.find(p => p.name === item.productName);
      const unitPrice = product ? product.sellingPrice : 0;
      
      const r = await api('POST', '/sales', {
        ...item,
        unitPrice,
        totalPrice: unitPrice * item.quantity
      });
      if (r?.error) failed++;
    }
    setShowBatch(false);
    setBatchText('');
    setParsedSales([]);
    loadData();
    if (failed === 0) {
      window.dispatchEvent(new CustomEvent('app:success', { detail: t.importSuccess || 'Import successful' }));
    } else {
      window.dispatchEvent(new CustomEvent('app:error', { detail: `${failed} items failed` }));
    }
  };

  return (
    <div className="page animate-soft space-y-4">
      <h1 className="text-xl font-bold mb-2">{t.salesTitle}</h1>

      <div className="card-premium mb-2 !p-5">
        <h3 className="font-bold mb-2">{t('quickSales')}</h3>
        <div className="flex gap-2 mb-2">
          <select className="input flex-1" value={productName} onChange={e => setProductName(e.target.value)}>
            <option value="">{t('selectProduct')}</option>
            {products.map(p => (
              <option key={p.id} value={p.name}>
                {translateBusinessText(p.name, 'zh')} ({t('currencySymbol')}{p.sellingPrice})
              </option>
            ))}
          </select>
          <input
            className="input w-32"
            type="number"
            min="1"
            placeholder={t('salesQuantity')}
            value={quantity}
            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
          />
          <button
            onClick={handleAdd}
            disabled={!productName}
            className="btn btn-primary px-6"
          >
            + {t('quickDeal')}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {products.slice(0, 6).map(p => (
             <button
               key={p.id}
               onClick={() => {
                 setProductName(p.name);
                 setQuantity(1);
               }}
               className={`btn btn-sm ${productName === p.name ? 'btn-primary' : 'btn-secondary'}`}
             >
               <BusinessDataTranslator text={p.name} />
             </button>
          ))}
        </div>
      </div>

      <div className="card-premium mb-2 !p-5">
        <h3 className="font-bold mb-2">{t('batchSalesImport')}</h3>

        <div className="mb-4">
          <p className="text-[14px] text-gray-500 mb-2">📁 {t('uploadExcel')} (.xlsx/csv)</p>
          <label className="btn btn-primary btn-block text-center cursor-pointer mb-2">
            📤 {t('selectFile')}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelFile} className="hidden" />
          </label>
        </div>

        <div className="text-center text-gray-400 my-2">— 或 —</div>

        <p className="text-[14px] text-gray-500 mb-2">{t.batchSalesTip}</p>
        <p className="text-[14px] text-gray-400 mb-2">{t.batchSalesFormat}</p>
        <textarea
          className="input mb-2"
          rows={4}
          placeholder={"珍珠奶茶 10\n红茶拿铁 5 2026-03-27\n绿茶 8"}
          value={batchText}
          onChange={e => setBatchText(e.target.value)}
        />
        <button onClick={parseBatchText} className="btn btn-secondary btn-sm mb-2">{t.parseSuccess}</button>
        {parsedSales.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium mb-2">{t.parsedItems} ({parsedSales.length})</p>
            <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
              {parsedSales.map((item, i) => (
                <div key={i} className="text-[14px] bg-gray-50 p-2 rounded">
                  <BusinessDataTranslator text={item.productName} /> x {item.quantity} | {item.sale_date}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleBatchImport} className="btn btn-primary flex-1">{t.import} ({parsedSales.length})</button>
              <button onClick={() => { setShowBatch(false); setBatchText(''); setParsedSales([]); }} className="btn btn-secondary">{t.cancel}</button>
            </div>
          </div>
        )}
      </div>

      <div className="card-premium mb-2 !p-5">
        <h3 className="font-bold mb-2">{t.csvImport}</h3>
        <p className="text-[14px] text-gray-500 mb-2">{t.csvFormat}</p>
        <label className="btn btn-success btn-block text-center cursor-pointer">
          {importing ? '...' : t.csvImport}
          <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
        </label>
      </div>

      <div className="card-premium mb-2 !p-5">
        <h3 className="font-bold mb-2">{t('dateFilter')}</h3>
        <div className="flex gap-2 items-center">
          <input type="date" className="input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-gray-400">-</span>
          <input type="date" className="input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn btn-secondary btn-sm">{t('clear')}</button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold mb-1.5">{t.recentSales}</h3>
        {sales.length === 0 ? <p className="text-gray-400 text-sm">{t.noRecords}</p> : (
          <div className="space-y-1">
            {sales.slice(0, 20).map(s => (
              <div key={s.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 ">
                <span>
                  <BusinessDataTranslator text={s.productName} />
                </span>
                <span className="text-gray-500">{s.quantity}{t.cup}</span>
                <span className="text-gray-400 text-[14px]">{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

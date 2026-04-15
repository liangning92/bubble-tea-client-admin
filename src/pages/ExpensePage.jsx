import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function ExpensePage() {
  const { t, lang } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [showBatch, setShowBatch] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [parsedExpenses, setParsedExpenses] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    let url = '/expenses';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const data = await api('GET', url);
    setExpenses(data);
  };

  useEffect(() => { loadData(); }, [startDate, endDate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name) {
      alert(lang === 'zh' ? '请选择费用类型' : lang === 'en' ? 'Please select expense type' : 'Pilih jenis biaya');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'zh' ? '请输入有效金额' : lang === 'en' ? 'Please enter a valid amount' : 'Masukkan jumlah yang valid');
      return;
    }
    const result = await api('POST', '/expenses', { name, amount: parsedAmount });
    if (result?.error) {
      alert((lang === 'zh' ? '保存失败：' : lang === 'en' ? 'Save failed: ' : 'Gagal menyimpan: ') + (result.error || ''));
      return;
    }
    setName('');
    setAmount('');
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm(t.confirm + '?')) return;
    const result = await api('DELETE', `/expenses/${id}`);
    if (result?.error) return;
    loadData();
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const expenseTypes = [
    { value: 'rent', zh: '房租', id: 'Sewa' },
    { value: 'labor', zh: '人工', id: 'Tenaga Kerja' },
    { value: 'utilities', zh: '水电', id: 'Utilitas' },
    { value: 'supplies', zh: '耗材', id: 'Perlengkapan' },
    { value: 'other', zh: '其他', id: 'Lainnya' },
  ];

  const parseBatchText = () => {
    if (!batchText.trim()) { setParsedExpenses([]); return; }
    const lines = batchText.trim().split('\n');
    const typeMap = { '房租': 'rent', '人工': 'labor', '水电': 'utilities', '耗材': 'supplies', '其他': 'other', 'rent': 'rent', 'labor': 'labor', 'utilities': 'utilities', 'supplies': 'supplies', 'other': 'other' };
    const items = lines.map(line => {
      const parts = line.trim().split(/[\t\s,]+/).filter(p => p.trim());
      if (parts.length >= 2) {
        const typeKey = parts[0];
        const amt = parseFloat(parts[1]) || 0;
        const matchedType = Object.keys(typeMap).find(k => typeKey.includes(k) || k.includes(typeKey));
        return { name: typeMap[matchedType] || 'other', amount: amt, _raw: line, matchedType };
      }
      return null;
    }).filter(Boolean);
    setParsedExpenses(items);
  };

  const handleBatchImport = async () => {
    let failed = 0;
    for (const item of parsedExpenses) {
      const r = await api('POST', '/expenses', { name: item.name, amount: item.amount });
      if (r?.error) failed++;
    }
    setShowBatch(false);
    setBatchText('');
    setParsedExpenses([]);
    loadData();
    if (failed === 0) {
      window.dispatchEvent(new CustomEvent('app:success', { detail: t.importSuccess || 'Success' }));
    } else {
      window.dispatchEvent(new CustomEvent('app:error', { detail: `${failed} items failed` }));
    }
  };

  return (
    <div className="page">
      <h1 className="text-xl font-bold mb-6">{t.expenseTitle}</h1>

      <div className="card mb-4">
        <h3 className="font-bold mb-3">{t.addNew}</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <select className="input" value={name} onChange={e => setName(e.target.value)} required>
            <option value="">{t.selectExpenseType}</option>
            {expenseTypes.map(e => (
              <option key={e.value} value={e.value}>{t.lang === 'zh' ? e.zh : e.id}</option>
            ))}
          </select>
          <input className="input" type="number" step="0.01" placeholder={t.amount} value={amount} onChange={e => setAmount(e.target.value)} required />
          <button type="submit" className="btn btn-primary btn-block">{t.recordExpense}</button>
        </form>
      </div>

      <div className="card mb-4">
        <h3 className="font-bold mb-3">{t.batchExpenseImport}</h3>
        <p className="text-[14px] text-gray-500 mb-2">{t.batchExpenseTip}</p>
        <p className="text-[14px] text-gray-400 mb-2">{t.batchExpenseFormat}</p>
        <textarea
          className="input mb-2"
          rows={4}
          placeholder={"房租 5000\n人工 3000\n水电 500"}
          value={batchText}
          onChange={e => setBatchText(e.target.value)}
        />
        <button onClick={parseBatchText} className="btn btn-secondary btn-sm mb-2">{t.parseSuccess}</button>
        {parsedExpenses.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium mb-2">{t.parsedItems} ({parsedExpenses.length})</p>
            <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
              {parsedExpenses.map((item, i) => (
                <div key={i} className="text-[14px] bg-gray-50 p-2 rounded">
                  {item.matchedType || item.name} x Rp{item.amount}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleBatchImport} className="btn btn-primary flex-1">{t.import} ({parsedExpenses.length})</button>
              <button onClick={() => { setShowBatch(false); setBatchText(''); setParsedExpenses([]); }} className="btn btn-secondary">{t.cancel}</button>
            </div>
          </div>
        )}
      </div>

      <div className="card mb-4">
        <h3 className="font-bold mb-3">📅 按日期筛选</h3>
        <div className="flex gap-2 items-center">
          <input type="date" className="input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-gray-400">-</span>
          <input type="date" className="input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn btn-secondary btn-sm">清除</button>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">{t.expenseTitle}</h3>
          <span className="text-danger font-bold">{t.totalExpense}: Rp{total.toFixed(2)}</span>
        </div>
        {expenses.length === 0 ? <p className="text-gray-400 text-sm">{t.noRecords}</p> : (
          <div className="space-y-2">
             {expenses.slice(0, 20).map(e => (
               <div key={e.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                 <span>
                   <BusinessDataTranslator text={e.name} />
                 </span>
                <div>
                  <span className="text-danger">Rp{e.amount}</span>
                  <button onClick={() => handleDelete(e.id)} className="text-gray-400 ml-2 text-[14px]">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

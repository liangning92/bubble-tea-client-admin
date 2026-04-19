import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { parseFile, findColumnIndex } from '../utils/fileParser';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function PurchasePage() {
  const { t } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [inventoryId, setInventoryId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [spec, setSpec] = useState('kg');
  const [batchText, setBatchText] = useState('');
  const [parsedPurchases, setParsedPurchases] = useState([]);

  const loadData = async () => {
    try {
      const [invData, ordersData, historyData] = await Promise.all([
        api('GET', '/inventory'),
        api('GET', '/purchase-orders?status=pending'),
        api('GET', '/purchase-orders?status=received')
      ]);
      setInventory(Array.isArray(invData) ? invData : (invData?.data && Array.isArray(invData.data) ? invData.data : []));
      setPendingOrders(Array.isArray(ordersData) ? ordersData : (ordersData?.items && Array.isArray(ordersData.items) ? ordersData.items : (ordersData?.data && Array.isArray(ordersData.data) ? ordersData.data : [])));
      setOrderHistory(Array.isArray(historyData) ? historyData : (historyData?.items && Array.isArray(historyData.items) ? historyData.items : (historyData?.data && Array.isArray(historyData.data) ? historyData.data : [])));
    } catch (err) {
      console.error('PurchasePage loadData error:', err);
      window.dispatchEvent(new CustomEvent('app:error', { detail: t('loadError') }));
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddOrder = async (e) => {
    e.preventDefault();
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    if (!inventoryId || qty <= 0) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: t('selectIngredient') }));
      return;
    }
    const result = await api('POST', '/purchase-orders', { 
      inventoryId: parseInt(inventoryId), 
      quantity: qty,
      unitPrice: price,
      spec
    });
    if (result?.error) return;
    setQuantity(1);
    setInventoryId('');
    loadData();
    window.dispatchEvent(new CustomEvent('app:success', { detail: t('success') }));
  };

  const handleReceive = async (orderId) => {
    if (!confirm(t('confirmAction'))) return;
    const result = await api('POST', `/purchases/${orderId}/receive`);
    if (result?.error) return;
    loadData();
    window.dispatchEvent(new CustomEvent('app:success', { detail: t('success') }));
  };

  const handleBatchImport = async () => {
    let failed = 0;
    for (const item of parsedPurchases) {
      if (item.inventoryId) {
        const r = await api('POST', '/purchase-orders', { inventoryId: item.inventoryId, quantity: item.quantity });
        if (r?.error) failed++;
      }
    }
    setBatchText('');
    setParsedPurchases([]);
    loadData();
    if (failed === 0) {
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('success') }));
    } else {
      window.dispatchEvent(new CustomEvent('app:error', { detail: t('loadError') }));
    }
  };

  const parseBatchText = () => {
    if (!batchText.trim()) { setParsedPurchases([]); return; }
    const lines = batchText.trim().split('\n');
    const items = lines.map(line => {
      const parts = line.trim().split(/[\t\s,]+/).filter(p => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const qty = parseFloat(parts[1]) || 0;
        const matched = inventory.find(i => i.name.includes(name) || name.includes(i.name));
        return { name, quantity: qty, inventoryId: matched?.id, matched, _raw: line };
      }
      return null;
    }).filter(Boolean);
    setParsedPurchases(items);
  };

  const handleExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { rows, error } = await parseFile(file);
      if (error || rows.length < 2) {
        window.dispatchEvent(new CustomEvent('app:error', { detail: error || t('noRecords') }));
        return;
      }
      const header = rows[0];
      const nameIdx = findColumnIndex(header, ['name', 'ingredient', '原料', 'bahan', 'item', 'nama', 'produk']);
      const qtyIdx = findColumnIndex(header, ['quantity', 'qty', '数量', 'jumlah', 'amount', 'stock', 'stok']);
      const getVal = (row, idx) => idx >= 0 && idx < row.length ? String(row[idx] || '').trim() : '';

      const allItems = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row.some(c => c)) continue;
        const name = nameIdx >= 0 ? getVal(row, nameIdx) : getVal(row, 0);
        const qty = parseFloat(qtyIdx >= 0 ? getVal(row, qtyIdx) : getVal(row, 1)) || 0;
        if (!name || qty <= 0) continue;
        const matched = inventory.find(inv => inv.name.includes(name) || name.includes(inv.name));
        allItems.push({ name, quantity: qty, inventoryId: matched?.id, matched });
      }
      setParsedPurchases(allItems.filter(i => i.name));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: t('parsingError') + ': ' + err.message }));
    }
  };

  return (
    <div className="page animate-soft space-y-6 pb-24 !max-w-7xl">
      <div className="flex flex-col gap-2 px-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase ">{t('purchaseHubTitle')}</h1>
        <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em]  opacity-60">{t('purchaseHubSubtitle')}</p>
      </div>

      <div className="flex bg-slate-50 p-1.5 rounded-[24px] border border-slate-100 shadow-inner max-w-2xl">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 px-8 rounded-[18px] font-black transition-all text-[13px] uppercase tracking-widest  ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-100' : 'text-slate-300 hover:text-slate-600'}`}
        >
          📋 {t('purchaseOrders')} ({(pendingOrders || []).length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-8 rounded-[18px] font-black transition-all text-[13px] uppercase tracking-widest  ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-100' : 'text-slate-300 hover:text-slate-600'}`}
        >
          📦 {t('purchaseHistory')} ({(orderHistory || []).length})
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="card-premium !p-6 border-slate-50 shadow-sm bg-white !rounded-2xl hover:border-slate-200 transition-all group">
              <h3 className="text-xl font-black text-slate-900 mb-10  uppercase tracking-tight flex items-center gap-4">
                <span className="w-12 h-px bg-slate-900"></span>
                {t('addNew')}
              </h3>
              <form onSubmit={handleAddOrder} className="space-y-4">
                <div className="space-y-4">
                  <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('ingredient')}</label>
                  <select className="input-premium w-full !p-5 !rounded-2xl bg-slate-50 border-none appearance-none cursor-pointer  font-black uppercase text-[14px]" value={inventoryId} onChange={e => setInventoryId(e.target.value)} required>
                    <option value="">{t('selectMaterialTip')}</option>
                    {inventory.map(i => <option key={i.id} value={i.id}>{t('lang') === 'zh' ? i.zhName || i.name : i.name} ({t('onHandLabel')}: {i.stock}{i.unit})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('quantity')}</label>
                    <input className="input-premium w-full !p-5 !rounded-2xl bg-slate-50 border-none font-black text-[16px]" type="number" step="0.01" min="1" placeholder="0.00" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('spec')}</label>
                    <select className="input-premium w-full !p-5 !rounded-2xl bg-slate-50 border-none font-black text-[14px]" value={spec} onChange={e => setSpec(e.target.value)}>
                      <option value="kg">{t('unitKg')}</option>
                      <option value="L">{t('unitL')}</option>
                      <option value="个">{t('unitPc')}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('unitCostLabel')}</label>
                    <input className="input-premium w-full !p-5 !rounded-2xl bg-slate-50 border-none font-black text-[16px] no-spinners" type="number" step="0.01" placeholder="0.00" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="w-full btn-premium active !bg-slate-900 !text-white !h-11 !rounded-xl border-none shadow-2xl text-[14px] font-black uppercase tracking-widest  active:scale-95 transition-all">
                   {t('purchaseOrders')}
                </button>
              </form>
            </div>

            <div className="card-premium !p-6 border-slate-50 shadow-sm bg-slate-50/30 !rounded-2xl hover:border-slate-200 transition-all">
              <h3 className="text-xl font-black text-slate-900 mb-10  uppercase tracking-tight">{t('batchPurchaseImport')}</h3>

              <div className="space-y-4">
                <div className="p-10 bg-white rounded-[32px] border-2 border-slate-100 border-dashed text-center group transition-all hover:border-slate-900">
                  <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-6  opacity-60">📁 {t('uploadExcel')} (.xlsx / .csv)</p>
                  <label className="btn-premium active !bg-slate-900 !text-white !px-10 !py-3 inline-block cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10  font-black uppercase text-[14px] rounded-[18px]">
                    📤 {t('selectFile')}
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelFile} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center gap-6 py-3">
                   <div className="h-px bg-slate-100 flex-1"></div>
                   <span className="text-[14px] font-black text-slate-300 uppercase tracking-[0.4em]  opacity-40">OR PASTE</span>
                   <div className="h-px bg-slate-100 flex-1"></div>
                </div>

                <div className="space-y-4">
                  <textarea
                    className="input-premium w-full !p-6 h-40 focus:h-64 transition-all !rounded-[32px] bg-white border-slate-50 font-mono text-[14px] "
                    placeholder="Tea, 50\nSugar, 20"
                    value={batchText}
                    onChange={e => setBatchText(e.target.value)}
                  />
                  <button onClick={parseBatchText} className="w-full py-5 bg-white text-slate-900 border border-slate-100  font-black uppercase text-[14px] tracking-widest rounded-[20px] shadow-sm hover:bg-slate-900 hover:text-white transition-all">
                    {t('parseSuccess')}
                  </button>
                </div>

                {parsedPurchases.length > 0 && (
                  <div className="mt-8 p-10 bg-white rounded-[40px] border border-slate-100 shadow-2xl animate-soft relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-7xl font-black grayscale pointer-events-none ">PARSE</div>
                    <p className="text-[15px] font-black text-slate-900 mb-8  uppercase tracking-tight">{t('parsedItems')} ({parsedPurchases.length})</p>
                    <div className="space-y-4 mb-10 max-h-72 overflow-y-auto no-scrollbar pr-2">
                      {parsedPurchases.map((item, i) => (
                        <div key={i} className={`flex justify-between items-center p-5 rounded-[20px] border ${item.matched ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                          <span className="font-black text-[14px] "><BusinessDataTranslator text={item.name} /> x {item.quantity}</span>
                          <span className="text-[14px] font-black uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm">
                             {item.matched ? <span className="flex items-center gap-1">✓ <BusinessDataTranslator text={item.matched.name} /></span> : '⚠️ MISSING'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button onClick={handleBatchImport} className="flex-1 py-5 bg-slate-900 text-white rounded-[24px]  font-black uppercase text-[13px] tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/10 underline decoration-2 underline-offset-8 decoration-slate-700">{t('import')}</button>
                      <button onClick={() => { setParsedPurchases([]); setBatchText(''); }} className="px-10 py-5 bg-white text-slate-300 border border-slate-100 rounded-[24px]  font-black uppercase text-[14px] hover:text-slate-900 transition-colors uppercase tracking-widest">{t('cancel')}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card-premium !p-0 overflow-hidden bg-white border-slate-50 !rounded-2xl shadow-sm min-h-[800px] hover:border-slate-200 transition-all">
            <div className="p-10 border-b border-slate-50 bg-slate-50/30 backdrop-blur-md flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900  uppercase tracking-tight">{t('pendingOrdersTitle')}</h3>
              <span className="px-4 py-1.5 bg-slate-900 text-white text-[14px] font-black rounded-full uppercase  shadow-lg shadow-slate-900/10">{(pendingOrders || []).length}</span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {(pendingOrders || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-48 text-slate-100">
                   <div className="text-9xl mb-10 grayscale opacity-20 transition-all hover:rotate-12 hover:scale-110 pointer-events-none ">ZERO</div>
                   <p className="text-[14px] font-black uppercase tracking-[0.4em] ">{t('noRecordsFound')}</p>
                </div>
              ) : (
                <div className="p-8 space-y-4">
                  {(pendingOrders || []).map(order => (
                    <div key={order.id} className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 group hover:bg-white hover:shadow-3xl hover:shadow-slate-900/5 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-slate-900/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                        <div>
                          <div className="font-black text-slate-900 text-3xl tracking-tighter  mb-2 uppercase">
                             <BusinessDataTranslator text={order.inventory?.name} />
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[15px] font-black text-slate-900 underline decoration-4 decoration-slate-200 underline-offset-4 ">{order.quantity} {order.inventory?.unit}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span className="text-[14px] text-slate-400 font-black uppercase tracking-widest ">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleReceive(order.id)}
                          className="w-full md:w-auto btn-premium active !bg-slate-900 !text-white !px-12 !h-11 shadow-2xl shadow-slate-900/10 hover:scale-105 active:scale-95 text-[14px] font-black uppercase tracking-widest  !rounded-[20px]"
                        >
                          📦 {t('receiveStockAction')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card-premium !p-0 overflow-hidden border-slate-50 shadow-sm animate-soft bg-white !rounded-2xl hover:border-slate-200 transition-all">
          <div className="p-12 border-b border-slate-50 bg-slate-50/30 backdrop-blur-md">
            <h3 className="text-2xl font-black text-slate-900  uppercase tracking-tighter">{t('purchaseHistoryTitle')}</h3>
          </div>
          
          <div className="p-12 min-h-[600px]">
            {(orderHistory || []).length === 0 ? (
              <div className="py-48 text-center text-slate-100">
                 <div className="text-[120px] mb-12 grayscale opacity-10  font-black uppercase tracking-tighter">ARCHIVE</div>
                 <p className="text-[14px] font-black uppercase tracking-[0.4em] ">{t('noRecordsFound')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(orderHistory || []).map(order => (
                  <div key={order.id} className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-3xl transition-all relative overflow-hidden h-[340px]">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-4xl font-black grayscale pointer-events-none ">#{order.id}</div>
                    <div className="mb-8">
                       <div className="font-black text-slate-900 text-2xl tracking-tighter mb-2  uppercase">
                          <BusinessDataTranslator text={order.inventory?.name} />
                       </div>
                       <div className="text-[20px] font-black text-slate-900 underline decoration-slate-200 underline-offset-8 decoration-4 ">
                         {order.quantity} {order.inventory?.unit}
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-6 bg-white shadow-sm rounded-[24px] border border-slate-50 ring-1 ring-slate-100">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-[14px] font-black text-slate-300 uppercase tracking-widest ">{t('purchaseOrders')}</span>
                            <span className="text-[13px] font-black text-slate-900  uppercase tracking-tight">{new Date(order.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[14px] font-black text-slate-300 uppercase tracking-widest ">{t('received')}</span>
                            <span className="text-[13px] font-black text-slate-900  uppercase tracking-tight">{order.receivedAt ? new Date(order.receivedAt).toLocaleDateString() : '-'}</span>
                         </div>
                      </div>
                      <div className="flex justify-center">
                         <div className="px-4 py-3 bg-slate-900 text-white text-[14px] font-black rounded-full uppercase tracking-widest  shadow-lg shadow-slate-900/10">VERIFIED ✓</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-spinners::-webkit-outer-spin-button,
        .no-spinners::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinners {
          -moz-appearance: textfield;
        }
      `}} />
    </div>
  );
}

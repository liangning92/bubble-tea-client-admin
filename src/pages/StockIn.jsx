import BusinessDataTranslator from '../components/BusinessDataTranslator';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function StockInPage({ hideHeader }) {
  const { user, t } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState('');
  const [orderedQuantity, setOrderedQuantity] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [showBatch, setShowBatch] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [parsedBatch, setParsedBatch] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, historyData] = await Promise.all([
        api('GET', '/inventory'),
        api('GET', '/purchases?status=received'),
      ]);
      setInventory(invData?.data || (Array.isArray(invData) ? invData : []));
      setPurchaseHistory(historyData?.items || (Array.isArray(historyData) ? historyData : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvId || quantity <= 0) return;
    setSubmitting(true);
    try {
      await api('POST', '/purchases', {
        inventoryId: parseInt(selectedInvId),
        quantity: parseFloat(quantity),
        orderedQuantity: parseFloat(orderedQuantity),
        unitPrice: parseFloat(unitPrice || 0),
        totalPrice: parseFloat(quantity) * parseFloat(unitPrice || 0),
        status: 'received',
        receivedAt: new Date().toISOString(),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        operator: user?.username || 'admin',
        notes,
        purchaseDate: new Date().toISOString(),
        supplier: '默认供应商'
      });
      setSearchText(''); setSelectedInvId(''); setQuantity(1); setUnitPrice(0); setExpiryDate(''); setNotes('');
      loadData();
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('stockInRecorded') }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-24 text-center font-black text-slate-400 uppercase tracking-widest">{t('syncingInventory')}...</div>;

  return (
    <div className="space-y-4 animate-soft text-slate-900 pb-20 px-4 lg:px-4">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase ">{t('purchaseInCenter')}</h2>
          </div>
          <button onClick={() => setShowBatch(!showBatch)} className="px-4 py-3 bg-white text-slate-900 border border-slate-100 shadow-sm hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-widest rounded-xl">
            {showBatch ? '✕ 切换至单品录入' : '📋 批量文本入库 (Beta)'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
           <div className="card-premium border-slate-100 !p-8 bg-white !rounded-[32px] shadow-sm group">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">A</div>
                <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">第一步：采购明细 ( {t('orderExpectation')} )</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="md:col-span-2 space-y-4 relative" ref={dropdownRef}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('searchSelectMaterial')}</label>
                    <input className="input-premium w-full !p-5 !rounded-2xl font-bold bg-slate-50 border-none" placeholder={t('placeholderMaterialSearch')} value={searchText} onChange={e => { setSearchText(e.target.value); setShowDropdown(true); }} />
                    {showDropdown && searchText.trim() && (
                       <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-3xl z-50 mt-2 overflow-hidden animate-soft">
                          {inventory.filter(i => i.name.includes(searchText)).slice(0, 6).map(s => (
                             <div key={s.id} onClick={() => { setSearchText(s.name); setSelectedInvId(s.id); setUnitPrice(s.costPerUnit || 0); setShowDropdown(false); }} className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center transition-all">
                                <div>
                                   <p className="font-black text-slate-900 text-[14px] uppercase tracking-tight ">{s.name}</p>
                                   <p className="text-[11px] text-slate-400 font-bold">{t('currentStock')}: {s.quantity} {s.unit}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('orderQuantity')}</label>
                    <input type="number" className="input-premium w-full !p-5 font-black text-[18px] bg-slate-50 border-none !rounded-2xl text-center" value={orderedQuantity} onChange={e => setOrderedQuantity(parseFloat(e.target.value) || 0)} />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('purchasePrice')}</label>
                    <div className="relative">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[15px]">¥</span>
                       <input type="number" className="input-premium w-full !p-5 !pl-10 font-black text-[18px] bg-slate-50 border-none !rounded-2xl" value={unitPrice} onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)} />
                    </div>
                 </div>
              </div>
           </div>

           <div className="card-premium border-orange-100 !p-8 bg-white !rounded-[32px] shadow-sm group border-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm">B</div>
                <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">第二步：入库明细 ( {t('actualArrival')} )</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('actualQuantity')}</label>
                    <input type="number" className="input-premium w-full !p-5 font-black text-[22px] text-indigo-600 bg-indigo-50/20 border-none !rounded-2xl text-center" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('shelfLife')}</label>
                    <input type="date" className="input-premium w-full !p-5 bg-slate-50 border-none !rounded-2xl font-black text-[14px]" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">入库备注 / 批次说明</label>
                    <input type="text" className="input-premium w-full !p-5 bg-slate-50 border-none !rounded-2xl text-[14px] font-black" placeholder="..." value={notes} onChange={e => setNotes(e.target.value)} />
                 </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={handleSubmit}
                  disabled={submitting || !selectedInvId}
                  className="px-12 py-5 bg-slate-900 text-white text-[13px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-50 shadow-2xl shadow-slate-900/10 active:scale-95"
                >
                   {submitting ? t('committing') : t('confirmStockIn')}
                </button>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4">
           <div className="card-premium border-slate-50 bg-white !p-0 overflow-hidden shadow-xl !rounded-[32px] h-full">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-slate-900 font-black uppercase tracking-widest text-[11px]">
                 <span>{t('recentStockIn')}</span>
                 <span className="text-slate-300">{t('fullHistory')}</span>
              </div>
              <div className="divide-y divide-slate-50">
                 {purchaseHistory.length === 0 ? (
                    <div className="p-24 text-center text-slate-200 font-black uppercase tracking-widest text-sm">{t('noStockInHistory')}</div>
                 ) : (
                    purchaseHistory.map(h => (
                       <div key={h.id} className="p-6 hover:bg-slate-50 transition-all">
                          <div className="flex justify-between items-start mb-2">
                             <p className="font-black text-slate-900 text-[14px] uppercase tracking-tight truncate flex-1 leading-tight">{h.inventory?.name}</p>
                             <p className="text-[14px] font-black text-slate-900 ml-3 text-emerald-500">+{h.quantity}</p>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                             <p>{new Date(h.receivedAt).toLocaleDateString()}</p>
                             <p>{t('operator')}: {h.operator}</p>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

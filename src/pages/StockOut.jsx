import BusinessDataTranslator from '../components/BusinessDataTranslator';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function StockOutPage({ hideHeader }) {
  const { t, user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [stockOutHistory, setStockOutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [stockOutType, setStockOutType] = useState('waste'); 
  const [reason, setReason] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const STOCK_OUT_TYPES = [
    { value: 'waste', label: t('typeWaste') },
    { value: 'transfer', label: t('typeTransfer') },
    { value: 'adjustment', label: t('typeAdjustment') },
    { value: 'production', label: t('typeProduction') },
    { value: 'other', label: t('typeOther') },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, logsData] = await Promise.all([
        api('GET', '/inventory'),
        api('GET', '/inventory-logs'),
      ]);
      setInventory(invData?.data || (Array.isArray(invData) ? invData : []));
      const outLogs = ((logsData?.items) || (Array.isArray(logsData) ? logsData : [])).filter(log => log.changeAmount < 0);
      setStockOutHistory(outLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item) => {
    setSearchText(item.name);
    setSelectedInvId(item.id);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvId || !quantity || quantity <= 0) return;
    setSubmitting(true);
    try {
      const result = await api('POST', '/inventory/stock-out', {
        inventoryId: parseInt(selectedInvId),
        quantity: parseFloat(quantity),
        type: stockOutType,
        reason: reason.trim()
      });
      if (result?.error) return;
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('success') }));
      setSearchText(''); setSelectedInvId(''); setQuantity(1); setStockOutType('waste'); setReason('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="py-24 text-center">
      <div className="text-[14px] animate-pulse text-slate-900 font-black tracking-[0.4em] uppercase ">{t('accessingProcurement')}</div>
    </div>
  );

  const selectedItem = inventory.find(i => i.id === parseInt(selectedInvId));

  return (
    <div className="space-y-12 animate-soft text-slate-900 pb-24">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-4">
          <div className="space-y-4.5">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase ">{t('stockOutHub')}</h3>
            <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em]  opacity-60 leading-none">{t('stockOutSubtitle')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
           <div className="card-premium border-slate-50 !p-16 space-y-12 transition-all hover:border-slate-300 shadow-sm relative overflow-hidden !rounded-[48px] bg-white group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-slate-100 rounded-full blur-[120px] -mr-48 -mt-48 transition-transform group-hover:scale-110" />
              {!hideHeader && (
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter  border-b border-slate-50 pb-10 relative z-10 flex items-center gap-4">
                   <span className="w-12 h-px bg-slate-900"></span>
                   {t('disposalLogTitle')}
                </h4>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                 <div className="space-y-4 relative" ref={dropdownRef}>
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('selectMaterialLabel')}</label>
                    <input className="input-premium w-full !p-6 focus:!bg-white !rounded-[24px] font-black text-[16px]  bg-slate-50/50 border-none appearance-none" placeholder={t('materialPlaceholder')} value={searchText} onChange={e => { setSearchText(e.target.value); setShowDropdown(true); }} />
                    {showDropdown && searchText.trim() && (
                       <div className="absolute top-full left-0 w-full bg-white border border-slate-50 rounded-[32px] shadow-3xl z-50 mt-4 overflow-hidden animate-soft py-3 ring-1 ring-slate-100">
                          {inventory.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase())).slice(0, 8).map(s => (
                             <div key={s.id} onClick={() => handleSelectItem(s)} className="p-6 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center transition-all group/item">
                                <div>
                                   <p className="font-black text-slate-900 text-[16px] group-hover/item:text-slate-600 transition-colors uppercase tracking-tight ">
                                      <BusinessDataTranslator text={s.name} />
                                   </p>
                                   <p className="text-[14px] text-slate-400 font-black uppercase tracking-widest mt-2 bg-white inline-block px-3 py-1 rounded-full border border-slate-100 ">{t('onHandLabel')}: {s.quantity} {s.unit}</p>
                                </div>
                                <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[14px] font-black rounded-full uppercase tracking-widest border border-slate-200 ">
                                   <BusinessDataTranslator text={s.category || t('materialRaw')} />
                                </span>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
                 <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('disposalQtyLabel')}</label>
                    <div className="flex overflow-hidden rounded-[24px] border border-slate-100 shadow-sm bg-slate-50/50">
                       <input type="number" className="input-premium flex-1 !p-6 font-black text-slate-900 text-3xl border-none shadow-none bg-transparent focus:!bg-white " value={quantity} onChange={e => setQuantity(e.target.value)} />
                       <span className={`w-32 bg-slate-900 flex items-center justify-center font-black text-[14px] uppercase ${selectedItem && quantity > selectedItem.quantity ? 'text-marigold animate-pulse' : 'text-white'}  shrink-0 transition-colors`}>
                          {selectedItem?.unit || 'Units'}
                       </span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('disposalCategoryLabel')}</label>
                    <select className="input-premium w-full !p-6 bg-slate-50/50 font-black text-[15px] uppercase tracking-tighter  !rounded-[24px] focus:!bg-white appearance-none border-none" value={stockOutType} onChange={e => setStockOutType(e.target.value)}>
                       {STOCK_OUT_TYPES.map(tData => <option key={tData.value} value={tData.value}>{tData.label}</option>)}
                    </select>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest pl-2 ">{t('auditReasonLabel')}</label>
                    <input className="input-premium w-full !p-6 bg-slate-50/50 focus:!bg-white !rounded-[24px] font-black text-[16px]  border-none" placeholder={t('auditReasonPlaceholder')} value={reason} onChange={e => setReason(e.target.value)} />
                 </div>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={submitting || !selectedInvId}
                className="w-full btn-premium active !bg-slate-900 !text-white !h-28 border-none shadow-3xl shadow-slate-900/20 text-[18px] font-black uppercase tracking-[0.2em] relative z-10 !scale-100 hover:scale-[1.02] active:scale-95 transition-all !rounded-[32px]  underline decoration-4 underline-offset-8 decoration-slate-700"
              >
                 {submitting ? t('processingDatabase') : t('confirmDisposalLedger')}
              </button>
           </div>
        </div>

        <div className="space-y-12">
           <div className="card-premium border-slate-50 bg-white !p-0 overflow-hidden shadow-sm hover:border-slate-300 transition-all !rounded-[48px] h-full">
              <div className="p-12 border-b border-slate-50 bg-slate-50/30 backdrop-blur-md flex justify-between items-center">
                 <h4 className="text-[14px] font-black uppercase tracking-widest text-slate-900 ">{t('latestOutRecords')}</h4>
                 <span className="text-[14px] bg-slate-900 text-white px-4 py-3 rounded-full uppercase font-black tracking-widest shadow-sm ">{t('auditTrail')}</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-[1000px] overflow-y-auto no-scrollbar font-sans">
                 {stockOutHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-32 text-slate-100 grayscale  opacity-20">
                       <div className="text-8xl mb-8 font-black uppercase tracking-tighter">ZERO</div>
                       <p className="text-[13px] font-black uppercase tracking-[0.5em]">{t('noLiveDisposal')}</p>
                    </div>
                 ) : (
                   stockOutHistory.map(h => (
                      <div key={h.id} className="p-12 hover:bg-slate-50/80 transition-all group cursor-default relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-5 text-4xl font-black grayscale pointer-events-none  uppercase">DISPOSE</div>
                         <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="space-y-4">
                               <p className="font-black text-slate-900 text-[18px] uppercase tracking-tighter group-hover:text-slate-600 transition-colors ">{h.inventory?.name}</p>
                               <span className="px-3 py-1 bg-slate-900 text-white text-[14px] font-black rounded-full uppercase tracking-widest ">{t(`type${h.type?.charAt(0).toUpperCase() + h.type?.slice(1)}`) || h.type}</span>
                            </div>
                            <p className="text-[20px] font-black text-slate-900 tracking-tighter underline decoration-4 decoration-slate-100 underline-offset-4">-{Math.abs(h.changeAmount)}</p>
                         </div>
                         <p className="text-[13px] text-slate-400 font-black  mt-4 leading-relaxed tracking-tight group-hover:text-slate-900 transition-colors relative z-10 opacity-70 border-l-2 border-slate-100 pl-4">{h.reason?.toUpperCase() || 'SYSTEM GENERATED DISPOSAL'}</p>
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


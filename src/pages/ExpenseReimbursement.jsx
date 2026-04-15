import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function ExpenseReimbursement({ hideHeader }) {
  const { t, user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
     setLoading(true);
     try {
        const res = await api('GET', '/expense');
        if (res && !res.error) {
           const mapped = (Array.isArray(res) ? res : (res?.data || [])).map(ex => ({
              id: ex.id,
              type: ex.name,
              amount: ex.amount,
              applicant: ex.notes?.includes('By: ') ? ex.notes.split('By: ')[1] : t('staffMember'),
              status: ex.approvedBy ? 'approved' : 'pending',
              note: ex.notes || '',
              date: ex.occurredAt ? new Date(ex.occurredAt).toISOString().split('T')[0] : '',
              hasReceipt: !!ex.receiptUrl
           }));
           setExpenses(mapped);
        }
     } catch (e) {
        console.error(e);
     } finally {
        setLoading(false);
     }
  };

  useEffect(() => { loadData(); }, []);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: t('catEmergencyMaterial'), amount: '', note: '' });
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    setIsUploading(true);
    try {
       const res = await api('POST', '/expense', {
          name: form.type,
          amount: parseFloat(form.amount),
          type: 'staff',
          description: form.note + ` (${t('staffMember')}: ${user?.username || t('staffMember')})`
       });
       if (res && !res.error) {
          window.dispatchEvent(new CustomEvent('app:success', { detail: t('successSubmit') }));
          setShowForm(false);
          setForm({ type: t('catEmergencyMaterial'), amount: '', note: '' });
          loadData();
       }
    } catch (err) {
       console.error(err);
    } finally {
       setIsUploading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
       const res = await api('PUT', `/expense/${id}`, { approvedBy: user?.id || 1 });
       if (res && !res.error) {
          window.dispatchEvent(new CustomEvent('app:success', { detail: t('successApprove') }));
          loadData();
       }
    } catch (err) {
       console.error(err);
    }
  };

  const handleReject = async (id) => {
    if (window.confirm(t('deleteClaimConfirm'))) {
       const res = await api('DELETE', `/expense/${id}`);
       if (res && !res.error) {
          loadData();
       }
    }
  };

  return (
    <div className="space-y-6 animate-soft text-slate-900 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 px-2">
        {!hideHeader ? (
          <div className="space-y-1">
            <h2 className="text-h1 uppercase  tracking-tight">{t('expenseHub')}</h2>
            <p className="text-label-caps !text-slate-400">{t('expenseSubtitle')}</p>
          </div>
        ) : <div className="flex-1" />}
        <button 
          onClick={() => setShowForm(true)}
          className="btn-premium active !bg-slate-900 !text-white !px-8 !py-3.5 border-none shadow-2xl shadow-slate-900/10 !scale-100 hover:scale-105 active:scale-95 transition-all text-[13px] font-black uppercase tracking-widest"
        >
           + {t('newClaim')}
        </button>
      </div>

      {showForm && (
         <div className="card-premium border-slate-900/10 !p-8 relative animate-soft bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] !rounded-[40px] overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900 opacity-5 blur-[100px] -mr-32 -mt-32"></div>
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm z-10">✕</button>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8 border-b border-slate-50 pb-6 relative z-10">
                ⚡ {t('claimSubmission')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-label-caps block pl-2">{t('expenseCategory')}</label>
                    <select className="input-premium w-full !p-4 font-black text-slate-900 text-[14px] bg-slate-50 border-transparent hover:border-slate-200" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                       <option value={t('catEmergencyMaterial')}>{t('catEmergencyMaterial')}</option>
                       <option value={t('catUtilities')}>{t('catUtilities')}</option>
                       <option value={t('catRepair')}>{t('catRepair')}</option>
                       <option value={t('catMarketing')}>{t('catMarketing')}</option>
                       <option value={t('catTransport')}>{t('catTransport')}</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-label-caps block pl-2">{t('amount')}</label>
                    <input type="number" required placeholder="0.00" className="input-premium w-full !p-4 font-black text-slate-900 text-2xl tracking-tighter bg-slate-50 border-transparent hover:border-slate-200" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} />
                  </div>
               </div>
               
               <div className="space-y-3">
                  <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest block pl-2">{t('receiptUpload')}</label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] py-12 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all cursor-pointer group shadow-inner">
                     <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500">📸</div>
                     <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{t('attachReceipt')}</p>
                  </div>
               </div>

               <div className="space-y-3">
                 <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest block pl-2">{t('complianceNote')}</label>
                 <textarea required placeholder="..." className="input-premium w-full h-32 !p-6 text-[14px] font-medium bg-slate-50 border-transparent hover:border-slate-200" value={form.note} onChange={e=>setForm({...form, note: e.target.value})} />
               </div>

               <div className="pt-4">
                 <button type="submit" disabled={isUploading} className="w-full btn-premium active !bg-slate-900 !text-white !h-16 border-none shadow-3xl shadow-slate-900/20 text-sm font-black uppercase tracking-widest !rounded-[24px] hover:scale-[1.01] active:scale-95 transition-all">
                   {isUploading ? t('syncingEvidence') : t('commitClaim')}
                 </button>
               </div>
            </form>
         </div>
      )}

      <div className="space-y-5">
        <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-4 ">{t('auditHistory')}</h3>
        <div className="grid grid-cols-1 gap-8">
          {(expenses || []).map(ex => (
             <div key={ex.id} className={`group relative card-premium !p-6 md:!p-8 border-slate-50 bg-white hover:border-slate-200 transition-all !rounded-[40px] shadow-sm hover:shadow-xl ${ex.status === 'rejected' ? 'opacity-40 grayscale' : ''}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                   <div className="flex items-center gap-6 flex-1">
                      <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl shadow-sm border transition-transform group-hover:scale-110 group-hover:rotate-3 ${ex.status === 'pending' ? 'bg-slate-50 text-slate-300 border-slate-100' : ex.status === 'rejected' ? 'bg-red-50 text-red-300 border-red-50' : 'bg-slate-900 text-marigold border-slate-800'}`}>
                         {ex.status === 'pending' ? '⌛' : ex.status === 'rejected' ? '🚫' : '💎'}
                      </div>
                      <div>
                         <div className="flex items-center gap-5 mb-3">
                           <h4 className="font-black text-slate-900 text-2xl tracking-tighter ">
                              <BusinessDataTranslator text={ex.type} />
                           </h4>
                           {ex.hasReceipt && <span className="text-[14px] font-black uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 tracking-widest shadow-sm">{t('verifiedReceipt')}</span>}
                         </div>
                         <p className="text-[16px] text-slate-500 font-bold  leading-relaxed flex items-center gap-3">
                           <span className="text-slate-900 not- uppercase font-black tracking-widest text-[14px] bg-slate-900 text-white px-3 py-1 rounded-lg shadow-sm">{ex.applicant}</span>
                           "{ex.note}"
                         </p>
                         <div className="mt-5 flex gap-6 text-[14px] font-black text-slate-300 uppercase tracking-widest ">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-200"></span>{ex.date}</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-200"></span>EX-{ex.id}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 bg-slate-50 md:bg-transparent p-6 md:p-0 rounded-[24px] md:rounded-none">
                      <div className="text-right">
                         <div className={`text-4xl font-black tracking-tighter ${ex.status==='rejected' ? 'text-slate-300 line-through' : 'text-slate-900'}`}>- {t('currencySymbol')} {ex.amount.toLocaleString()}</div>
                         <div className={`text-[14px] font-black uppercase tracking-widest mt-2 px-3 py-1 rounded-full inline-block ${ex.status === 'pending' ? 'bg-slate-100 text-slate-400' : ex.status === 'approved' ? 'bg-slate-900 text-white shadow-lg' : 'bg-red-50 text-red-600'}`}>
                           {ex.status === 'pending' ? t('pendingApproval') : ex.status === 'approved' ? t('settled') : t('rejected')}
                         </div>
                      </div>

                      {ex.status === 'pending' && (
                         <div className="flex gap-4">
                            <button onClick={() => handleApprove(ex.id)} className="w-16 h-16 bg-slate-900 text-white rounded-[24px] font-black shadow-2xl shadow-slate-900/10 hover:bg-emerald-600 transition-all flex items-center justify-center text-3xl active:scale-95">✓</button>
                            <button onClick={() => handleReject(ex.id)} className="w-16 h-16 bg-white border border-slate-100 text-slate-200 rounded-[24px] hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center text-3xl shadow-sm active:scale-95">✕</button>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          ))}
          {(expenses || []).length === 0 && (
            <div className="text-center py-40 card-premium !bg-slate-50 border-2 border-dashed border-slate-100 !rounded-[56px] group transition-all">
               <div className="text-7xl mb-10 grayscale opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700">📂</div>
               <p className="text-slate-300 font-black uppercase tracking-widest text-sm ">{t('auditRecordsClean')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

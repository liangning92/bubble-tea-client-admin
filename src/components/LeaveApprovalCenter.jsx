import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

/**
 * 休假审批中心
 */
export default function LeaveApprovalCenter({ onUpdate }) {
  const { t, lang } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending | approved | rejected

  const loadRequests = async () => {
    setLoading(true);
    const res = await api('GET', `/schedule/leaves?status=${filter}`);
    if (!res.error) {
       // Ensure we handle both direct arrays and potential nested object responses
       setRequests(Array.isArray(res) ? res : (res.items || res.data || []));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const handleAction = async (id, status) => {
    const notes = status === 'rejected' ? window.prompt(t('rejectConfirm')) : '';
    if (status === 'rejected' && notes === null) return;

    const res = await api('PATCH', `/schedule/leaves/${id}`, { status, notes });
    if (!res.error) {
      loadRequests();
      if (onUpdate) onUpdate();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{t('leavePending')}</span>;
      case 'approved': return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{t('leaveApproved')}</span>;
      case 'rejected': return <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{t('leaveRejected')}</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-soft">
      {/* 过滤器 */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
              filter === s ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            {t(`leave${s.charAt(0).toUpperCase() + s.slice(1)}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">{t('loading')}</div>
      ) : requests.length === 0 ? (
        <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">{t('noActiveTasks')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white border border-slate-100 p-6 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-xl transition-all">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-inner group-hover:bg-orange-50 transition-colors">
                    👤
                  </div>
                  <div>
                    <h4 className="text-[17px] font-black text-slate-800 tracking-tight flex items-center gap-3">
                      {req.staffName}
                      <span className="text-[11px] text-slate-300 border border-slate-100 px-2 py-0.5 rounded-md uppercase font-bold">{req.staffRole}</span>
                    </h4>
                    <p className="text-[13px] text-slate-500 font-bold mt-1">
                      📅 {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </p>
                  </div>
               </div>

               <div className="flex-1 max-w-md">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('leaveReason')}</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-md">{t(req.type + 'Leave')}</span>
                 </div>
                 <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                   {req.reason || '-'}
                 </p>
               </div>

               <div className="flex items-center gap-3 min-w-[200px] justify-end">
                  {req.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleAction(req.id, 'approved')}
                        className="btn-premium !py-3 !px-6 !bg-emerald-500 !text-white border-none text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
                      >
                        {t('approve')}
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, 'rejected')}
                        className="btn-premium !py-3 !px-6 !bg-white !text-slate-400 border border-slate-100 hover:!text-rose-500 hover:border-rose-100 text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
                      >
                        {t('reject')}
                      </button>
                    </>
                  ) : (
                    <div className="text-right">
                       {getStatusBadge(req.status)}
                       {req.notes && <p className="text-[11px] text-slate-400 mt-2 italic font-medium">"{req.notes}"</p>}
                    </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

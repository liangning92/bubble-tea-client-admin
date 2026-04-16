import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function RewardManagementTab({ lang = 'zh' }) {
  const { t } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | appealed | penalty | reward
  const [resolveModal, setResolveModal] = useState(null); // { id, type }
  const [note, setNote] = useState('');

  const loadRewards = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/reward');
      setRewards(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Load rewards failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRewards(); }, []);

  const handleResolve = async (id, action) => {
    try {
      await api('POST', `/reward/${id}/resolve`, { action, note });
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('rewardProcessed') }));
      setResolveModal(null);
      setNote('');
      loadRewards();
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: e.message } }));
    }
  };

  const filtered = rewards.filter(r => {
    if (filter === 'appealed') return r.status === 'appealed';
    if (filter === 'penalty') return r.type === 'penalty';
    if (filter === 'reward') return r.type === 'reward';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div className="flex gap-2">
          {['all', 'appealed', 'penalty', 'reward'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-[14px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-400'
              }`}
            >
              {f === 'all' ? '全部' : f === 'appealed' ? '待处理申诉 ⚠️' : f === 'penalty' ? '处罚' : '奖励'}
            </button>
          ))}
        </div>
        <div className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">
           {filtered.length} {t('foundRecords')}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-300 font-bold">同步奖惩账目中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 ">暂无对应记录</div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${r.type === 'penalty' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {r.type === 'penalty' ? '📉' : '📈'}
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-900">{r.User?.username}</span>
                      <span className={`px-4 py-0.5 rounded text-[8px] font-black uppercase ${r.type === 'penalty' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {r.type === 'penalty' ? t('penaltyLabel') : t('rewardLabel')}
                      </span>
                      {r.status === 'appealed' && <span className="px-4 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded animate-pulse">待处理申诉</span>}
                   </div>
                   <div className="text-sm font-bold text-slate-600">{r.reason}</div>
                   <div className="text-[14px] text-slate-400 mt-1 font-medium">{new Date(r.occurredAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                   <div className={`text-xl font-black ${r.type === 'penalty' ? 'text-red-500' : 'text-emerald-500'}`}>
                     {r.type === 'penalty' ? '-' : '+'} Rp {r.amount.toLocaleString()}
                   </div>
                   <div className="text-[14px] text-slate-400 font-black uppercase tracking-widest">
                      {t('status')}: {r.status === 'active' ? t('onTime') : r.status === 'appealed' ? '申诉中' : t('archived')}
                   </div>
                </div>
                
                <div className="flex gap-2">
                   {r.status === 'appealed' ? (
                     <>
                        <button 
                          onClick={() => setResolveModal({ id: r.id, action: 'revoked', title: '批准申诉 (撤销奖惩)' })}
                          className="px-4 py-3 bg-emerald-600 text-white text-[14px] font-black rounded-xl shadow-lg active:scale-95 transition-all"
                        >
                          批准/撤销
                        </button>
                        <button 
                          onClick={() => setResolveModal({ id: r.id, action: 'rejected', title: '驳回申诉 (维持原状)' })}
                          className="px-4 py-3 bg-slate-900 text-white text-[14px] font-black rounded-xl shadow-lg active:scale-95 transition-all"
                        >
                          驳回
                        </button>
                     </>
                   ) : r.status === 'active' ? (
                     <button 
                        onClick={() => setResolveModal({ id: r.id, action: 'revoked', title: '直接撤销奖惩' })}
                        className="px-4 py-3 bg-red-50 text-red-500 hover:bg-red-100 text-[14px] font-black rounded-xl transition-all"
                     >
                        撤销
                     </button>
                   ) : (
                     <span className="text-[14px] font-black text-slate-300 border border-slate-100 px-3 py-1 rounded-lg">ARCHIVED</span>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 预审动态追踪 (日志) - 此处可扩展显示最近动态 */}

      {/* 处理弹窗 */}
      {resolveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white max-w-md w-full rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95">
              <h2 className="text-2xl font-black text-slate-800 mb-2">{resolveModal.title}</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">选填：请输入处理备注或理由：</p>
              <textarea 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-6 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                rows="3"
                placeholder={t('placeholderAppealResult')}
                value={note}
                onChange={e => setNote(e.target.value)}
              ></textarea>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => setResolveModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl">取消</button>
                 <button onClick={() => handleResolve(resolveModal.id, resolveModal.action)} className="flex-1 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95">确认处理</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

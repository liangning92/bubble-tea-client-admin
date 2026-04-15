import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function RewardPage() {
  const { t } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all | reward | penalty
  const [resolveModal, setResolveModal] = useState(null); // { id, action, title }
  const [resolveNote, setResolveNote] = useState('');

  const [form, setForm] = useState({
    userId: '',
    category: 'reward',
    amount: '',
    reason: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [rewardData, staffData] = await Promise.all([
        api('GET', '/staff/rewards'),
        api('GET', '/staff/users')
      ]);
      setRewards(Array.isArray(rewardData) ? rewardData : (rewardData?.data || []));
      setStaffList(Array.isArray(staffData) ? staffData : (staffData?.data || []));
    } catch (e) {
      console.error("Load Reward Data Failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.amount) return;

    try {
      const res = await api('POST', '/staff/rewards', {
        userId: parseInt(form.userId),
        category: form.category,
        amount: parseFloat(form.amount),
        reason: form.reason
      });

      if (res && !res.error) {
        setShowAddForm(false);
        setForm({ userId: '', category: 'reward', amount: '', reason: '' });
        loadData();
        window.dispatchEvent(new CustomEvent('app:success', { detail: t('opSuccess', '记录已成功存证') }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (id, action) => {
    try {
      // Backend handles delete for rewards normally
      const res = await api('DELETE', `/staff/rewards/${id}`);
      if (res && !res.error) {
        loadData();
        window.dispatchEvent(new CustomEvent('app:success', { detail: t('opSuccess', '记录已撤销') }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = rewards.filter(r => {
    if (filter === 'reward') return r.category === 'reward';
    if (filter === 'penalty') return r.category === 'penalty';
    return true;
  });

  const formatCurrency = (num) => 'Rp ' + Math.round(num || 0).toLocaleString();

  return (
    <div className="space-y-10 animate-soft text-slate-900 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <span className="text-3xl">⚖️</span> {t('rewardPenalty', '绩效奖惩与合规审计')}
          </h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Performance transparency & incentive matrix</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              {['all', 'reward', 'penalty'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    filter === f ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f === 'all' ? t('all', '全部') : f === 'reward' ? t('reward', '奖励') : t('penalty', '惩罚')}
                </button>
              ))}
           </div>
           <button 
             onClick={() => setShowAddForm(true)}
             className="h-12 bg-slate-900 text-white px-8 rounded-2xl shadow-2xl text-[12px] font-black uppercase tracking-widest active:scale-95 transition-all"
           >
             + {t('addNew', '录入奖惩记录')}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-32 text-center text-slate-300 font-black uppercase animate-pulse">{t('loading', '正在同步数据...')}</div>
        ) : filtered.length === 0 ? (
          <div className="card-premium !p-32 text-center text-slate-200 font-black uppercase tracking-widest italic border-slate-100 bg-white/50">{t('noData', '暂无对应记录')}</div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className="card-premium !p-8 group hover:border-slate-300 transition-all border-slate-50 bg-white !rounded-[40px] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center text-3xl shadow-2xl ${r.category === 'reward' ? 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10' : 'bg-rose-50 text-rose-500 shadow-rose-500/10'}`}>
                    {r.category === 'reward' ? '🏆' : '⚠️'}
                  </div>
                  <div>
                     <div className="flex items-center gap-3 mb-1">
                        <span className="text-[18px] font-black text-slate-900 tracking-tighter">{r.User?.username || 'Staff'}</span>
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.category === 'reward' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>
                           {r.category === 'reward' ? t('rewardLabel', '奖励') : t('penaltyLabel', '惩罚')}
                        </span>
                     </div>
                     <div className="text-[14px] font-black text-slate-400 uppercase tracking-tight">{r.reason || t('noReason', '未填注理由')}</div>
                     <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-2">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
               </div>
               <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end">
                  <div className={`text-3xl font-black font-mono tracking-tighter ${r.category === 'reward' ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {r.category === 'reward' ? '+' : '-'}{formatCurrency(r.amount)}
                  </div>
                  <button 
                    onClick={() => { if(confirm(t('confirmDelete', '确定要撤销该记录吗？'))) handleAction(r.id, 'delete'); }}
                    className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-rose-500 hover:text-white transition-all text-xl font-black group-hover:bg-slate-100 shadow-inner group-hover:shadow-none"
                  >
                    ✕
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-soft">
          <div className="bg-white rounded-[48px] shadow-3xl w-full max-w-xl overflow-hidden border-8 border-white p-2">
            <div className="px-10 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-[40px] mb-4">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('newEntry', '录入奖惩审计')}</h3>
              <button onClick={() => setShowAddForm(false)} className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm text-xl font-black">✕</button>
            </div>
            <div className="p-10">
              <form onSubmit={handleSubmit} className="space-y-10 text-slate-400">
                <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest ml-1">{t('staffMember', '协作成员')}</label>
                   <select 
                     className="w-full h-16 bg-slate-50 rounded-3xl px-6 font-black text-slate-900 outline-none border-4 border-transparent focus:border-slate-900/5 transition-all appearance-none cursor-pointer shadow-inner"
                     value={form.userId} 
                     onChange={e => setForm({ ...form, userId: e.target.value })}
                     required
                   >
                     <option value="">{t('selectStaff', '选择员工账户')}</option>
                     {staffList.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[11px] font-black uppercase tracking-widest ml-1">{t('type', '类型')}</label>
                     <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-3xl shadow-inner border border-slate-100">
                        <button 
                          type="button"
                          onClick={() => setForm({...form, category: 'reward'})}
                          className={`h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${form.category === 'reward' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                          {t('reward', '奖励')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setForm({...form, category: 'penalty'})}
                          className={`h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${form.category === 'penalty' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                          {t('penalty', '惩罚')}
                        </button>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[11px] font-black uppercase tracking-widest ml-1">{t('amount', '金额')} (Rp)</label>
                     <input 
                       className="w-full h-16 bg-slate-50 rounded-3xl px-8 font-black text-slate-900 outline-none border-4 border-transparent focus:border-slate-900/5 transition-all shadow-inner text-xl"
                       type="number" 
                       value={form.amount} 
                       onChange={e => setForm({ ...form, amount: e.target.value })} 
                       required 
                       placeholder="e.g. 50000"
                     />
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest ml-1">{t('reason', '事由/凭证摘要')}</label>
                   <textarea 
                     className="w-full bg-slate-50 rounded-[32px] p-8 font-bold text-slate-900 outline-none border-4 border-transparent focus:border-slate-900/5 transition-all shadow-inner placeholder:text-slate-200"
                     rows="3"
                     value={form.reason}
                     onChange={e => setForm({ ...form, reason: e.target.value })}
                     placeholder="Detailed event log..."
                   ></textarea>
                </div>

                <button type="submit" className="w-full h-24 bg-slate-900 text-white rounded-[40px] font-black uppercase tracking-[0.4em] shadow-3xl active:scale-95 transition-all text-[15px] border-8 border-white ring-8 ring-slate-100/50">
                  {t('confirmSync', '同步至绩效流水')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

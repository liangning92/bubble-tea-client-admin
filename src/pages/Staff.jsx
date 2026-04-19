import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import BusinessDataTranslator from '../components/BusinessDataTranslator';

export default function StaffPage({ defaultTab: initialTab }) {
  const { t, lang } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'trainings');
  const isStandalone = !!initialTab;

  // ========== 培训 ==========
  const [trainings, setTrainings] = useState([]);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [trainingForm, setTrainingForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], assignedTo: '', content: '' });
  const [staffList, setStaffList] = useState([]);

  const loadStaffList = async () => {
    try {
      const data = await api('GET', '/staff/users');
      setStaffList(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) { console.error(e); }
  };

  const loadTrainings = async () => {
    try {
      const data = await api('GET', '/staff/training?includeStaff=true');
      setTrainings(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    if (activeTab === 'trainings') {
      loadTrainings();
      loadStaffList();
    }
  }, [activeTab]);

  const handleAddTraining = async (e) => {
    e.preventDefault();
    const result = await api('POST', '/staff/training', {
      title: trainingForm.title,
      assignedTo: trainingForm.assignedTo || null,
      createdBy: 1
    });
    if (result?.error) return;
    setShowAddTraining(false);
    setTrainingForm({ title: '', date: new Date().toISOString().split('T')[0], assignedTo: '', content: '' });
    loadTrainings();
  };

  // ========== 排班 ==========
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ userId: '', date: '', shiftId: '' });
  const [scheduleFilter, setScheduleFilter] = useState({ month: new Date().toISOString().slice(0, 7) });

  const loadSchedules = async () => {
    try {
      const [year, m] = scheduleFilter.month.split('-');
      const startDate = `${year}-${m}-01`;
      const lastDay = new Date(year, m, 0).getDate();
      const endDate = `${year}-${m}-${lastDay}`;
      const data = await api('GET', `/staff/schedules?startDate=${startDate}&endDate=${endDate}`);
      setSchedules(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) { console.error(e); }
  };

  const loadShifts = async () => {
    try {
      const data = await api('GET', '/staff/shifts');
      setShifts(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) { console.error(e); }
  };

  const loadLeaves = async () => {
    try {
      const data = await api('GET', '/staff/leaves');
      setLeaves(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    if (activeTab === 'schedules') {
      loadSchedules();
      loadShifts();
      loadLeaves();
      loadStaffList();
    }
  }, [activeTab, scheduleFilter]);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    const selectedShift = (shifts || []).find(s => s.id === parseInt(scheduleForm.shiftId));
    const shiftValue = selectedShift ? selectedShift.name : scheduleForm.shiftId;
    const r1 = await api('POST', '/staff/schedules', {
      staffId: parseInt(scheduleForm.userId),
      date: scheduleForm.date,
      shift: shiftValue
    });
    if (r1?.error) return;
    setShowAddSchedule(false);
    setScheduleForm({ userId: '', date: '', shiftId: '' });
    loadSchedules();
  };

  const getShiftColor = (shift) => {
    if (!shift) return 'bg-slate-800 text-slate-400';
    if (typeof shift === 'object' && shift.color) return `background-color: ${shift.color}; color: white;`;
    const colors = {
      '早班': 'bg-amber-500/20 text-amber-400',
      '中班': 'bg-orange-500/20 text-orange-400',
      '晚班': 'bg-indigo-500/20 text-indigo-400',
      'morning': 'bg-amber-500/20 text-amber-400',
      'afternoon': 'bg-orange-500/20 text-orange-400',
      'night': 'bg-indigo-500/20 text-indigo-400'
    };
    return colors[shift] || 'bg-slate-800 text-slate-400';
  };

  // ========== 奖惩 ==========
  const [rewards, setRewards] = useState([]);
  const [showAddReward, setShowAddReward] = useState(false);
  const [rewardForm, setRewardForm] = useState({ userId: '', type: 'reward', amount: 0, reason: '' });

  const loadRewards = async () => {
    try {
      const data = await api('GET', '/staff/rewards');
      setRewards(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (activeTab === 'rewards') { loadRewards(); loadStaffList(); } }, [activeTab]);

  const handleAddReward = async (e) => {
    e.preventDefault();
    const r = await api('POST', '/staff/rewards', { userId: rewardForm.userId, category: rewardForm.type, amount: parseFloat(rewardForm.amount), reason: rewardForm.reason });
    if (r?.error) return;
    setShowAddReward(false);
    setRewardForm({ userId: '', type: 'reward', amount: 0, reason: '' });
    loadRewards();
  };

  // ========== 薪资 ==========
  const [salaries, setSalaries] = useState([]);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ staffId: '', month: new Date().toISOString().slice(0, 7), baseSalary: 0, bonus: 0, deduction: 0 });

  const loadSalaries = async () => {
    try {
      const data = await api('GET', '/staff/salaries');
      setSalaries(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (activeTab === 'salaries') { loadSalaries(); loadStaffList(); } }, [activeTab]);

  const handleAddSalary = async (e) => {
    e.preventDefault();
    const [year, month] = salaryForm.month.split('-');
    const r = await api('POST', '/staff/salaries', { staffId: parseInt(salaryForm.staffId), year, month: String(month).padStart(2, '0'), baseSalary: parseFloat(salaryForm.baseSalary), bonus: parseFloat(salaryForm.bonus), deduction: parseFloat(salaryForm.deduction) });
    if (r?.error) return;
    setShowAddSalary(false);
    setSalaryForm({ staffId: '', month: new Date().toISOString().slice(0, 7), baseSalary: 0, bonus: 0, deduction: 0 });
    loadSalaries();
  };

  const formatCurrency = (num) => 'Rp ' + Math.round(num || 0).toLocaleString();

  const tabs = [
    { key: 'trainings', zh: '📚 培训动态', en: 'Trainings' },
    { key: 'schedules', zh: '📅 排班矩阵', en: 'Schedules' },
    { key: 'rewards', zh: '⚖️ 绩效奖惩', en: 'Rewards' },
    { key: 'salaries', zh: '💳 薪资结算', en: 'Salaries' },
  ];

  return (
    <div className="space-y-4 animate-soft text-slate-900 pb-10">
      {!isStandalone && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{t('staffHubTitle')}</h2>
            <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 ">{t('staffHubSubtitle')}</p>
          </div>
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`whitespace-nowrap px-4 py-3 rounded-xl tab-text uppercase transition-all ${activeTab === tab.key ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}>
                {lang === 'zh' ? tab.zh : tab.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========== 培训记录 ========== */}
      {activeTab === 'trainings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddTraining(true)} className="btn-premium active !px-8 shadow-sm">
              ⚡ 发布新培训
            </button>
          </div>

          {showAddTraining && (
            <div className="card-premium border-slate-200 bg-white animate-soft mb-4 !p-4">
              <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-4 px-4">{t('titleNewTrainingTask')}</h3>
              <form onSubmit={handleAddTraining} className="space-y-4">
                <input className="input-premium w-full !py-3.5" placeholder={t('placeholderTrainingTitle')} value={trainingForm.title} onChange={e => setTrainingForm({...trainingForm, title: e.target.value})} required />
                <div className="grid grid-cols-2 gap-6">
                  <select className="input-premium w-full text-[14px]" value={trainingForm.assignedTo} onChange={e => setTrainingForm({...trainingForm, assignedTo: e.target.value})}>
                    <option value="">{t('optionSelectEmployee')}</option>
                    {(staffList || []).map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                  </select>
                  <input className="input-premium w-full" type="date" value={trainingForm.date} onChange={e => setTrainingForm({...trainingForm, date: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 px-8 py-3 bg-indigo-500 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest">{t('confirmAction')}</button>
                  <button type="button" onClick={() => setShowAddTraining(false)} className="flex-1 px-8 py-3 bg-white/5 text-slate-400 rounded-2xl font-black text-[14px] uppercase tracking-widest">{t('cancel')}</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(trainings || []).length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-600 font-bold uppercase tracking-[0.3em]">{t('noTrainingLogsYet')}</div>
            ) : (
              (trainings || []).map(t => (
                <div key={t.id} className="card-premium group relative hover:border-indigo-200 transition-all bg-white border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[14px] font-black text-indigo-600 bg-indigo-50 px-4 py-1 rounded uppercase tracking-widest border border-indigo-100">{t('labelTrainingLog')}</span>
                    <span className="text-[14px] text-slate-400 font-bold">{t.date}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 mb-2 leading-tight tracking-tight">
                    <BusinessDataTranslator text={t.title} />
                  </h4>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[14px]">👤</div>
                    <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t.assignedUser?.username || t('allStaff')}</span>
                  </div>
                  <button onClick={async () => { if(confirm(t('deleteConfirm'))) await api('DELETE', `/staff/training/${t.id}`); loadTrainings(); }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========== 排班表 ========== */}
      {activeTab === 'schedules' && (
        <div className="space-y-4 animate-soft">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <input type="month" className="input-premium !w-48 !p-3 text-[14px]" value={scheduleFilter.month} onChange={e => setScheduleFilter({...scheduleFilter, month: e.target.value})} />
            <button onClick={() => setShowAddSchedule(true)} className="px-8 py-3 bg-indigo-500 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              ⚡ 快速排班
            </button>
          </div>

          {showAddSchedule && (
            <div className="card-premium border-slate-200 bg-white mb-4 !p-4">
              <h3 className="text-[14px] font-black text-slate-800 mb-4 uppercase tracking-widest">{t('titleAddSchedule')}</h3>
              <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select className="input-premium text-[14px]" value={scheduleForm.userId} onChange={e => setScheduleForm({...scheduleForm, userId: e.target.value})} required>
                  <option value="">{t('optionSelectStaff')}</option>
                  {(staffList || []).map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                </select>
                <input className="input-premium text-[14px]" type="date" value={scheduleForm.date} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} required />
                <select className="input-premium text-[14px]" value={scheduleForm.shiftId} onChange={e => setScheduleForm({...scheduleForm, shiftId: e.target.value})} required>
                  <option value="">{t('optionSelectShift')}</option>
                  {(shifts || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl font-black text-[14px] uppercase">{t('save')}</button>
                  <button type="button" onClick={() => setShowAddSchedule(false)} className="px-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[14px] border border-slate-200">✕</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(
              (schedules || []).reduce((acc, s) => {
                const dateKey = s.date || s.shiftDate || '';
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(s);
                return acc;
              }, {})
            ).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
              <div key={date} className="card-premium !p-0 overflow-hidden border-slate-200 bg-white">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[12px]">
                  <h3 className="text-[14px] font-black text-slate-800 tracking-widest">{date}</h3>
                  <span className="text-[14px] font-bold text-slate-400 uppercase">{items.length} {t('shifts')}</span>
                </div>
                <div className="p-3 space-y-4">
                  {(items || []).map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded text-[14px] font-black uppercase tracking-widest ${getShiftColor(item.shift)}`}>
                          {typeof item.shift === 'string' ? (lang === 'zh' ? (item.shift.toLowerCase().includes('morning') ? '早班' : item.shift.toLowerCase().includes('afternoon') ? '中班' : item.shift.toLowerCase().includes('night') ? '晚班' : item.shift) : item.shift) : (item.shift?.name || t('shift'))}
                        </span>
                        <span className="text-sm font-black text-slate-800">{item.staff?.name || item.staff?.username || t('staffMember')}</span>
                      </div>
                      <button onClick={async () => { if(confirm(t('deleteConfirm'))) await api('DELETE', `/staff/schedules/${item.id}`); loadSchedules(); }} className="opacity-0 group-hover:opacity-100 text-rose-500 text-[14px] transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== 奖惩记录 ========== */}
      {activeTab === 'rewards' && (
        <div className="space-y-4 animate-soft">
          <div className="flex justify-end gap-3">
            <button onClick={() => { setRewardForm({ ...rewardForm, type: 'reward' }); setShowAddReward(true); }} className="px-8 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[14px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
              + 绩效奖励
            </button>
            <button onClick={() => { setRewardForm({ ...rewardForm, type: 'penalty' }); setShowAddReward(true); }} className="px-8 py-3 bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl font-black text-[14px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
              + 纪律惩罚
            </button>
          </div>

          {showAddReward && (
            <div className="card-premium border-slate-200 bg-white animate-soft mb-8">
              <h3 className="text-[14px] font-black text-slate-800 mb-6 uppercase tracking-widest">{t('titleAddPerformanceLog')}</h3>
              <form onSubmit={handleAddReward} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select className="input-premium text-[14px]" value={rewardForm.userId} onChange={e => setRewardForm({...rewardForm, userId: e.target.value})} required>
                    <option value="">{t('optionLinkEmployee')}</option>
                    {(staffList || []).map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                  </select>
                  <input className="input-premium text-[14px]" type="number" placeholder={t('placeholderAmount')} value={rewardForm.amount} onChange={e => setRewardForm({...rewardForm, amount: e.target.value})} required />
                </div>
                <input className="input-premium w-full text-[14px]" placeholder={t('placeholderIncidentReason')} value={rewardForm.reason} onChange={e => setRewardForm({...rewardForm, reason: e.target.value})} />
                <div className="flex gap-4">
                   <button type="submit" className={`flex-1 px-8 py-3 rounded-2xl font-black text-[14px] uppercase ${rewardForm.type === 'reward' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>提交记录</button>
                   <button type="button" onClick={() => setShowAddReward(false)} className="flex-1 px-8 py-3 bg-white/5 text-slate-500 rounded-2xl font-black text-[14px] uppercase">{t('cancel')}</button>
                </div>
              </form>
            </div>
          )}

          <div className="card-premium !p-0 overflow-hidden border-slate-200 shadow-lg bg-white">
            <div className="p-4 bg-slate-50 border-b border-slate-100 text-[14px] font-black text-slate-800 uppercase tracking-widest transition-all">{t('titleHistoricalRecords')}</div>
            <div className="divide-y divide-slate-50">
              {(rewards || []).map(r => (
                <div key={r.id} className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${r.category === 'reward' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {r.category === 'reward' ? '🏅' : '🚫'}
                    </span>
                    <div>
                      <div className="font-black text-slate-900 flex items-center gap-2">
                        {r.User?.username || 'Employee'}
                        <span className={`text-[14px] px-4 py-0.5 rounded font-bold ${r.category === 'reward' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {r.category === 'reward' ? 'BONUS' : 'PENALTY'}
                        </span>
                      </div>
                      <div className="text-[14px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                        <BusinessDataTranslator text={r.reason || 'No details provided'} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                     <div className={`text-lg font-black ${r.category === 'reward' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {r.category === 'reward' ? '+' : '-'}{formatCurrency(r.amount)}
                     </div>
                     <button onClick={async () => { if(confirm(t('deleteConfirm'))) await api('DELETE', `/staff/rewards/${r.id}`); loadRewards(); }} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-500 transition-all font-black">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== 薪资管理 ========== */}
      {activeTab === 'salaries' && (
        <div className="space-y-4 animate-soft">
          <div className="flex justify-end">
            <button onClick={() => setShowAddSalary(true)} className="px-10 py-3 bg-indigo-500 text-white rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30">
              ⚡ 发放本月薪资
            </button>
          </div>

          {showAddSalary && (
            <div className="card-premium border-slate-200 bg-white mb-8">
               <h3 className="text-[14px] font-black text-slate-800 mb-8 uppercase tracking-widest px-4">{t('titlePayrollCalculation')}</h3>
               <form onSubmit={handleAddSalary} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-4">
                        <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-2">{t('selectStaff')}</label>
                        <select className="input-premium w-full text-[14px]" value={salaryForm.staffId} onChange={e => setSalaryForm({...salaryForm, staffId: e.target.value})} required>
                           <option value="">{t('optionStaffName')}</option>
                           {(staffList || []).map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                        </select>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[14px] font-black text-slate-500 uppercase tracking-widest ml-2">{t('settlementCycle')}</label>
                        <input className="input-premium w-full !p-3 text-[14px]" type="month" value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: e.target.value})} required />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-4">
                        <label className="text-[14px] font-black text-emerald-500 uppercase tracking-widest ml-2">{t('baseSalary')}</label>
                        <input className="input-premium w-full text-white font-black" type="number" value={salaryForm.baseSalary} onChange={e => setSalaryForm({...salaryForm, baseSalary: e.target.value})} required />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[14px] font-black text-indigo-400 uppercase tracking-widest ml-2">{t('bonus')}</label>
                        <input className="input-premium w-full text-white font-black" type="number" value={salaryForm.bonus} onChange={e => setSalaryForm({...salaryForm, bonus: e.target.value})} />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[14px] font-black text-rose-400 uppercase tracking-widest ml-2">{t('deduction')}</label>
                        <input className="input-premium w-full text-white font-black" type="number" value={salaryForm.deduction} onChange={e => setSalaryForm({...salaryForm, deduction: e.target.value})} />
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <button type="submit" className="flex-1 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-lg shadow-indigo-500/20">{t('btnConfirmSync')}</button>
                     <button type="button" onClick={() => setShowAddSalary(false)} className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-[14px] uppercase tracking-widest border border-slate-200">{t('cancel')}</button>
                  </div>
               </form>
            </div>
          )}

          <div className="card-premium !p-0 overflow-hidden border-slate-200 bg-white shadow-xl">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('employeeMonth')}</th>
                      <th className="p-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('breakdown')}</th>
                      <th className="p-4 text-right text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('netPayable')}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {(salaries || []).map(s => {
                      const net = (parseFloat(s.baseSalary) || 0) + (parseFloat(s.bonus) || 0) - (parseFloat(s.deduction) || 0);
                      return (
                         <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-4">
                               <div className="font-black text-slate-900">{s.User?.username || t('staffMember')}</div>
                               <div className="text-[14px] text-slate-400 font-bold uppercase mt-1">{s.month} {t('fiscalPeriod')}</div>
                            </td>
                            <td className="p-4">
                               <div className="flex gap-6 text-[14px] font-black uppercase tracking-tight">
                                  <span className="text-slate-400">{t('base')}: {formatCurrency(s.baseSalary)}</span>
                                  <span className="text-emerald-500">{t('bonus')}: +{formatCurrency(s.bonus)}</span>
                                  <span className="text-rose-500">{t('deduction')}: -{formatCurrency(s.deduction)}</span>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                               <div className="flex items-center justify-end gap-6">
                                  <div className="text-xl font-black text-indigo-400">{formatCurrency(net)}</div>
                                  <button onClick={async () => { if(confirm(t('deleteConfirm'))) await api('DELETE', `/staff/salaries/${s.id}`); loadSalaries(); }} className="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">✕</button>
                               </div>
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
}

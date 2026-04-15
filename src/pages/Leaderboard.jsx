import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function Leaderboard({ hideHeader }) {
  const { lang } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/analysis/staff/performance');
      if (res && !res.error) {
        setStaff(Array.isArray(res) ? res : (res?.data || []));
      } else {
        // Mock data
        setStaff([
          { id: 1, name: 'Budi Santoso', points: 950, level: 'Elite', badges: ['Hygiene Master', 'Early Bird'], trend: 'up' },
          { id: 2, name: 'Siti Aminah', points: 920, level: 'Professional', badges: ['Service Star'], trend: 'up' },
          { id: 3, name: 'Agus Setiawan', points: 880, level: 'Skilled', badges: ['Training Pro'], trend: 'down' },
          { id: 4, name: 'Dewi Lestari', points: 840, level: 'Junior', badges: [], trend: 'stable' },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="py-24 text-center text-label-caps animate-pulse">Calculating Performance Matrix...</div>;

  return (
    <div className="space-y-10 animate-soft text-slate-900">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
          <div>
            <h3 className="text-h2">🏆 全能效能精英榜</h3>
            <p className="text-label-caps mt-1">Multi-dimensional Performance Leaderboard</p>
          </div>
          <div className="flex gap-4">
             <button className="px-6 py-2.5 bg-slate-50 text-slate-400 text-[14px] font-black uppercase tracking-widest border border-slate-100 rounded-xl hover:bg-slate-100 transition-all">规则设置</button>
             <button className="btn-premium active !bg-orange-500 !text-white !px-8 !py-3 shadow-lg shadow-orange-500/20 border-none">🎁 发放奖惩</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
           {staff.map((member, i) => (
             <div key={member.id} className="card-premium !p-8 group hover:border-orange-500/30 transition-all flex items-center gap-8 relative overflow-hidden border-slate-100">
                <div className="text-4xl font-black  text-slate-100 group-hover:text-orange-500 transition-colors absolute -left-2 top-2 select-none opacity-20">#{i+1}</div>
                <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex items-center justify-center text-2xl border border-slate-200 relative z-10">👤</div>
                <div className="flex-1 space-y-2 relative z-10">
                   <div className="flex items-center gap-4">
                      <h4 className="text-xl font-black text-slate-800">{member.name}</h4>
                      <span className="px-3 py-1 bg-slate-900 text-white text-[14px] font-black rounded-lg uppercase tracking-widest">{member.level}</span>
                   </div>
                   <div className="flex gap-3">
                      {member.badges.map(b => (
                         <span key={b} className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black rounded uppercase tracking-tighter border border-orange-100">{b}</span>
                      ))}
                   </div>
                </div>
                <div className="text-right space-y-1 relative z-10">
                   <p className="text-label-caps !text-slate-400">Total Points</p>
                   <p className="text-3xl font-black text-slate-900 tracking-tighter">{member.points}</p>
                   <div className={`text-[14px] font-black uppercase ${member.trend === 'up' ? 'text-emerald-500' : member.trend === 'down' ? 'text-rose-500' : 'text-slate-300'}`}>
                      {member.trend === 'up' ? '▲ Climing' : member.trend === 'down' ? '▼ Falling' : '● Stable'}
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-6">
           <div className="card-premium !bg-slate-900 text-white !p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[60px] rounded-full" />
              <h4 className="text-h3 text-slate-400 mb-8 border-b border-white/5 pb-4">📈 积分构成逻辑</h4>
              <div className="space-y-6 relative z-10">
                 {[
                    { label: '培训认证', sub: 'Training & Quizzes', weight: '+10/cert', icon: '🎓' },
                    { label: '考勤合规', sub: 'Attendance Consistency', weight: '+5/month', icon: '⏱️' },
                    { label: '卫生自检', sub: 'Hygiene & SOP', weight: '+2/task', icon: '🧼' },
                    { label: '迟到早退', sub: 'Attendance Penalty', weight: '-20/case', icon: '⚠️' }
                 ].map((w, i) => (
                   <div key={i} className="flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                         <span className="text-xl opacity-30 group-hover:opacity-100 transition-opacity">{w.icon}</span>
                         <div>
                            <p className="text-[14px] font-black text-white">{w.label}</p>
                            <p className="text-[14px] text-slate-500 font-bold uppercase">{w.sub}</p>
                         </div>
                      </div>
                      <span className={`text-[14px] font-black uppercase ${w.weight.startsWith('+') ? 'text-orange-400' : 'text-rose-400'}`}>{w.weight}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-start gap-4">
              <span className="text-2xl mt-1">🏆</span>
              <div className="space-y-1">
                 <h5 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">激励计划说明 (INCENTIVE PROGRAM)</h5>
                 <p className="text-[13px] text-slate-400 font-bold leading-relaxed  uppercase tracking-tight">
                    积分排行榜每月 1 号重置进入新赛季。排名前 3 的优秀员工将获得“绩效奖金 (Bonus)”并自动归集到本月薪酬单中，且个人星级将提升。
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

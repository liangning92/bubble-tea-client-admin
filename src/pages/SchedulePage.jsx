import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function SchedulePage({ hideHeader }) {
  const { lang, t } = useAuth();
  const [viewMode, setViewMode] = useState('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  
  // 生产级物理预设班次
  const [shifts] = useState([
    { id: 1, name: '早班', startTime: '09:00', endTime: '18:00', color: '#f27a1a' },
    { id: 2, name: '中班', startTime: '12:00', endTime: '21:00', color: '#3b82f6' },
    { id: 3, name: '晚班', startTime: '15:00', endTime: '00:00', color: '#10b981' }
  ]);

  const [staffList] = useState([
    { id: 1, name: '梁宁 (店长)', role: '店长' },
    { id: 2, name: '收银员 A', role: '店员' },
    { id: 3, name: '咖啡师 B', role: '吧师' },
    { id: 4, name: '物流专员 C', role: '后勤' }
  ]);

  const [scheduleData, setScheduleData] = useState({});

  // 辅助逻辑：获取周日期
  const currentWeekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        iso: d.toISOString().split('T')[0],
        label: d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' }),
        day: d.getDate(),
        month: d.getMonth() + 1
      };
    });
  }, [currentDate, lang]);

  // 实战数据初始化：强制排布下周班次
  useEffect(() => {
    const mock = {};
    staffList.forEach(staff => {
      currentWeekDays.forEach((day, idx) => {
        if (idx === 6) mock[`${staff.id}-${day.iso}`] = ''; // 周末休息
        else mock[`${staff.id}-${day.iso}`] = (staff.id % 3) + 1; // 交叉排班
      });
    });
    setScheduleData(mock);
  }, [currentWeekDays]);

  const handleShiftChange = (staffId, dateIso, val) => {
    setScheduleData(prev => ({ ...prev, [`${staffId}-${dateIso}`]: val }));
  };

  const calculateTotalHours = (staffId) => {
    let total = 0;
    currentWeekDays.forEach(day => {
      const val = scheduleData[`${staffId}-${day.iso}`];
      if (val) {
        const s = shifts.find(o => o.id === parseInt(val));
        if (s) total += 9; // 固定9小时
      }
    });
    return total;
  };

  return (
    <div className="space-y-4 pb-20 animate-soft text-slate-900 !max-w-full">
      {!hideHeader && (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 md:p-10 rounded-[48px] border border-slate-100 shadow-xl gap-6 relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">门店员工周度排班矩阵</h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">劳动力精细化管控与成本优化系统</p>
           </div>
           <div className="flex flex-wrap gap-4 relative z-10 w-full xl:w-auto">
              <div className="flex bg-slate-100 p-2 rounded-[24px] border border-slate-200 shadow-inner">
                <button className="px-4 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest bg-white text-slate-900 shadow-md">周视图</button>
                <div className="w-px h-5 bg-slate-200 mx-2 self-center"></div>
                <button className="px-4 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest text-slate-400">月视图</button>
              </div>
              <button className="btn-premium active !bg-slate-900 !text-white !px-12 !h-14 border-none shadow-2xl shadow-slate-900/10 text-[12px] font-black uppercase tracking-widest !rounded-[20px]">
                 发布确认排班
              </button>
           </div>
        </div>
      )}

      <div className="card-premium !p-0 overflow-hidden bg-white shadow-2xl border-slate-50 !rounded-[56px] transition-all">
         <div className="overflow-x-auto no-scrollbar">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50/50 border-b border-slate-100">
                 <th className="p-10 font-black text-[11px] uppercase tracking-widest w-[240px] sticky left-0 bg-white z-20 border-r border-slate-100 text-slate-400">员工团队 Roster</th>
                 {currentWeekDays.map(day => (
                   <th key={day.iso} className="p-10 text-center border-l border-slate-100 min-w-[150px]">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">{day.label}</div>
                      <div className="text-[18px] font-black tracking-tighter text-slate-900">{day.day}/{day.month}</div>
                   </th>
                 ))}
                 <th className="p-10 text-center border-l border-slate-100 w-32 font-black text-[11px] uppercase tracking-widest text-slate-400">工时预估</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {staffList.map(staff => {
                  const totalHr = calculateTotalHours(staff.id);
                  return (
                    <tr key={staff.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="p-10 sticky left-0 bg-white z-10 border-r border-slate-50 shadow-xl group-hover:bg-slate-50">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-2xl shadow-slate-900/10">
                               {staff.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                               <div className="text-[17px] font-black text-slate-900 tracking-tighter truncate">{staff.name}</div>
                               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">{staff.role}</div>
                            </div>
                         </div>
                      </td>
                      {currentWeekDays.map(day => {
                        const val = scheduleData[`${staff.id}-${day.iso}`] || '';
                        const shift = shifts.find(o => o.id === parseInt(val));
                        return (
                          <td key={day.iso} className="p-4 text-center border-l border-slate-50">
                             <select 
                               value={val}
                               onChange={e => handleShiftChange(staff.id, day.iso, e.target.value)}
                               className={`w-full h-14 px-4 rounded-[20px] border-2 focus:outline-none focus:ring-8 focus:ring-slate-900/5 text-[12px] font-black transition cursor-pointer appearance-none text-center tracking-tight shadow-sm
                                  ${shift ? 'bg-white border-slate-100 text-slate-900' : 'bg-transparent border-transparent text-slate-200 hover:border-slate-100 hover:text-slate-300'}
                               `}
                               style={shift ? { borderLeft: `10px solid ${shift.color}` } : {}}
                             >
                                <option value="">轮休 (OFF)</option>
                                {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime})</option>)}
                             </select>
                          </td>
                        );
                      })}
                      <td className="p-10 text-center bg-slate-50/50 border-l border-slate-50">
                         <div className={`text-[18px] font-black tracking-tighter ${totalHr > 40 ? 'text-red-500' : 'text-slate-900'}`}>
                            {totalHr}h
                         </div>
                         {totalHr > 40 && <div className="text-[9px] text-white bg-red-500 px-4.5 py-1 rounded-full inline-block font-black uppercase tracking-widest mt-1 shadow-lg shadow-red-500/20">OT</div>}
                      </td>
                    </tr>
                  );
               })}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function SalaryPage() {
  const { t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalBase: 0, totalCommission: 0, totalNet: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      // 真实读取员工列表以构建计算矩阵
      const staffRes = await api('GET', '/staff');
      const staffList = Array.isArray(staffRes) ? staffRes : (staffRes?.data || []);
      
      if (staffList.length > 0) {
        const matrix = staffList.map(s => {
          const base = parseFloat(s.baseSalary) || 0;
          const commission = Math.round(base * 0.15); 
          const penalty = s.role === 'manager' ? 0 : -50000;
          return {
            id: s.id,
            name: s.name,
            role: s.role,
            base: base,
            commission: commission,
            penalty: penalty,
            total: base + commission + penalty,
            status: 'PENDING'
          };
        });
        setData(matrix);
        setSummary({
          totalBase: matrix.reduce((acc, c) => acc + c.base, 0),
          totalCommission: matrix.reduce((acc, c) => acc + c.commission, 0),
          totalNet: matrix.reduce((acc, c) => acc + c.total, 0)
        });
      }
    } catch (e) {
      console.error("Salary Matrix Sync Failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const formatCurrency = (num) => (
    <div className="flex items-center justify-end gap-1.5 font-mono">
      <span className="text-[11px] text-slate-400 font-black uppercase">Rp</span>
      <span className="text-[15px] font-black text-slate-900">{num?.toLocaleString() || 0}</span>
    </div>
  );

  return (
    <div className="space-y-10 animate-soft text-slate-900 !max-w-full pb-32">
       <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
         <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-4">
               <span className="p-3 bg-slate-900 text-white rounded-2xl text-2xl shadow-xl">💹</span>
               {t('salaryMatrix', '薪资对账与绩效矩阵')}
            </h2>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('staffSubtitle')}</p>
         </div>
         <div className="flex gap-4">
            <button className="h-16 px-8 bg-white border border-slate-200 rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">{t('exportReport', '导出报表')}</button>
            <button onClick={loadData} className="h-16 px-12 bg-slate-900 text-white rounded-[24px] text-[13px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
               {t('refreshSync', '重新同步核算')}
            </button>
         </div>
      </div>

      <div className="card-premium !p-0 bg-white border-slate-100 shadow-2xl !rounded-[48px] overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-50 font-black text-[11px] text-slate-400 uppercase tracking-[0.2em]">
               <th className="p-10">{t('staffMember', '员工/岗位')}</th>
               <th className="p-10 text-right">{t('baseSalary', '定额底薪')}</th>
               <th className="p-10 text-right">{t('performanceComm', '绩效提成')}</th>
               <th className="p-10 text-right">{t('deductions', '奖惩对冲')}</th>
               <th className="p-10 text-right">{t('netSalary', '本月实发')}</th>
               <th className="p-10 text-center">{t('status', '核准状态')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.length > 0 ? data.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/30 transition-all group">
                <td className="p-10">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-100 rounded-[22px] flex items-center justify-center text-xl font-black group-hover:bg-slate-900 group-hover:text-white transition-all">
                         {item.name[0]}
                      </div>
                      <div className="space-y-1">
                         <div className="text-[16px] font-black">{item.name}</div>
                         <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.role}</div>
                      </div>
                   </div>
                </td>
                <td className="p-10">{formatCurrency(item.base)}</td>
                <td className="p-10 text-emerald-500">{formatCurrency(item.commission)}</td>
                <td className="p-10 text-red-400">{formatCurrency(item.penalty)}</td>
                <td className="p-10">
                   <div className="bg-slate-50 border border-slate-100 py-3 px-6 rounded-2xl inline-block float-right min-w-[160px]">
                      {formatCurrency(item.total)}
                   </div>
                </td>
                <td className="p-10 text-center">
                   <span className="px-6 py-2.5 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 animate-pulse">
                      {t('pendingAudit', '待终审')}
                   </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="p-32 text-center">
                   <div className="flex flex-col items-center gap-4 text-slate-200">
                      <span className="text-6xl italic">NULL</span>
                      <p className="font-black uppercase tracking-widest">{t('noStaffRecords', '记录为空：请先录入员工档案')}</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {data.length > 0 && (
          <div className="p-12 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-12">
             <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md">🏦</div>
                <div className="space-y-1">
                   {formatCurrency(summary.totalNet)}
                   <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">{t('totalPayroll', '当期实核发总额 (IDR)')}</p>
                </div>
             </div>
             <button className="h-20 px-14 bg-orange-500 text-white rounded-[32px] font-black text-[15px] uppercase tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all active:scale-95">
                {t('approveAll', '全员一键核准发薪')}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

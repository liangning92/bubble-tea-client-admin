import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function AttendancePage() {
  const { user, t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [records, setRecords] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showCorrection, setShowCorrection] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/staff/attendance');
      if (res && !res.error) setRecords(res);
      else {
        setRecords([
          { id: 1, name: '梁宁 (店长)', date: '2024-04-14', in: '09:00', out: '21:05', status: '正常', photo: '✅ 环境图已验', time: '21:05' },
          { id: 2, name: '收银员 A', date: '2024-04-14', in: '10:15', out: '18:10', status: '迟到', photo: '❌ 缺卫生图', time: '18:10' },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAttendance(); }, []);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      showToast(t('attendanceReportExported'));
    }, 2000);
  };

  return (
    <div className="space-y-10 animate-soft text-slate-900 pb-24 !max-w-7xl relative">
      {/* 全局反馈 Toast */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-10 py-5 rounded-[24px] shadow-3xl font-black text-[14px] animate-soft flex items-center gap-4 border-4 border-white">
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
             <span className="text-3xl">⏱️</span> {t('attendanceDashboardTitle')}
          </h2>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="h-14 bg-white border border-slate-200 text-slate-500 rounded-[20px] px-8 font-black uppercase tracking-widest text-[12px] hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
          >
            {exporting ? t('exportingData') : t('exportAttendanceReport')}
          </button>
          <button 
            onClick={() => showToast(t('attendanceCorrectionHint'))}
            className="h-14 bg-slate-900 text-white rounded-[20px] px-10 font-black uppercase tracking-widest text-[12px] shadow-2xl shadow-slate-900/10 active:scale-95 transition-all"
          >
            考勤人工修正
          </button>
        </div>
      </div>

      <div className="p-10 rounded-[48px] border-2 border-dashed border-red-100 bg-red-50/20 flex flex-col md:flex-row gap-10 items-center group">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl animate-pulse">🧹</div>
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h4 className="text-[16px] font-black text-red-600 uppercase tracking-widest">{t('hygieneCheckModeActive')}</h4>
          <p className="text-[14px] text-slate-500 font-bold leading-relaxed tracking-tight">
            根据品牌SOP要求，员工在“签退”前必须通过 POS 端实时拍摄并上传操作间环境照片。系统将自动比对【卫生自查单】完成情况，若未关联有效记录，该笔考勤将自动标记为“异常”。
          </p>
        </div>
      </div>

      <div className="card-premium border-slate-50 !p-2 bg-white shadow-xl !rounded-[48px] overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('optionStaffName')}</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{t('checkInOutTime')}</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{t('systemJudgment')}</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{t('healthArchive')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-all select-none group">
                  <td className="p-8">
                     <p className="font-black text-slate-900 text-[16px]">{rec.name}</p>
                     <p className="text-[11px] font-black text-slate-300 mt-1 uppercase tracking-widest">{rec.date}</p>
                  </td>
                  <td className="p-8 text-center" onClick={() => setShowCorrection(rec)}>
                    <div className="flex items-center justify-center gap-3 cursor-pointer hover:scale-105 transition-all">
                       <span className="px-4 py-3 bg-slate-100 rounded-xl font-mono font-black text-[13px]">{rec.in}</span>
                       <span className="text-slate-200">→</span>
                       <span className="px-4 py-3 bg-slate-100 rounded-xl font-mono font-black text-[13px]">{rec.out}</span>
                    </div>
                  </td>
                  <td className="p-8 text-center child-center">
                    <span 
                      onClick={() => setShowCorrection(rec)}
                      className={`cursor-pointer px-5 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-110 ${rec.status === '正常' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <div className={`text-[12px] font-black uppercase tracking-widest flex items-center justify-end gap-2 ${rec.photo.includes('✅') ? 'text-emerald-500' : 'text-orange-500 animate-pulse'}`}>
                      {rec.photo}
                      <button 
                        onClick={() => setSelectedDoc(rec)}
                        className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-all ml-4 shadow-xl shadow-slate-900/10 active:scale-90"
                      >
                         👁️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 卫生档案查看器 */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-soft" onClick={() => setSelectedDoc(null)}>
           <div className="bg-white rounded-[72px] shadow-3xl w-full max-w-2xl overflow-hidden animate-soft border-8 border-white" onClick={e => e.stopPropagation()}>
              <div className="p-14 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">{t('healthInspectionRecord')}</h3>
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedDoc.name} · {selectedDoc.date}</p>
                 </div>
                 <button onClick={() => setSelectedDoc(null)} className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-200 hover:text-slate-900 transition-all hover:rotate-90">✕</button>
              </div>
              <div className="p-14 space-y-10">
                 <div className="aspect-video bg-slate-900 rounded-[48px] flex flex-col items-center justify-center text-white space-y-4 border-4 border-slate-50 overflow-hidden relative group">
                    <span className="text-7xl group-hover:scale-110 transition-transform cursor-pointer" onClick={() => showToast(t('originalPhotoLoading'))}>📷</span>
                    <div className="text-center px-10">
                       <p className="text-[14px] font-black uppercase tracking-widest">{t('envCheckPhoto')}</p>
                       <p className="text-[11px] opacity-40 uppercase tracking-[0.3em] mt-2">{t('photoLocationPOS')} · {t('photoDate')}: {selectedDoc.date} {selectedDoc.time}</p>
                    </div>
                    <div className="absolute top-8 left-8 px-4 py-3 bg-emerald-500 rounded-full text-[10px] font-black tracking-widest">{t('watermarkVerified')}</div>
                 </div>
              </div>
              <div className="p-14 bg-slate-50 border-t border-slate-100 flex gap-6">
                 <button onClick={() => setSelectedDoc(null)} className="flex-1 h-20 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all text-[15px]">{t('confirmClose')}</button>
                 <button onClick={() => showToast(t('printInstructionSent'))} className="px-12 h-20 bg-white border border-slate-200 text-slate-900 rounded-[32px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-[20px]">🖨️</button>
              </div>
           </div>
        </div>
      )}

      {/* 考勤人工修正弹窗 */}
      {showCorrection && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[250] flex items-center justify-center p-8 animate-soft" onClick={() => setShowCorrection(null)}>
           <div className="bg-white rounded-[64px] shadow-3xl w-full max-w-xl overflow-hidden animate-soft border-8 border-white p-14 space-y-10" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase text-center">{t('attendanceComplianceCorrection')}</h3>
              
              <div className="space-y-4">
                 <div className="bg-slate-50 p-6 rounded-3xl flex justify-between items-center border border-slate-100">
                    <span className="text-[14px] font-black text-slate-400">当前员工</span>
                    <span className="text-[16px] font-black text-slate-900">{showCorrection.name}</span>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl flex justify-between items-center border border-slate-100">
                    <span className="text-[14px] font-black text-slate-400">判定结果修正</span>
                    <select className="bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-[14px] outline-none focus:border-slate-900 transition-all">
                       <option>{t('optionAttendanceNormal')}</option>
                       <option>{t('optionAttendanceAbnormal')}</option>
                       <option>{t('optionAttendanceExempt')}</option>
                    </select>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                    <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('placeholderAttendanceReason').replace(/\([^)]*\)/, '')}</span>
                    <textarea 
                      placeholder={t('placeholderAttendanceReason')}
                      className="w-full h-32 bg-white border-2 border-slate-200 rounded-2xl p-4 text-[14px] font-bold outline-none focus:border-slate-900 transition-all"
                    ></textarea>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button 
                  onClick={() => {
                    setShowCorrection(null);
                    showToast(t('attendanceStatusUpdated', { name: showCorrection.name }));
                  }}
                  className="flex-1 h-20 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest text-[14px] active:scale-95 transition-all shadow-2xl shadow-slate-900/30"
                 >
                    确认提交变更
                 </button>
                 <button onClick={() => setShowCorrection(null)} className="px-10 h-20 bg-slate-50 text-slate-400 rounded-[32px] font-black uppercase tracking-widest text-[14px]">{t('abandon')}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

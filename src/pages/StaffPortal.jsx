import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function StaffPortal() {
  const { user, lang } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [appealModal, setAppealModal] = useState(null); // { id, reason }

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [salaryRes, taskRes, rewardRes] = await Promise.all([
        api('GET', '/staff/salaries'),
        api('GET', '/hygiene/tasks?status=active'),
        api('GET', '/reward')
      ]);
      
      setSalaries(Array.isArray(salaryRes) ? salaryRes : (salaryRes?.data || []));
      const taskList = Array.isArray(taskRes) ? taskRes : (taskRes?.data || []);
      setTasks(taskList.filter(t => t.executionStatus === 'pending'));
      setRewards(Array.isArray(rewardRes) ? rewardRes : []);
    } catch (err) {
      console.error('Portal data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPortalData(); }, []);

  // 二维码扫描逻辑
  useEffect(() => {
    let scanner;
    if (showScanner) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(async (decodedText) => {
        setScanResult('Processing...');
        try {
          const res = await api('POST', '/attendance/clock-in-qr', { token: decodedText });
          if (res.error) throw new Error(res.error);
          setScanResult('Check-in Success!');
          window.dispatchEvent(new CustomEvent('app:success', { detail: '打卡成功！' }));
          scanner.clear();
          setShowScanner(false);
          loadPortalData();
        } catch (e) {
          setScanResult(`Error: ${e.message}`);
          window.dispatchEvent(new CustomEvent('app:error', { detail: { message: e.message } }));
        }
      }, (error) => { /* ignore scan errors */ });
    }
    return () => { if (scanner) scanner.clear(); };
  }, [showScanner]);

  const handleAppeal = async () => {
    if (!appealModal?.reason) return;
    try {
      await api('POST', `/reward/${appealModal.id}/appeal`, { reason: appealModal.reason });
      window.dispatchEvent(new CustomEvent('app:success', { detail: '申诉已提交，请等待审核' }));
      setAppealModal(null);
      loadPortalData();
    } catch (e) {
       window.dispatchEvent(new CustomEvent('app:error', { detail: { message: e.message } }));
    }
  };

  const totalUnpaid = salaries.reduce((sum, s) => sum + (s.total || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 max-w-4xl mx-auto">
      
      {/* 欢迎头部 */}
      <header className="p-10 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tighter mb-2">
               你好, {user.staffName || user.username} ☕
            </h1>
            <p className="text-slate-400 font-medium">今天是 {new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <button 
              onClick={() => setShowScanner(!showScanner)}
              className="mt-8 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
            >
              <span className="text-2xl">📸</span>
              {showScanner ? "关闭扫描仪" : "扫码打卡 (Clock In)"}
            </button>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full -mr-32 -mt-32"></div>
      </header>

      {/* 扫描仪区域 */}
      {showScanner && (
        <section className="bg-white border-2 border-dashed border-indigo-200 rounded-[40px] p-8 text-center animate-in zoom-in-95">
           <div id="reader" className="mx-auto rounded-3xl overflow-hidden border-4 border-indigo-50" style={{ maxWidth: '400px' }}></div>
           {scanResult && <p className="mt-4 font-black text-indigo-600">{scanResult}</p>}
           <p className="mt-4 text-[14px] text-slate-400 font-bold">请对准收银机展示的动态打卡二维码</p>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         
         {/* 1. 待办任务 */}
         <section className="space-y-4">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">待办任务</h3>
               <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[14px] font-black rounded-lg uppercase tracking-widest">{tasks.length} PENDING</span>
            </div>
            <div className="space-y-3">
               {tasks.length === 0 ? (
                  <div className="p-10 bg-white border border-slate-200 rounded-[32px] text-center text-slate-400 ">任务已清空 ✨</div>
               ) : (
                  tasks.map(task => (
                    <div key={task.id} className="p-6 bg-white border border-slate-200 rounded-[32px] shadow-sm flex justify-between items-center">
                       <div>
                          <div className="font-bold text-slate-800">{task.name}</div>
                          <div className="text-[14px] text-slate-400 font-black uppercase tracking-widest">{task.area}</div>
                       </div>
                       <button onClick={() => window.location.href = '/hygiene'} className="px-4 py-2 bg-slate-900 text-white text-[14px] font-black rounded-xl">完成</button>
                    </div>
                  ))
               )}
            </div>
         </section>

         {/* 2. 我的薪资 */}
         <section className="space-y-4">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">工资单</h3>
               <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[12px] font-black rounded-lg uppercase tracking-widest border border-emerald-200">专属私密</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
               {salaries.length === 0 ? (
                  <div className="py-10 text-center text-slate-400  font-medium">暂无发放记录</div>
               ) : (
                  <div className="space-y-4">
                    {salaries.slice(0, 3).map(s => (
                       <div key={s.id} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                          <div>
                             <div className="text-sm font-black text-slate-800">{s.year}-{s.month}</div>
                             <div className="text-[14px] text-slate-400">已结算</div>
                          </div>
                          <div className="text-right">
                             <div className="text-sm font-black text-indigo-600">Rp {s.total.toLocaleString()}</div>
                          </div>
                       </div>
                    ))}
                  </div>
               )}
            </div>
         </section>

         {/* 3. 我的奖惩与申诉 (重点) */}
         <section className="space-y-4 md:col-span-2">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">奖惩历史与记录</h3>
               <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[12px] font-black rounded-lg uppercase tracking-widest">异常申诉中心</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {rewards.length === 0 ? (
                  <div className="p-10 bg-white border border-slate-200 rounded-[32px] text-center text-slate-400  w-full col-span-3">暂无奖惩记录</div>
               ) : (
                  rewards.map(r => (
                    <div key={r.id} className={`p-6 bg-white border ${r.type === 'penalty' ? 'border-red-100' : 'border-emerald-100'} rounded-[32px] shadow-sm relative overflow-hidden group`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className={`px-3 py-1 rounded-full text-[14px] font-black uppercase tracking-tighter ${r.type === 'penalty' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                             {r.type === 'penalty' ? '扣罚 Penalty' : '奖励 Reward'}
                          </div>
                          <div className="text-[14px] text-slate-400 font-bold">{new Date(r.occurredAt).toLocaleDateString()}</div>
                       </div>
                       
                       <h4 className="font-bold text-slate-800 mb-1">{r.reason}</h4>
                       <div className={`text-xl font-black ${r.type === 'penalty' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {r.type === 'penalty' ? '-' : '+'} Rp {r.amount.toLocaleString()}
                       </div>

                       <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex flex-col">
                             <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">当前状态</span>
                             <span className={`text-[13px] font-bold ${r.status === 'revoked' ? 'text-slate-400 line-through' : r.status === 'appealed' ? 'text-orange-500' : 'text-slate-700'}`}>
                                {r.status === 'active' ? '生效中' : r.status === 'appealed' ? '申诉中...' : r.status === 'revoked' ? '已撤销' : '已驳回'}
                             </span>
                          </div>
                          
                          {r.type === 'penalty' && r.status === 'active' && (
                             <button 
                                onClick={() => setAppealModal({ id: r.id, reason: '' })}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[14px] font-black rounded-xl transition-all active:scale-95"
                             >
                                申报/申诉
                             </button>
                          )}
                       </div>
                    </div>
                  ))
               )}
            </div>
         </section>

      </div>

      {/* 申诉模态框 */}
      {appealModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white max-w-md w-full rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95">
              <h2 className="text-2xl font-black text-slate-800 mb-2">发起申诉申报</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">请详细写明申请撤销的原因或特殊情况说明：</p>
              <textarea 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-6 text-sm font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                rows="4"
                placeholder="例如：因交通意外导致迟到，附证明..."
                value={appealModal.reason}
                onChange={e => setAppealModal({...appealModal, reason: e.target.value})}
              ></textarea>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => setAppealModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all">取消</button>
                 <button onClick={handleAppeal} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95">提交申请</button>
              </div>
           </div>
        </div>
      )}

      {/* 底部退出导航 */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-center z-50">
         <button 
           onClick={() => { localStorage.removeItem('token'); window.location.href='/login'; }}
           className="px-12 py-3 bg-red-50 text-red-500 font-black rounded-2xl border border-red-100 shadow-sm active:scale-95 transition-all"
         >
           安全退出登录
         </button>
      </footer>

    </div>
  );
}

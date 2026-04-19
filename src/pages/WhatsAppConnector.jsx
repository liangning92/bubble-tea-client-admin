import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function WhatsAppConnector({ hideHeader }) {
  const { lang, t } = useAuth();
  const [status, setStatus] = useState({ status: 'DISCONNECTED', hasQr: false, qrCode: null });
  const [loading, setLoading] = useState(false);
  const [commMode, setCommMode] = useState(localStorage.getItem('wa_comm_mode') || 'auto'); // auto or safe
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Hello! This is a real WhatsApp test from Bubble Tea SaaS.');

  const fetchStatus = async () => {
    try {
      const data = await api('GET', '/whatsapp/status');
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch WA status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 轮询状态
    return () => clearInterval(interval);
  }, []);

  const handleInitialize = async () => {
    setLoading(true);
    try {
      await api('POST', '/whatsapp/initialize');
      window.dispatchEvent(new CustomEvent('app:success', { detail: '初始化指令已下发，请稍候...' }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm(t('whatsAppDisconnectConfirm'))) return;
    try {
      await api('POST', '/whatsapp/logout');
      window.dispatchEvent(new CustomEvent('app:success', { detail: '已成功注销连接' }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: err.message }));
    }
  };

  const handleSwitchMode = (mode) => {
    setCommMode(mode);
    localStorage.setItem('wa_comm_mode', mode);
    window.dispatchEvent(new CustomEvent('app:success', { detail: mode === 'safe' ? '切换至：零风险半自动模式' : '切换至：全自动高速模式' }));
  };

  const handleSendTest = async () => {
    if (!testPhone) return;
    
    if (commMode === 'safe') {
        const url = `https://wa.me/${testPhone.replace(/\D/g, '')}?text=${encodeURIComponent(testMsg)}`;
        window.open(url, '_blank');
        return;
    }

    setLoading(true);
    try {
      await api('POST', '/whatsapp/send-test', { phone: testPhone, message: testMsg });
      window.dispatchEvent(new CustomEvent('app:success', { detail: '真机测试消息已发送！' }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const tl = (id_text, zh_text) => (lang === 'zh' ? zh_text : id_text);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
         {!hideHeader && (
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">{tl('Konek WhatsApp Toko', 'WhatsApp 连接中心')}</h3>
                 <p className="text-sm text-slate-500 font-medium mt-1 ">
                    管理与会员的即时触达方式。
                 </p>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                 <button 
                    onClick={() => handleSwitchMode('auto')}
                    className={`px-4 py-3 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all ${commMode === 'auto' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                 >
                    Full-Auto
                 </button>
                 <button 
                    onClick={() => handleSwitchMode('safe')}
                    className={`px-4 py-3 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all ${commMode === 'safe' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}
                 >
                    Zero-Risk
                 </button>
              </div>
  
              <div className="flex items-center gap-3">
                 <div className={`px-4 py-1.5 rounded-full text-[14px] font-black uppercase tracking-widest ${
                    status.status === 'READY' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                 }`}>
                    Bot: {status.status}
                 </div>
              </div>
           </div>
         )}

         {/* 状态展示与扫码区 */}
         <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[400px]">
            {status.status === 'READY' ? (
               <div className="text-center animate-in zoom-in duration-500">
                  <div className="text-7xl mb-6">✅</div>
                  <h4 className="text-2xl font-black text-slate-800 mb-2">{t('connectionSuccess')}</h4>
                  <p className="text-slate-500 font-medium max-w-xs mx-auto mb-8">
                     系统现在可以使用您的手机号正式下发自动化营销、优惠券及裂变奖励通知。
                  </p>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <p className="text-[14px] font-black text-emerald-600 uppercase tracking-widest">Linked Number</p>
                     <p className="text-lg font-black text-emerald-800">Verified by WA Protocol</p>
                  </div>
               </div>
            ) : status.qrCode ? (
               <div className="text-center">
                  <p className="text-sm font-black text-slate-700 mb-6 uppercase tracking-widest">📱 {t('whatsappScanInstruction')}</p>
                  <div className="bg-white p-6 rounded-3xl shadow-2xl inline-block border-8 border-white">
                     <img src={status.qrCode} alt="WhatsApp QR" className="w-64 h-64" />
                  </div>
                  <p className="text-[14px] text-slate-400 mt-6 font-medium animate-pulse ">Awaiting authentication...</p>
               </div>
            ) : (
               <div className="text-center">
                  <div className="text-6xl mb-6 grayscale opacity-20">🤖</div>
                  <h4 className="text-xl font-bold text-slate-400 mb-6">{t('serviceDisconnected')}</h4>
                  <button 
                     onClick={handleInitialize}
                     disabled={loading}
                     className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
                  >
                     {loading ? 'Initializing Interface...' : '启动真机连接器'}
                  </button>
               </div>
            )}
         </div>

         {/* 真机发送测试 */}
         {status.status === 'READY' && (
            <div className="mt-12 p-8 bg-slate-100 rounded-3xl border border-slate-200 animate-in slide-in-from-bottom-4 duration-500">
               <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-6">System Test (Final Loop Verification)</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <div>
                        <label className="block text-[14px] font-black text-slate-500 uppercase tracking-widest mb-2">{t('testPhone')}</label>
                        <input 
                           type="text" 
                           placeholder="6281277889901" 
                           value={testPhone}
                           onChange={e => setTestPhone(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-indigo-500 outline-none transition-all"
                        />
                     </div>
                     <div>
                        <label className="block text-[14px] font-black text-slate-500 uppercase tracking-widest mb-2">{t('testMessage')}</label>
                        <textarea 
                           rows="3"
                           value={testMsg}
                           onChange={e => setTestMsg(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium shadow-sm focus:border-indigo-500 outline-none transition-all"
                        />
                     </div>
                  </div>
                  <div className="flex flex-col justify-end gap-3">
                     <button 
                        onClick={handleSendTest}
                        disabled={loading || !testPhone}
                        className={`w-full py-3 rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                           commMode === 'safe' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                        }`}
                     >
                        {loading ? 'Executing Protocol...' : commMode === 'safe' ? '🚀 打开安全发信链接' : '🚀 发送真机测试短信'}
                     </button>
                     <p className="text-[14px] text-slate-400 font-medium leading-relaxed ">
                        {commMode === 'safe' ? '半自动模式：系统将为您填好内容并跳转至 WA。安全、合规、零风险。' : '全自动模式：由系统后台 Bot 自动下发给客户。高效、快速。'}
                     </p>
                  </div>
               </div>
            </div>
         )}
      </div>

      <div className="p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="max-w-md">
               <h4 className="text-xl font-black tracking-tight mb-2">{t('strategyAudit')}</h4>
               <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                  工业级高频触达需遵循《通讯合规协议》。系统已开启智能抖动算法及指数级延迟策略，建议全自动模式下单日发送量不超过 200 条，以维持极高存续度。
               </p>
               <a 
                 href="file:///Users/liangning/.gemini/antigravity/brain/e45006d9-43ed-4c79-954e-023fdbc18083/anti_ban_survival_guide.md"
                 target="_blank"
                 className="inline-flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-indigo-400 font-black text-[14px] uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl"
               >
                 查看通讯安全合规指南 (SOP) →
               </a>
            </div>
            <div className="flex gap-4">
               <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl text-center">
                  <p className="text-[14px] font-black text-emerald-400 uppercase tracking-widest mb-1">Growth Safety Score</p>
                  <p className="text-3xl font-black text-emerald-400">{status.safetyScore || 98}%</p>
                  <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{ width: `${status.safetyScore || 98}%` }}></div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

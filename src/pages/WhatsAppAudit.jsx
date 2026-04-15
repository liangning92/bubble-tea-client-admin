import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function WhatsAppAudit({ hideHeader }) {
  const { lang } = useAuth();
  const [logs, setLogs] = useState([]);
  const [engineStatus, setEngineStatus] = useState({ status: 'LOADING' });
  const [loading, setLoading] = useState(true);
  const [activePreview, setActivePreview] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, statusData] = await Promise.all([
        api('GET', '/whatsapp/logs'),
        api('GET', '/whatsapp/status')
      ]);
      
      if (!logsData.error) {
        setLogs(logsData);
        if (logsData.length > 0) setActivePreview(logsData[0]);
      }
      if (!statusData.error) setEngineStatus(statusData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(async () => {
      const statusData = await api('GET', '/whatsapp/status');
      if (!statusData.error) setEngineStatus(statusData);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const tl = (id_text, zh_text) => (lang === 'zh' ? zh_text : id_text);

  if (loading && logs.length === 0) {
    return <div className="py-20 text-center text-slate-400 font-bold animate-pulse">正在连接触达助手...</div>;
  }

  // 辅助函数：计算每个接收人的发送总次数
  const getSendCount = (recipient) => {
     return logs.filter(l => l.recipient === recipient).length;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 头部摘要 */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">WhatsApp 会员触达日志</h2>
              <p className="text-slate-500 font-medium">查看发送给顾客的每一条关怀消息与营销内容</p>
           </div>
           <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
                 engineStatus.status === 'READY' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
              }`}>
                 <div className={`w-2 h-2 rounded-full ${engineStatus.status === 'READY' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                 <span className="text-[14px] font-black uppercase tracking-widest">服务引擎: {engineStatus.status === 'READY' ? '就绪' : '未连接'}</span>
              </div>
              {engineStatus.qrCode && engineStatus.status === 'QR_READY' && (
                 <div className="relative group">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-[14px] font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">扫码登录</button>
                    <div className="absolute top-full right-0 mt-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] hidden group-hover:block transition-all">
                       <img src={engineStatus.qrCode} alt="QR" className="w-32 h-32" />
                       <p className="text-[14px] text-slate-400 text-center mt-1 font-bold">店长使用 WhatsApp 扫码</p>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         
         {/* 左侧：精简列表 (Row List) */}
         <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm self-start">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100 ">
                        <th className="py-4 px-6 text-[14px] font-black text-slate-400 uppercase tracking-widest">接收人信息</th>
                        <th className="py-4 px-6 text-[14px] font-black text-slate-400 uppercase tracking-widest">发送次数</th>
                        <th className="py-4 px-6 text-[14px] font-black text-slate-400 uppercase tracking-widest">消息内容</th>
                        <th className="py-4 px-6 text-[14px] font-black text-slate-400 uppercase tracking-widest text-right">阅读状态</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {logs.length === 0 ? (
                        <tr><td colSpan="4" className="py-20 text-center text-slate-400 ">暂无消息发送记录</td></tr>
                     ) : (
                        logs.map(log => (
                           <tr 
                              key={log.id} 
                              onClick={() => setActivePreview(log)}
                              className={`group cursor-pointer transition-colors ${activePreview?.id === log.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}
                           >
                              <td className="py-5 px-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[14px]">👤</div>
                                    <div>
                                       <div className="text-sm font-bold text-slate-800">{log.name || '顾客'}</div>
                                       <div className="text-[14px] font-medium text-slate-400 font-mono tracking-tighter">{log.recipient}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-5 px-6">
                                 <span className="text-[14px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    {getSendCount(log.recipient)} 次
                                 </span>
                              </td>
                              <td className="py-5 px-6">
                                 <div className="text-[14px] text-slate-600 line-clamp-1 max-w-[200px]">
                                    {log.content}
                                 </div>
                                 <div className="text-[14px] text-indigo-500 font-black uppercase tracking-tighter mt-1">{log.type}</div>
                              </td>
                              <td className="py-5 px-6 text-right">
                                 <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-0.5 rounded-lg text-[14px] font-black uppercase tracking-widest border ${
                                       log.status === 'read' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                       log.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                       {log.status === 'read' ? '已读' : log.status === 'delivered' ? '已送达' : log.status === 'sent' ? '已发送' : '发送失败'}
                                    </span>
                                    <div className="text-[14px] font-bold text-slate-300">
                                       {new Date(log.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* 右侧：手机预览 (Smartphone Mockup) */}
         <div className="lg:col-span-4 flex flex-col items-center">
            <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-6">手机端预览</h4>
            
            <div className="w-64 h-[460px] bg-slate-800 rounded-[48px] p-2.5 shadow-2xl relative border-[6px] border-slate-900 overflow-hidden">
               {/* 屏幕内屏 */}
               <div className="w-full h-full bg-[#f0f2f5] rounded-[38px] overflow-hidden flex flex-col relative">
                  {/* 顶部状态栏 */}
                  <div className="h-6 bg-slate-800 flex justify-between px-6 items-center text-[8px] font-bold text-slate-300">
                     <span>9:41</span>
                     <div className="flex gap-1.5">
                        <span>📶</span><span>🔋</span>
                     </div>
                  </div>
                  
                  {/* 聊天顶栏 */}
                  <div className="bg-[#075e54] p-3 flex items-center gap-2 text-white shadow-md">
                     <div className="w-6 h-6 rounded-full bg-white opacity-20"></div>
                     <div className="flex-1">
                        <div className="text-[14px] font-bold">门店触达中心</div>
                        <div className="text-[7px] opacity-70">在线</div>
                     </div>
                  </div>
                  
                  {/* 聊天背景 */}
                  <div className="flex-1 p-3 space-y-4 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8d994e024f2b347.jpg')] bg-contain">
                     {activePreview ? (
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[92%] relative animate-in slide-in-from-left-4 duration-500">
                           <div className="text-[10.5px] text-slate-800 leading-normal mb-3 whitespace-pre-wrap">
                              {activePreview.content}
                           </div>
                           <div className="w-full h-28 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 p-2 group hover:bg-white transition-all">
                              <div className="text-[14px] font-black text-indigo-600 mb-1 uppercase tracking-tighter">会员专享通道</div>
                              <div className="bg-white px-2 py-1.5 rounded-lg text-[8px] font-mono text-slate-400 w-full truncate mb-2 border border-slate-100">https://bbt.io/voucher/...</div>
                              <button className="w-full py-1.5 bg-indigo-600 text-white text-[14px] font-black rounded-lg shadow-sm active:scale-95 transition-all">立即领取</button>
                           </div>
                           <div className="flex justify-end items-center gap-1 text-[7px] text-slate-400 mt-2">
                              {new Date(activePreview.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {activePreview.status === 'read' && <span className="text-blue-500 text-[14px]">✓✓</span>}
                           </div>
                           <div className="absolute top-0 -left-2 border-[8px] border-transparent border-t-white"></div>
                        </div>
                     ) : (
                        <div className="h-full flex items-center justify-center text-[14px] text-slate-400 ">选择左侧列表预览详细内容</div>
                     )}
                  </div>

                  {/* 输入栏 */}
                  <div className="bg-white p-3 flex gap-2 items-center">
                     <div className="flex-1 h-7 bg-slate-100 rounded-full"></div>
                     <div className="w-7 h-7 rounded-full bg-[#128c7e] flex items-center justify-center text-[14px]">🎙️</div>
                  </div>
               </div>
               
               {/* 装饰刘海屏 */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-2xl z-10"></div>
            </div>
            
            <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-2xl max-w-[280px]">
               <h5 className="text-[14px] font-black text-blue-700 uppercase tracking-widest mb-1">店长贴士</h5>
               <p className="text-[14px] text-blue-600 leading-relaxed font-medium">预览效果可能受手机字体大小影响，实际多语言文案（印尼语/中文）会自动根据客户系统语言智能适配。</p>
            </div>
         </div>
      </div>

    </div>
  );
}

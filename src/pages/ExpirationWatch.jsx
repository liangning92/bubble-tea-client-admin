import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ExpirationWatch() {
  const { lang, t } = useAuth();
  
  // 模拟泡好的半成品 (Brewed Teas, Cut Fruits, Pearls)
  const [batches, setBatches] = useState([
     { id: 1, name: '现煮波霸黑珍珠', batchNo: 'B-101', status: 'critical', hoursLeft: 0, minsLeft: 12, maxLife: 4, generatedAt: '10:00' },
     { id: 2, name: '茉莉绿茶汤 (冰)', batchNo: 'B-103', status: 'warning', hoursLeft: 1, minsLeft: 45, maxLife: 4, generatedAt: '12:30' },
     { id: 3, name: '手切鲜芒甜度果泥', batchNo: 'B-104', status: 'safe', hoursLeft: 5, minsLeft: 20, maxLife: 8, generatedAt: '14:00' },
     { id: 4, name: '阿萨姆红茶汤 (热)', batchNo: 'B-100', status: 'dead', hoursLeft: 0, minsLeft: 0, maxLife: 4, generatedAt: '08:00' },
  ]);

  const getStatusVisuals = (status) => {
     switch(status) {
        case 'dead': return { ring: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: '⛔', act: lang === 'zh' ? '该批次已过期' : 'Expired' };
        case 'critical': return { ring: 'border-red-300', bg: 'bg-red-50', text: 'text-red-600', icon: '⚠️', act: lang === 'zh' ? '即将过期' : 'Expiring Soon' };
        case 'warning': return { ring: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-700', icon: '⏰', act: lang === 'zh' ? '留意效期' : 'Warning' };
        case 'safe': return { ring: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-600', icon: '✅', act: lang === 'zh' ? '效期正常' : 'Normal' };
        default: return {};
     }
  };

  const handleDestroy = (id) => {
      setBatches(batches.filter(b => b.id !== id));
      window.dispatchEvent(new CustomEvent('app:success', { detail: t('wasteRecorded') }));
  };

  return (
    <div className="space-y-6">
       
       <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
               {lang === 'zh' ? '半成品效期监控' : 'Expiration Monitor'}
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl">
               {lang === 'zh' 
                  ? '追踪门店自制半成品（如茶汤、果泥、珍珠等）的有效食用期。请及时处理过期物料以保证食品安全。' 
                  : 'Track the shelf life of semi-finished products. Please dispose of expired items promptly to ensure food safety.'}
            </p>

            <div className="mt-4 flex gap-4 text-sm">
               <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-slate-600">{lang === 'zh' ? '已过期' : 'Expired'}</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                  <span className="text-slate-600">{lang === 'zh' ? '临期 (<2h)' : 'Expiring'}</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600">{lang === 'zh' ? '正常 (>2h)' : 'Normal'}</span>
               </div>
            </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {batches.map(v => {
             const { ring, bg, text, icon, act } = getStatusVisuals(v.status);
             return (
                <div key={v.id} className={`relative bg-white rounded-lg p-5 border ${ring} hover:shadow-md transition-shadow`}>
                   
                   {v.status === 'dead' && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] rounded-lg z-10 flex flex-col items-center justify-center border border-red-200">
                         <span className="text-red-500 text-3xl mb-2">⚠️</span>
                         <h3 className="font-bold text-slate-800 mb-3">{lang === 'zh' ? '物料已过期' : 'Expired'}</h3>
                         <button onClick={() => handleDestroy(v.id)} className="px-4 py-1.5 bg-white border border-red-500 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition">
                           处理废料
                         </button>
                      </div>
                   )}

                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded border border-slate-100 text-lg">
                         {v.name.includes('珍珠') ? '🧋' : v.name.includes('果') ? '🥭' : '🍵'}
                      </div>
                      <div className="px-2 py-0.5 text-[14px] text-slate-500 border border-slate-200 rounded bg-slate-50">
                         {v.batchNo}
                      </div>
                   </div>

                   <h3 className="text-base font-medium text-slate-800 mb-1">{v.name}</h3>
                   <div className="text-[14px] text-slate-500 mb-4">
                     {lang === 'zh' ? '生产时间' : 'Brewed'}: {v.generatedAt}
                   </div>

                   <div className="border-t border-slate-100 pt-4">
                       <div className="flex justify-between items-center mb-1">
                           <span className="text-[14px] text-slate-500">{lang === 'zh' ? '剩余时长' : 'Time Left'}</span>
                           <span className="text-[14px] text-slate-400">MAX: {v.maxLife}h</span>
                       </div>
                       
                       <div className={`text-2xl font-mono ${v.status === 'critical' ? 'text-red-500' : 'text-slate-700'}`}>
                          {String(v.hoursLeft).padStart(2, '0')}<span className="text-2xl text-slate-300">:</span>{String(v.minsLeft).padStart(2,'0')}
                       </div>
                   </div>

                   <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <span className={`text-[14px] flex items-center gap-1.5 ${text}`}>
                         {icon} {act}
                      </span>
                   </div>
                </div>
             );
          })}
       </div>

    </div>
  );
}

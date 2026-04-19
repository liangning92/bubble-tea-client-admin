import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function UnifiedRevenuePage() {
  const { t } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    channels: { dineIn: 0, grab: 0, gofood: 0, shopee: 0 },
    alerts: { unaccepted: 3, overdue: 2 }
  });

  useEffect(() => {
    api('GET', '/analysis/revenue-detailed')
      .then(res => {
        if (res && !res.error) {
          // Transform API response to expected structure
          const apiData = res.data || res;
          setData({
            channels: {
              dineIn: apiData.channels?.find(c => c.name?.includes('堂食') || c.name?.includes('Dine-in'))?.amount || 0,
              grab: apiData.channels?.find(c => c.name?.includes('Grab'))?.amount || 0,
              gofood: apiData.channels?.find(c => c.name?.includes('Go') && !c.name?.includes('Shop'))?.amount || 0,
              shopee: apiData.channels?.find(c => c.name?.includes('Shopee'))?.amount || 0
            },
            alerts: apiData.alerts || { unaccepted: 0, overdue: 0 }
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val) => `Rp ${val.toLocaleString()}`;

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400">{t('syncingRevenueData')}</div>;

  return (
    <div className="space-y-4 animate-soft pb-20">
      <div className="flex justify-between items-end px-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{t('revenueChannelDeepDive')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左侧：渠道拆分 - 纯净化覆盖 */}
        <div className="card-premium !p-6 !rounded-[48px] bg-white border-slate-50 shadow-sm transition-all hover:border-slate-200">
          <h3 className="text-[16px] font-black text-slate-900 mb-10 flex items-center gap-3">
             <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
             {t('revenueChannelRatio')}
          </h3>
          <div className="space-y-4">
            {(() => {
              const total = Object.values(data.channels).reduce((s, v) => s + (v || 0), 0);
              return [
                { label: t('dineInOrders'), val: data.channels.dineIn, icon: '🏠', color: 'bg-slate-900' },
                { label: 'GRABFOOD', val: data.channels.grab, icon: '🛵', color: 'bg-emerald-500' },
                { label: 'GOFOOD', val: data.channels.gofood, icon: '🏎️', color: 'bg-red-500' },
                { label: 'SHOPEEFOOD', val: data.channels.shopee, icon: '🛍️', color: 'bg-orange-500' }
              ].map((item, idx) => {
                const pct = total > 0 ? Math.round((item.val / total) * 100) : 0;
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[14px] font-black text-slate-900 uppercase tracking-widest">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-900">{formatCurrency(item.val)}</div>
                        <div className="text-[11px] text-slate-400 font-black opacity-60">{t('ratioPct', { pct })}</div>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: pct > 0 ? pct + '%' : '2%' }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* 右侧：预警 - 纯净化覆盖 */}
        <div className="space-y-4">
           <div className="card-premium !p-6 !rounded-[48px] bg-white border-slate-50 shadow-sm">
              <h3 className="text-[16px] font-black text-orange-600 mb-10 flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
                 {t('deliveryAlertTitle')}
              </h3>
              
              <div className="space-y-4">
                 <div className="p-6 bg-red-50 rounded-[32px] border border-red-100 flex items-center justify-between group hover:bg-red-600 transition-all">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">🚨</div>
                       <div>
                          <div className="font-black text-red-600 text-[16px] group-hover:text-white">{t('unacceptedOrderAlert')}</div>
                          <div className="text-[12px] text-red-400 font-black group-hover:text-white/80 mt-1">{t('unacceptedOrderDesc', { count: data.alerts.unaccepted, minutes: 5 })}</div>
                       </div>
                    </div>
                    <div className="text-4xl font-black text-red-600 group-hover:text-white">{data.alerts.unaccepted.toString().padStart(2, '0')}</div>
                 </div>

                 <div className="p-6 bg-orange-50 rounded-[32px] border border-orange-100 flex items-center justify-between group hover:bg-orange-600 transition-all">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">⌛</div>
                       <div>
                          <div className="font-black text-orange-600 text-[16px] group-hover:text-white">{t('overdueAlertTitle')}</div>
                          <div className="text-[12px] text-orange-400 font-black group-hover:text-white/80 mt-1">{t('overdueAlertDesc', { count: data.alerts.overdue, minutes: 15 })}</div>
                       </div>
                    </div>
                    <div className="text-4xl font-black text-orange-600 group-hover:text-white">{data.alerts.overdue.toString().padStart(2, '0')}</div>
                 </div>
              </div>

              <div className="mt-10 pt-10 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('platformDataSyncActive')}</span>
                 </div>
                 <button className="text-[11px] font-black text-slate-400 border border-slate-100 px-5 py-3.5 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest">
                    {t('systemAuditLog')}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

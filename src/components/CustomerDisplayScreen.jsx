import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * CustomerDisplayScreen - 副屏顾客展示组件
 * 分辨率: 1920×1080 自适应
 * 布局: 上半部分(60%) = 价格明细+支付二维码; 下半部分(40%) = 广告/公告/动态考勤码
 */
export default function CustomerDisplayScreen({ orderData, config = {} }) {
  const { t } = useAuth();
  const [adIndex, setAdIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 默认配置
  const defaultConfig = {
    showItems: true,
    showQR: true,
    showAds: true,
    showLogo: true,
  };
  const displayConfig = { ...defaultConfig, ...config };

  // 模拟广告数据
  const ads = [
    { id: 1, title: t('newProductTitle'), subtitle: t('limitedOffer') },
    { id: 2, title: t('memberExclusive'), subtitle: t('pointsRedeem') },
    { id: 3, title: t('giftWithPurchase'), subtitle: t('surpriseGift') },
  ];

  // 动态考勤码刷新（每30秒）
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (displayConfig.showAds) {
      const adTimer = setInterval(() => {
        setAdIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
      return () => clearInterval(adTimer);
    }
  }, [displayConfig.showAds]);

  useEffect(() => {
    const qrTimer = setInterval(() => {
      setQrTimestamp(Date.now());
    }, 30000);
    return () => clearInterval(qrTimer);
  }, []);

  // 动态考勤码内容
  const checkInQRData = useMemo(() => {
    return JSON.stringify({
      type: 'checkin',
      timestamp: qrTimestamp,
      shiftId: orderData?.shiftId || 'default',
    });
  }, [qrTimestamp, orderData?.shiftId]);

  // 支付二维码（模拟数据）
  const paymentQRData = useMemo(() => {
    return JSON.stringify({
      type: 'payment',
      amount: orderData?.totalAmount || 0,
      orderId: orderData?.orderId || 'N/A',
    });
  }, [orderData]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
      {/* 顶部时间区域 */}
      <div className="flex justify-between items-center px-8 py-4 bg-slate-950/50">
        {displayConfig.showLogo && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-2xl font-black">🧋</div>
            <span className="text-xl font-black tracking-wider">Shopwise</span>
          </div>
        )}
        <div className="text-right">
          <div className="text-3xl font-black tracking-wider">{formatTime(currentTime)}</div>
          <div className="text-sm text-slate-400">{formatDate(currentTime)}</div>
        </div>
      </div>

      {/* 主内容区域 - 60% */}
      <div className="flex-1 flex">
        {/* 左侧：订单明细 */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-2 h-10 bg-orange-500 rounded-full" />
            <h2 className="text-2xl font-black uppercase tracking-widest">{t('orderDetails')}</h2>
          </div>

          {orderData?.orderNo && (
            <div className="mb-4 px-4 py-2 bg-slate-800/50 rounded-2xl inline-block">
              <span className="text-sm text-slate-400">{t('orderNo')}: </span>
              <span className="font-black text-orange-500">{orderData.orderNo}</span>
            </div>
          )}

          {displayConfig.showItems && orderData?.items?.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-3">
              {orderData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                  <div className="flex-1">
                    <div className="font-black text-lg">{item.name}</div>
                    <div className="text-sm text-slate-400">
                      {item.config?.spec && <span>{item.config.spec} | </span>}
                      {item.config?.sugar && <span>{item.config.sugar} | </span>}
                      {item.config?.ice && <span>{item.config.ice}</span>}
                      {item.config?.addons?.length > 0 && <span> + {item.config.addons.join(', ')}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-orange-500">¥{item.unitPrice}</div>
                    <div className="text-sm text-slate-400">x{item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <div className="text-6xl mb-4">🛒</div>
                <div className="text-xl font-black">{t('waitingForOrder')}</div>
              </div>
            </div>
          )}

          {/* 合计区域 */}
          <div className="mt-auto pt-6 border-t border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg text-slate-400">{t('subtotal')}</span>
              <span className="text-xl font-black">¥{orderData?.subtotal || 0}</span>
            </div>
            {orderData?.discount > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg text-green-400">{t('discount')}</span>
                <span className="text-xl font-black text-green-400">-¥{orderData.discount}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black">{t('total')}</span>
              <span className="text-4xl font-black text-orange-500">¥{orderData?.totalAmount || 0}</span>
            </div>
            {orderData?.change !== undefined && orderData?.change > 0 && (
              <div className="flex justify-between items-center mt-2 text-slate-400">
                <span>{t('change')}</span>
                <span className="text-lg font-black">¥{orderData.change}</span>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：支付二维码 */}
        {displayConfig.showQR && (
          <div className="w-80 p-6 flex flex-col items-center justify-center bg-slate-800/30 rounded-3xl border border-slate-700/30 m-4">
            <div className="text-xl font-black uppercase tracking-widest mb-6">{t('scanToPay')}</div>
            <div className="w-48 h-48 bg-white rounded-3xl p-4 mb-6">
              {/* 模拟二维码 */}
              <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center">
                <div className="grid grid-cols-5 gap-1 p-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-2xl font-black text-orange-500">¥{orderData?.totalAmount || 0}</div>
            <div className="text-sm text-slate-400 mt-2">{t('paymentQRDesc')}</div>
          </div>
        )}
      </div>

      {/* 底部广告/考勤区域 - 40% */}
      <div className="h-2/5 flex">
        {displayConfig.showAds && (
          <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-3xl p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-black mb-2">{ads[adIndex].title}</div>
                <div className="text-xl text-orange-100">{ads[adIndex].subtitle}</div>
              </div>
            </div>
          </div>
        )}

        {/* 动态考勤码 */}
        <div className="w-80 p-6 flex flex-col items-center justify-center bg-slate-950/50 m-4 rounded-3xl border border-slate-700/30">
          <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">{t('staffCheckIn')}</div>
          <div className="w-32 h-32 bg-white rounded-2xl p-2 mb-4">
            <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5 p-1">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">{t('refreshInterval')}</div>
        </div>
      </div>
    </div>
  );
}

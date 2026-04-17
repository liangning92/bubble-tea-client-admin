import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * POSQuickActions - 快捷功能工具条
 * 一键切换支付方式、开钱箱、取消订单、打印小票
 */
export default function POSQuickActions({ 
  onPaymentMethodChange, 
  onOpenCashDrawer, 
  onCancelOrder, 
  onPrintReceipt,
  currentPaymentMethod = 'cash',
  disabled = false,
  config = {} 
}) {
  const { t } = useAuth();
  const [loading, setLoading] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // 支付方式列表
  const paymentMethods = [
    { key: 'cash', label: t('cash') || '现金', icon: '💵', color: 'bg-green-500' },
    { key: 'qrcode', label: t('qrCode') || '二维码', icon: '📱', color: 'bg-blue-500' },
    { key: 'card', label: t('card') || '银行卡', icon: '💳', color: 'bg-purple-500' },
  ];

  // 处理支付方式切换
  const handlePaymentChange = (method) => {
    if (disabled) return;
    if (onPaymentMethodChange) {
      onPaymentMethodChange(method);
    }
  };

  // 开钱箱
  const handleOpenCashDrawer = async () => {
    if (disabled) return;
    setLoading('cashdrawer');
    try {
      const res = await fetch('/api/pos/cashdrawer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed');
      
      if (onOpenCashDrawer) onOpenCashDrawer();
      
      // 显示成功提示
      window.dispatchEvent(new CustomEvent('app:success', { 
        detail: t('cashDrawerOpened') || '钱箱已打开' 
      }));
    } catch (err) {
      console.error('Cash drawer error:', err);
      window.dispatchEvent(new CustomEvent('app:error', { 
        detail: t('cashDrawerFailed') || '钱箱打开失败' 
      }));
    } finally {
      setLoading(null);
    }
  };

  // 取消订单
  const handleCancelOrder = () => {
    if (disabled) return;
    setShowCancelConfirm(true);
  };

  const confirmCancelOrder = () => {
    setShowCancelConfirm(false);
    if (onCancelOrder) onCancelOrder();
  };

  // 打印小票
  const handlePrintReceipt = async () => {
    if (disabled) return;
    setLoading('print');
    try {
      const res = await fetch('/api/pos/print', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed');
      
      if (onPrintReceipt) onPrintReceipt();
      
      window.dispatchEvent(new CustomEvent('app:success', { 
        detail: t('printStarted') || '打印中...' 
      }));
    } catch (err) {
      console.error('Print error:', err);
      window.dispatchEvent(new CustomEvent('app:error', { 
        detail: t('printFailed') || '打印失败' 
      }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-3 p-4 bg-slate-900/90 backdrop-blur-sm rounded-3xl border border-slate-700/50 ${disabled ? 'opacity-50' : ''}`}>
        {/* 支付方式切换 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
            {t('paymentMethod') || '支付':
            </span>
          {paymentMethods.map((method) => (
            <button
              key={method.key}
              onClick={() => handlePaymentChange(method.key)}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                currentPaymentMethod === method.key
                  ? `${method.color} text-white shadow-lg`
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-lg">{method.icon}</span>
              <span>{method.label}</span>
            </button>
          ))}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-10 bg-slate-700 mx-2" />

        {/* 快捷功能 */}
        <div className="flex items-center gap-2">
          {/* 开钱箱 */}
          <button
            onClick={handleOpenCashDrawer}
            disabled={disabled || loading === 'cashdrawer'}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('openCashDrawer') || '开钱箱'}
          >
            <span className="text-lg">{loading === 'cashdrawer' ? '⏳' : '💰'}</span>
            <span>{t('cashDrawer') || '钱箱'}</span>
          </button>

          {/* 打印小票 */}
          <button
            onClick={handlePrintReceipt}
            disabled={disabled || loading === 'print'}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('printReceipt') || '打印小票'}
          >
            <span className="text-lg">{loading === 'print' ? '⏳' : '🧾'}</span>
            <span>{t('print') || '打印'}</span>
          </button>

          {/* 取消订单 */}
          <button
            onClick={handleCancelOrder}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('cancelOrder') || '取消订单'}
          >
            <span className="text-lg">❌</span>
            <span>{t('cancel') || '取消'}</span>
          </button>
        </div>
      </div>

      {/* 取消订单确认弹窗 */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm text-slate-900 animate-soft">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-black uppercase">{t('confirmCancelOrder') || '确认取消订单'}</h3>
              <p className="text-sm text-slate-400 mt-2">{t('cancelOrderWarning') || '此操作不可恢复，订单将被清空'}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl font-black uppercase tracking-widest transition-all"
              >
                {t('back') || '返回'}
              </button>
              <button
                onClick={confirmCancelOrder}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
              >
                {t('confirmCancel') || '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

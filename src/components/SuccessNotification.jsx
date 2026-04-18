import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { i18n } from '../i18n';

/**
 * 全局成功 Toast 组件 (Renamed for cache busting)
 * 用法：window.dispatchEvent(new CustomEvent('app:success', { detail: '操作成功' }))
 */
export default function SuccessNotification() {
  const { t } = useAuth();
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const lang = localStorage.getItem('lang') || 'zh';
      setMsg(e.detail || i18n[lang]?.successGeneric || i18n.zh.successGeneric || t('successGeneric'));
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };
    window.addEventListener('app:success', handler);
    return () => window.removeEventListener('app:success', handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-full px-4">
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-lg">✅</span>
          <span className="text-sm font-medium">{msg}</span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-green-400 hover:text-green-600 text-lg leading-none"
          aria-label={t('close')}
        >
          ×
        </button>
      </div>
    </div>
  );
}

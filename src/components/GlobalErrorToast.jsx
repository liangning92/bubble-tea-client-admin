import React, { useState, useEffect } from 'react';

let _errorCounter = 0; // 模块级唯一计数器，避免 Date.now() 同毫秒 key 冲突

/**
 * 全局错误 Toast 提示组件
 * 监听自定义事件 'app:error' 并显示错误 banner
 * 用法：window.dispatchEvent(new CustomEvent('app:error', { detail: '错误信息' }))
 * 支持字符串或对象格式：{ message: '错误信息', type: 'error|warning|info' }
 */
export default function GlobalErrorToast() {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const errorDetail = e.detail;
      let errorMessage = '发生错误';
      let errorType = 'error';
      
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (errorDetail?.message) {
        // message 本身也可能是对象，需要强制转字符串
        const rawMsg = errorDetail.message;
        errorMessage = typeof rawMsg === 'string' ? rawMsg : (rawMsg?.message || JSON.stringify(rawMsg));
        errorType = errorDetail.type || 'error';
      }
      // 最终保障：确保 errorMessage 绝对是字符串
      if (typeof errorMessage !== 'string') {
        errorMessage = JSON.stringify(errorMessage) || '发生错误';
      }
      
      const newError = {
        id: ++_errorCounter,
        message: errorMessage,
        type: errorType,
        timestamp: new Date()
      };
      
      setErrors(prev => [...prev, newError]);
      
      // 根据错误类型设置不同的消失时间
      const timeout = errorType === 'warning' ? 4000 : 3000;
      setTimeout(() => {
        setErrors(prev => prev.filter(err => err.id !== newError.id));
      }, timeout);
    };
    
    window.addEventListener('app:error', handler);
    
    // 捕获未处理的Promise错误
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      window.dispatchEvent(new CustomEvent('app:error', {
        detail: { 
          message: `未处理的Promise错误: ${event.reason?.message || event.reason}`,
          type: 'error'
        }
      }));
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('app:error', handler);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const removeError = (id) => {
    setErrors(prev => prev.filter(err => err.id !== id));
  };

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md w-full space-y-2">
      {errors.map(error => {
        // 根据错误类型设置不同的样式
        let bgClass = 'bg-red-50 border-red-200 text-red-700';
        let icon = '⚠️';
        
        if (error.type === 'warning') {
          bgClass = 'bg-yellow-50 border-yellow-200 text-yellow-700';
          icon = '⚠️';
        } else if (error.type === 'info') {
          bgClass = 'bg-blue-50 border-blue-200 text-blue-700';
          icon = 'ℹ️';
        } else if (error.type === 'success') {
          bgClass = 'bg-green-50 border-green-200 text-green-700';
          icon = '✅';
        }
        
        return (
          <div
            key={error.id}
            className={`${bgClass} border px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 animate-slideIn`}
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium">{error.message}</span>
            </div>
            <button
              onClick={() => removeError(error.id)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        );
      })}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
}

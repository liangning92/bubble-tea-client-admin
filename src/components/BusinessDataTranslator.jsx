import React from 'react';
import { useAuth } from '../context/AuthContext';
import { translateBusinessText } from '../utils/autoTranslate';

/**
 * 业务数据自动化翻译组件
 * 当 UI 语言与数据语言不一致时，自动提供翻译视图
 */
export default function BusinessDataTranslator({ text, className = "" }) {
  const { lang } = useAuth();

  // 如果是中文界面，尝试翻译
  // 如果是印尼语界面，通常数据本身就是印尼语，直接返回
  const displayChat = lang === 'zh' ? translateBusinessText(text, 'zh') : text;

  // 如果翻译后没有变化，或者翻译结果为空，则显示原文
  const hasTranslated = displayChat !== text;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={hasTranslated ? `原文: ${text}` : ""}
    >
      {displayChat}
      {hasTranslated && (
        <span className="text-[8px] bg-slate-100 text-slate-400 px-1 rounded uppercase tracking-tighter scale-90">自动</span>
      )}
    </span>
  );
}

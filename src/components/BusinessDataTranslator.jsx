import React from 'react';
import { useAuth } from '../context/AuthContext';
import { translateBusinessText } from '../utils/autoTranslate';

/**
 * 业务数据自动化翻译组件
 * 当 UI 语言与数据语言不一致时，自动提供翻译视图
 * 
 * 支持：中文界面翻译印尼语数据 → 中文
 *       印尼语界面翻译中文数据 → 印尼语（提取纯印尼语）
 */
export default function BusinessDataTranslator({ text, className = "" }) {
  const { lang, t } = useAuth();

  // 中文界面：翻译印尼语数据 → 中文
  // 印尼语界面：翻译中文数据 → 印尼语
  // 英文界面：不翻译，直接返回原文
  let displayText = text;
  
  if (lang === 'zh') {
    displayText = translateBusinessText(text, 'zh');
  } else if (lang === 'id') {
    // 在印尼语界面：翻译中文数据为印尼语
    if (/[\u4e00-\u9fff]/.test(text)) {
      // 提取混合文本中的印尼语部分：尝试 / 或 （）
      const parts = text.split('/');
      if (parts.length > 1) {
        displayText = parts[parts.length - 1].trim();
      } else {
        const parenMatch = text.match(/[（(]([^)）]+)[)）]/);
        if (parenMatch) {
          displayText = parenMatch[1].trim();
        } else {
          // 格式：中文词 + 空格 + 印尼语词 → 取印尼语部分
          // 如 "专用勺 Sendok Eskrim" → "Sendok Eskrim"
          // 如 "cincau 汁 Bahan Cincau" → "Bahan Cincau"（这里 中文+印尼+中文混排）
          const spaceParts = text.split(/\s+/);
          const nonChineseParts = spaceParts.filter(p => !/[\u4e00-\u9fff]/.test(p));
          if (nonChineseParts.length > 0) {
            displayText = nonChineseParts.join(' ');
          } else {
            displayText = translateBusinessText(text, 'id');
          }
        }
      }
    }
  }

  const hasTranslated = displayText !== text;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={hasTranslated ? `${t('originalText')}: ${text}` : ''}
    >
      {displayText}
      {hasTranslated && (
        <span className="text-[8px] bg-slate-100 text-slate-400 px-1 rounded uppercase tracking-tighter scale-90">{t('autoTag')}</span>
      )}
    </span>
  );
}

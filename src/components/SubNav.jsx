import React from 'react';

/**
 * 通用二级导航组件
 * @param {Array} tabs - 标签项数组 [{ key, label, icon }]
 * @param {String} activeTab - 当前激活的标签 key
 * @param {Function} onTabChange - 切换回调
 */
export default function SubNav({ tabs, activeTab, onTabChange }) {
  return (
    <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 overflow-x-auto no-scrollbar border border-slate-100/60 w-fit">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          className={`
            whitespace-nowrap flex items-center gap-3 px-8 py-3 rounded-xl transition-all duration-300
            ${activeTab === t.key 
              ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-100 scale-[1.02] font-black' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-bold'
            }
          `}
        >
          {t.icon && <span className="text-lg">{t.icon}</span>}
          <span className="tab-text tracking-normal">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

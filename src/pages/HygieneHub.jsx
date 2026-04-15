// ============ 卫生管理Hub P019-P022 ============
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OperationAuditPage from './OperationAuditPage';

export default function HygieneHub({ hideHeader }) {
  const { t, lang } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'sop';

  // 物理锁定 5 个维度分类
  const tabs = [
    { key: 'sop', label: t('hygieneSOP', '每日 SOP') },
    { key: 'audit', label: t('hygieneAudit', '品质巡检') },
    { key: 'device', label: t('hygieneDevice', '设备维护') },
    { key: 'security', label: t('hygieneSecurity', '食安红线') },
    { key: 'protocol', label: t('hygieneProtocol', '标准协议') }
  ];

  const handleTabClick = (key) => {
    setSearchParams({ tab: key });
  };

  const pageTitle = lang === 'zh' ? '运营管理' : lang === 'en' ? 'Operations' : 'Operasional';
  
  return (
    <div className="w-full bg-slate-50 text-slate-800">
      <div className="max-w-[1600px] mx-auto space-y-10">
        
        {!hideHeader && (
          <div className="flex flex-col gap-2 px-2">
            <h1 className="text-h1">{pageTitle}</h1>
            <p className="text-label-caps">{t('staffSubtitle')}</p>
          </div>
        )}

        {/* 统一 Tab 导航 */}
        <div className="bg-white/50 backdrop-blur-xl border border-white rounded-[40px] p-2 shadow-2xl flex flex-wrap gap-2 self-start ring-8 ring-slate-100/50">
          {tabs.map(tb => (
            <button
              key={tb.key}
              onClick={() => handleTabClick(tb.key)}
              className={`px-8 py-4 rounded-[28px] text-[11px] font-black uppercase tracking-widest transition-all ${
                tab === tb.key
                  ? 'bg-slate-900 text-white shadow-xl scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* 统一内容挂载于 OperationAuditPage */}
        <div className="min-h-[60vh] bg-white rounded-[48px] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
          <OperationAuditPage forceTab={tab} />
        </div>
      </div>
    </div>
  );
}

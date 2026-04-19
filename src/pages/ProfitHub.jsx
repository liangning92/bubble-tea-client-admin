import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubNav from '../components/SubNav';

// Sub-pages
import UnifiedRevenuePage from './UnifiedRevenuePage';
import CostStatisticsPage from './CostStatistics';
import ProfitStatisticsPage from './ProfitStatistics';
import TaxReporter from './TaxReporter';

export default function ProfitHub() {
  const { t } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = [
    { key: 'revenue', icon: '📈' },
    { key: 'costs', icon: '🧾' },
    { key: 'financial', icon: '📊' },
    { key: 'tax', icon: '📑' },
  ];

  let tab = searchParams.get('tab') || 'revenue';
  if (!tabs.find(tData => tData.key === tab)) tab = 'revenue';

  const handleTabChange = (key) => setSearchParams({ tab: key });

  return (
    <div className="animate-soft space-y-5 focus:outline-none text-slate-900">
      {/* 统一页头 */}
      <div className="flex flex-col gap-2 px-4">
        <h1 className="text-h1 uppercase  tracking-tight">{t('profitHub')}</h1>
        <p className="text-label-caps !text-slate-400">{t('profitSubtitle')}</p>
      </div>

      {/* 统一二级导航 (包含标准间距) */}
      <div className="overflow-x-auto no-scrollbar pb-2">
        <SubNav 
          tabs={tabs.map(tData => ({ ...tData, label: t(tData.key) }))} 
          activeTab={tab} 
          onTabChange={handleTabChange} 
        />
      </div>

      {/* 内容区域 */}
      <div className="min-h-[60vh] bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        {tab === 'revenue' && <UnifiedRevenuePage hideHeader={true} />}
        {tab === 'costs' && <CostStatisticsPage hideHeader={true} />}
        {tab === 'financial' && <ProfitStatisticsPage hideHeader={true} />}
        {tab === 'tax' && <TaxReporter hideHeader={true} />}
      </div>
    </div>
  );
}

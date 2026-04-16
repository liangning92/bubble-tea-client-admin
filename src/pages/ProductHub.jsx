import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubNav from '../components/SubNav';

// Sub-pages
import ProductPage from './ProductPage';
import BOMImportPage from './BOMImportPage';

export default function ProductHub() {
  const { lang } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = [
    { key: 'products', zh: '产品直营库', en: 'Products', icon: '🧋' },
    { key: 'bom', zh: '配方树矩阵', en: 'BOM Matrix', icon: '🧬' },
  ];

  let tab = searchParams.get('tab') || 'products';
  if (!tabs.find(t => t.key === tab)) tab = 'products';

  const handleTabChange = (key) => setSearchParams({ tab: key });

  return (
    <div className="animate-soft space-y-10 focus:outline-none text-slate-900">
      {/* 统一页头 */}
      <div className="flex flex-col gap-2 px-4">
        <h1 className="text-h1">{t('productHubTitle')}</h1>
        <p className="text-label-caps">{t('productHubSubtitle')}</p>
      </div>

      {/* 统一二级导航 (采用标准 SubNav 组件) */}
      <div className="overflow-x-auto no-scrollbar pb-2">
        <SubNav 
          tabs={tabs.map(t => ({ ...t, label: lang === 'zh' ? t.zh : t.en }))} 
          activeTab={tab} 
          onTabChange={handleTabChange} 
        />
      </div>

      {/* 内容区域 */}
      <div className="min-h-[60vh] bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        {tab === 'products' && <ProductPage />}
        {tab === 'bom' && <BOMImportPage />}
      </div>
    </div>
  );
}

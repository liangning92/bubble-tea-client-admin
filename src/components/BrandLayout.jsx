import React from 'react';
import SidebarLayout from './SidebarLayout';

export default function BrandLayout() {
  const menuItems = [
    { path: '/', label: '品牌大盘分析', icon: '📈' },
    { path: '/product', label: '中心产研库 (产品&BOM)', icon: '🧋' },
    { path: '/crm', label: '全局 CRM 客户域', icon: '👑' },
    { path: '/settings', label: '集团系统设置', icon: '⚙️' },
  ];

  return <SidebarLayout menuItems={menuItems} title="Brand HQ 总部" />;
}

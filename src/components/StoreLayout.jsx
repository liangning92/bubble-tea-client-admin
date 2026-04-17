import React, { useMemo } from 'react';
import SidebarLayout from './SidebarLayout';
import DashboardHeaderAlert from './DashboardHeaderAlert';
import { useAuth } from '../context/AuthContext';

export default function StoreLayout() {
  const { canAccess, t, permissions } = useAuth();

  // 严格遵循 i18n.js 原始规划：首页, 库存管理, 利润管理, 人员管理, 营销管理, 系统设置
  const allMenuItems = [
    { path: '/', label: t('navHome'), icon: '🏠', module: 'always_visible' },
    { path: '/inventory', label: t('navInventory'), icon: '📦', module: 'inventory' },
    { path: '/product', label: t('navProducts'), icon: '🧋', module: 'inventory' },
    { path: '/profit', label: t('navRevenue'), icon: '💰', module: ['revenue_flow', 'profit_detail', 'expense_claim'] },
    { path: '/staff', label: t('navStaff'), icon: '👥', module: ['staff_manage', 'hygiene'] },
    { path: '/marketing', label: t('navMarketing'), icon: '🚀', module: 'staff_manage' },
    { path: '/settings', label: t('navSettings'), icon: '⚙️', module: 'system' },
  ];

  const filteredMenu = useMemo(() => {
    return allMenuItems.filter(item => {
      if (item.module === 'always_visible') return true;
      if (Array.isArray(item.module)) {
        return item.module.some(m => canAccess(permissions, m));
      }
      return canAccess(permissions, item.module);
    });
  }, [permissions, canAccess]);

  return (
    <SidebarLayout 
      menuItems={filteredMenu} 
      title={t('storeTitle')} 
      accentColor="#f27a1a"
      topAlert={<DashboardHeaderAlert />} 
    />
  );
}

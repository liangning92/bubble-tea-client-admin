import React from 'react';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from './SidebarLayout';

export default function BrandLayout() {
  const { t } = useAuth();
  const menuItems = [
    { path: '/', label: t('brandDashboard'), icon: '📈' },
    { path: '/product', label: t('brandProductCenter'), icon: '🧋' },
    { path: '/crm', label: t('brandCrmDomain'), icon: '👑' },
    { path: '/settings', label: t('brandSystemSettings'), icon: '⚙️' },
  ];

  return <SidebarLayout menuItems={menuItems} title={t('headquarters')} />;
}

import React from 'react';
import { useAuth } from '../context/AuthContext';
import PlatformDashboard from './PlatformDashboard';
import BrandDashboard from './BrandDashboard';
import StoreDashboard from './StoreDashboard';
import StaffPortal from './StaffPortal';

export default function DashboardPage() {
  const { user, canAccess } = useAuth();

  // 1. 系统管理员直接进入平台看板
  if (user?.username === 'superadmin') {
    return <PlatformDashboard />;
  }

  // 2. 具有经营权限的用户（店长或被授权店员）进入经营看板
  //    检查是否拥有至少一项财务子权限（revenue_flow / profit_detail / expense_claim）
  if (canAccess('revenue_flow') || canAccess('profit_detail') || canAccess('expense_claim')) {
    return <StoreDashboard />;
  }

  // 3. 普通执行权限用户进入个人工作合伙看板 (Staff Portal)
  return <StaffPortal />;
}

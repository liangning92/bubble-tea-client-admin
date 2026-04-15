import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 模块 key 到路由的映射（用于高亮判断）
const ModuleRouteMap = {
  '/': 'store_info',
  '/inventory': 'inventory',
  '/profit': 'revenue_flow',
  '/staff': 'staff_manage',
  '/hygiene': 'hygiene',
  '/settings': 'system',
};

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, canAccess, salaryView } = useAuth();

  // 底部导航：首页 + 5大功能模块
  const navItems = [
    { path: '/', icon: '🏠', labelZh: '工作台', labelEn: 'Portal', labelId: 'Portal', module: 'always_visible' },
    { path: '/inventory', icon: '📦', labelZh: '库存管理', labelEn: 'Inventory', labelId: 'Inventaris', module: 'inventory' },
    { path: '/profit', icon: '📊', labelZh: '利润分析', labelEn: 'Profit', labelId: 'Profit', module: ['revenue_flow', 'profit_detail', 'expense_claim'] },
    { path: '/staff', icon: '👥', labelZh: '人员管理', labelEn: 'Staff', labelId: 'Staff', module: 'staff_manage', salaryModule: 'salary' },
    { path: '/hygiene', icon: '🧹', labelZh: '运营管理', labelEn: 'Hygiene', labelId: 'Kebersihan', module: 'hygiene' },
    { path: '/settings', icon: '⚙️', labelZh: '设置', labelEn: 'Settings', labelId: 'Pengaturan', module: 'system' },
  ];

  // 根据权限过滤菜单项
  // staff_manage 的子权限：salaryModule + salaryView 共同控制薪资 tab 是否显示
  const visibleItems = useMemo(() => {
    return navItems.filter(item => {
      if (item.module === 'always_visible') return true;
      const hasBaseAccess = Array.isArray(item.module) 
        ? item.module.some(m => canAccess(m)) 
        : canAccess(item.module);
      
      if (!hasBaseAccess) return false;
      // 有 salaryModule 的项，还需要额外检查薪资子模块权限
      if (item.salaryModule) {
        // 先检查 permissions.salary 是否为 hidden
        if (!canAccess(item.salaryModule)) return false;
        // 再检查 salaryView 字段（由 auth/me 提供）
        // none = 完全不可见，own_only/all = 可见（own_only 仍可看自己的薪资tab）
        if (salaryView === 'none') return false;
      }
      return true;
    });
  }, [canAccess, salaryView]);

  const getLabel = (item) => {
    if (lang === 'zh') return item.labelZh;
    if (lang === 'en') return item.labelEn;
    return item.labelId;
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <div className="bottom-nav">
      {visibleItems.map(item => (
        <div
          key={item.path}
          className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="icon">{item.icon}</span>
          {getLabel(item)}
        </div>
      ))}
    </div>
  );
}

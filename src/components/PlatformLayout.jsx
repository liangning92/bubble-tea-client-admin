import React from 'react';
import SidebarLayout from './SidebarLayout';

export default function PlatformLayout() {
  const menuItems = [
    { path: '/', label: 'SaaS Platform Dashboard', icon: '🌍' },
    { path: '/settings', label: 'Global Server Settings', icon: '⚙️' },
  ];

  return <SidebarLayout menuItems={menuItems} title="BubbleTea SaaS Admin" />;
}

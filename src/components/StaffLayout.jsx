import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import DashboardHeaderAlert from './DashboardHeaderAlert';
import { useAuth } from '../context/AuthContext';

export default function StaffLayout() {
  const { user } = useAuth();
  
  return (
    <div className="pb-16 relative bg-slate-50 min-h-screen">
      <div className="px-4 pt-4 relative z-50">
        <DashboardHeaderAlert />
      </div>
      <Outlet />
      <BottomNav />
    </div>
  );
}

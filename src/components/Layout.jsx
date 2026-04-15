import React from 'react';
import { useAuth } from '../context/AuthContext';
import PlatformLayout from './PlatformLayout';
import BrandLayout from './BrandLayout';
import StoreLayout from './StoreLayout';
import StaffLayout from './StaffLayout';

export default function Layout() {
  const { user, loading } = useAuth();
  
  if (loading || !user) return <div className="p-8 text-center text-slate-500">Loading UI Layout Engine...</div>;

  // RBAC Routing Split
  if (user.username === 'superadmin') {
    return <PlatformLayout />;
  }
  
  if (user.role === 'admin' || user.role === 'manager' || user.role === 'staff' || user.role === 'barista') {
    return <StoreLayout />;
  }
  
  // Default fallback
  return <StoreLayout />;
}
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import GlobalErrorToast from './components/GlobalErrorToast';
import SuccessNotification from './components/SuccessNotification';
import ErrorBoundary from './components/ErrorBoundary';

// Forced refresh to resolve stale Vite bundle cache

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import PurchasePage from './pages/PurchasePage';
import ExpensePage from './pages/ExpensePage';
import ProfitPage from './pages/ProfitPage';
import ProductHub from './pages/ProductHub';
import BacktrackPage from './pages/BacktrackPage';
import AnomalyPage from './pages/AnomalyPage';
import ReportPage from './pages/ReportPage';
import AdManagement from './pages/AdManagement';
import PosTerminalPage from './pages/PosTerminalPage';
import POSDualScreenConfig from './pages/POSDualScreenConfig';
import POSSettingsPage from './pages/POSSettingsPage';
import POSCategoriesPage from './pages/POSCategoriesPage';

import Layout from './components/Layout';

import InventoryHub from './pages/InventoryHub';
import ProfitHub from './pages/ProfitHub';
import StaffHub from './pages/StaffHub';
import HygieneHub from './pages/HygieneHub';
import SettingsHub from './pages/SettingsHub';
import SchedulePage from './pages/SchedulePage';
import TrainingPage from './pages/TrainingPage';
import RewardPage from './pages/RewardPage';
import AttendancePage from './pages/AttendancePage';
import PayrollRulesPage from './pages/PayrollRulesPage';
import StaffPortal from './pages/StaffPortal';
import MarketingHub from './pages/MarketingHub';
import POSHardwareConfig from './pages/POSHardwareConfig';
import ProductPage from './pages/ProductPage';
import InventoryAnomalyPage from './pages/InventoryAnomalyPage';
import StaffPage from './pages/StaffPage';
import CouponFactory from './pages/CouponFactory';
import MarketingAutomation from './pages/MarketingAutomation';
import MarketingCalendar from './pages/MarketingCalendar';
import Leaderboard from './pages/Leaderboard';
import OperationAuditPage from './pages/OperationAuditPage';
import PermissionMatrix from './pages/PermissionMatrix';
import SettingsPage from './pages/SettingsPage';
import PlatformDashboard from './pages/PlatformDashboard';
import AboutPage from './pages/AboutPage';
import CRMHub from './pages/CRMHub';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <GlobalErrorToast />
          <SuccessNotification />
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 所有需要认证的路由 */}
          <Route element={<ProtectedRoute />}>

            <Route element={<Layout />}>
              {/* 首页路由会根据 DashboardPage.jsx 中的权限分发显示内容 */}
              <Route path="/" element={<DashboardPage />} />
              <Route path="/portal" element={<StaffPortal />} />
              <Route path="/inventory" element={<InventoryHub />} />
              <Route path="/profit" element={<ProfitHub />} />
              <Route path="/staff" element={<StaffHub />} />
              <Route path="/hygiene" element={<HygieneHub />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/settings" element={<SettingsHub />} />
              <Route path="/pos" element={<PosTerminalPage />} />
              <Route path="/pos/dual-config" element={<POSDualScreenConfig />} />
              <Route path="/pos/settings" element={<POSSettingsPage />} />
              <Route path="/pos-categories" element={<POSCategoriesPage />} />
              <Route path="/pos-terminal" element={<PosTerminalPage />} />
              <Route path="/pos-display" element={<POSDualScreenConfig />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/purchase" element={<PurchasePage />} />
              <Route path="/expense" element={<ExpensePage />} />
              <Route path="/product" element={<ProductHub />} />
              <Route path="/bom" element={<ProductHub />} />
              <Route path="/crm" element={<MarketingHub />} />
              <Route path="/delivery" element={<MarketingHub />} />
              <Route path="/marketing" element={<MarketingHub />} />
              <Route path="/backtrack" element={<BacktrackPage />} />
              <Route path="/anomaly" element={<AnomalyPage />} />

              <Route path="/report" element={<ReportPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/reward" element={<RewardPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/payroll" element={<PayrollRulesPage />} />
              <Route path="/pos-hardware" element={<POSHardwareConfig />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/inventory-anomaly" element={<InventoryAnomalyPage />} />
              <Route path="/staff-page" element={<StaffPage />} />
              <Route path="/coupon-factory" element={<CouponFactory />} />
              <Route path="/marketing-automation" element={<MarketingAutomation />} />
              <Route path="/marketing-calendar" element={<MarketingCalendar />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/operation-audit" element={<OperationAuditPage />} />
              <Route path="/permission-matrix" element={<PermissionMatrix />} />
              <Route path="/settings-page" element={<SettingsPage />} />
              <Route path="/platform-dashboard" element={<PlatformDashboard />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/member" element={<CRMHub />} />
            </Route>
          </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

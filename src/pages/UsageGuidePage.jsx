import React from 'react';
import { useAuth } from '../context/AuthContext';

const guideItems = [
  { icon: '📦', titleKey: 'guideInventory', contentKey: 'guideInventoryContent' },
  { icon: '📥', titleKey: 'guidePurchase', contentKey: 'guidePurchaseContent' },
  { icon: '📈', titleKey: 'guideSales', contentKey: 'guideSalesContent' },
  { icon: '💰', titleKey: 'guideExpense', contentKey: 'guideExpenseContent' },
  { icon: '📊', titleKey: 'guideProfit', contentKey: 'guideProfitContent' },
  { icon: '👥', titleKey: 'guideStaff', contentKey: 'guideStaffContent' },
  { icon: '🧹', titleKey: 'guideHygiene', contentKey: 'guideHygieneContent' },
  { icon: '📤', titleKey: 'guideReport', contentKey: 'guideReportContent' },
  { icon: '🤖', titleKey: 'guideSmartImport', contentKey: 'guideSmartImportContent' },
  { icon: '⚙️', titleKey: 'guideSystemSettings', contentKey: 'guideSystemSettingsContent' },
  { icon: '🔔', titleKey: 'guideNotifications', contentKey: 'guideNotificationsContent' },
  { icon: '🔐', titleKey: 'guideAccountSecurity', contentKey: 'guideAccountSecurityContent' },
];

export default function UsageGuidePage() {
  const { t, lang } = useAuth();

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          {t('usageGuideTitle')}
        </h1>
      </div>

      {/* 快速导航 */}
      <div className="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="font-bold mb-3">{t('quickNavigation')}</h3>
        <div className="grid grid-cols-3 gap-2">
          {guideItems.slice(0, 6).map((item, i) => (
            <div key={i} className="bg-white rounded-lg p-2 text-center border border-gray-100">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-[14px] font-medium">{t(item.titleKey)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 详细指南 */}
      <div className="space-y-4">
        {guideItems.map((item, i) => (
          <div key={i} className="card">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold mb-2">{t(item.titleKey)}</h3>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {t(item.contentKey)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部信息 */}
      <div className="card mt-6 bg-gray-50 text-center">
        <div className="text-sm text-gray-500">
          <>
              <div className="font-medium mb-1">🧋 {t('appName')}</div>
              <div>{t('contactAdmin')}</div>
              <div className="text-[14px] mt-1">{t('supportedBrowsers')}</div>
            </>
          ) : (
            <>
              <div className="font-medium mb-1">🧋 Sistem Manajemen Bubble Tea v2.0</div>
              <div>Hubungi administrator jika ada pertanyaan</div>
              <div className="text-[14px] mt-1">Browser yang didukung: Chrome, Safari, Edge (versi terbaru)</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

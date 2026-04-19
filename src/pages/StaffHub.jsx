import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StaffPage from './StaffPage';
import SchedulePage from './SchedulePage';
import AttendancePage from './AttendancePage';
import OperationAuditPage from './OperationAuditPage';
import SalaryPage from './SalaryPage';
import TrainingPage from './TrainingPage';
import RewardPage from './RewardPage';

export default function StaffHub() {
  const { t } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';

  const tabs = [
    { key: 'info', label: t('staffInfo', '员工档案') },
    { key: 'schedule', label: t('schedule', '人员排班与排期') },
    { key: 'attendance', label: t('attendance', '考勤审计') },
    { key: 'training', label: t('training', '员工培训') },
    { key: 'reward', label: t('reward', '奖惩审计') },
    { key: 'hygiene', label: t('hygiene', '卫生检查') },
    { key: 'payroll', label: t('payroll', '薪资对账') }
  ];

  return (
    <div className="space-y-5 pb-32">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1">{t('staffHub', '人员与运营管理系统')}</h1>
        <p className="text-label-caps">{t('staffSubtitle', 'Training, Attendance, Payroll & Compliance')}</p>
      </div>

      <div className="bg-white/50 backdrop-blur-xl border border-white rounded-[40px] p-2 shadow-2xl flex flex-wrap gap-2 self-start ring-8 ring-slate-100/50">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSearchParams({ tab: tab.key })}
            className={`px-10 py-5 rounded-[32px] text-[13px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-3xl scale-105'
                : 'text-slate-400 hover:bg-white hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-soft">
        {activeTab === 'info' && <StaffPage hideHeader={true} />}
        {activeTab === 'schedule' && <SchedulePage hideHeader={true} />}
        {activeTab === 'attendance' && <AttendancePage hideHeader={true} />}
        {activeTab === 'training' && <TrainingPage hideHeader={true} />}
        {activeTab === 'reward' && <RewardPage />}
        {activeTab === 'hygiene' && <OperationAuditPage />}
        {activeTab === 'payroll' && <SalaryPage />}
      </div>
    </div>
  );
}

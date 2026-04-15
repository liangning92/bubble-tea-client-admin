import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AboutPage() {
  const { t, lang } = useAuth();
  const tl = (zh, en, id) => lang === 'zh' ? zh : lang === 'en' ? en : id;

  const version = '1.0.0';
  const buildDate = '2026-04-08';

  return (
    <div className="page">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-[32px] shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white">
          <img src="/shopwise-logo.png" className="w-full h-full object-cover" alt="Shopwise" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{tl('Shopwise 门店智能管理', 'Shopwise Management System', 'Shopwise Manajemen Sistem')}</h1>
        <div className="text-gray-500">
          {tl('版本', 'Version', 'Versi')} {version}
        </div>
      </div>

      {/* 系统信息 */}
      <div className="card mb-4">
        <h3 className="font-bold mb-4">{tl('📋 系统信息', '📋 System Information', '📋 Informasi Sistem')}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">{tl('系统名称', 'System Name', 'Nama Sistem')}</span>
            <span className="font-medium">{tl('Shopwise 门店智能管理', 'Shopwise Management System', 'Shopwise Manajemen Sistem')}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">{tl('版本号', 'Version', 'Versi')}</span>
            <span className="font-medium">v{version}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">{tl('构建日期', 'Build Date', 'Tanggal Build')}</span>
            <span className="font-medium">{buildDate}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">{tl('技术栈', 'Tech Stack', 'Stack Teknologi')}</span>
            <span className="font-medium text-sm">React + Node.js + Prisma</span>
          </div>
        </div>
      </div>

      {/* 功能模块 */}
      <div className="card mb-4">
        <h3 className="font-bold mb-4">{tl('📦 功能模块', '📦 Modules', '📦 Modul')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📦', zh: '库存管理', en: 'Inventory', id: 'Inventaris', desc: tl('原料入库出库、库存预警', 'Stock in/out, alerts', 'Barang masuk/keluar, notifikasi') },
            { icon: '📊', zh: '利润分析', en: 'Profit Analysis', id: 'Analisis Profit', desc: tl('营收成本利润统计', 'Revenue, cost, profit stats', 'Pendapatan, biaya, statistik profit') },
            { icon: '👥', zh: '人员管理', en: 'Staff Management', id: 'Manajemen Staff', desc: tl('员工考勤排班工资', 'Attendance, schedule, salary', 'Absen, jadwal, gaji') },
            { icon: '🧹', zh: '卫生管理', en: 'Hygiene', id: 'Kebersihan', desc: tl('卫生任务检查记录', 'Tasks, inspection, records', 'Tugas, pemeriksaan, catatan') },
            { icon: '📋', zh: '采购中心', en: 'Procurement', id: 'Pengadaan', desc: tl('流程集中的采购工作流', 'Centralized procurement', 'Alur kerja pengadaan') },
            { icon: '🚀', zh: '营销自动化', en: 'Marketing', id: 'Pemasaran', desc: tl('品牌推广与流量增长', 'Brand & Growth', 'Brand & Pertumbuhan') },
          ].map((mod, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span>{mod.icon}</span>
                <span className="font-medium text-sm">{mod.zh}</span>
              </div>
              <div className="text-[14px] text-gray-500">{mod.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 使用指南 */}
      <div className="card mb-4">
        <h3 className="font-bold mb-4">{tl('📖 快速入门', '📖 Quick Start', '📖 Mulai Cepat')}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="text-blue-500 font-bold">1.</span>
            <div>
              <div className="font-medium">{tl('库存管理', 'Inventory', 'Inventaris')}</div>
              <div className="text-gray-500">{tl('先导入原料数据，再录入配方', 'Import ingredients first, then recipes', 'Import bahan dulu, lalu resep')}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-500 font-bold">2.</span>
            <div>
              <div className="font-medium">{tl('全渠道销售', 'Sales', 'Penjualan')}</div>
              <div className="text-gray-500">{tl('全链路数据采集，自动集成核算', 'Full-chain data capture', 'Pengumpulan data otomatis')}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-500 font-bold">3.</span>
            <div>
              <div className="font-medium">{tl('AI 智能看板', 'AI Insights', 'Wawasan AI')}</div>
              <div className="text-gray-500">{tl('模型自动分析经营瓶颈与机会', 'Auto-analysis of bottlenecks', 'Analisis otomatis hambatan')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 联系支持 */}
      <div className="card">
        <h3 className="font-bold mb-4">{tl('📞 联系支持', '📞 Contact Support', '📞 Kontak Dukungan')}</h3>
        <div className="text-sm text-gray-500 space-y-2">
          <p>{tl('如有问题或建议，请联系系统管理员', 'For questions or suggestions, contact admin', 'Untuk pertanyaan atau saran, hubungi admin')}</p>
          <p>{tl('技术邮箱: support@shopwise-system.com', 'Email: support@shopwise-system.com', 'Email: support@shopwise-system.com')}</p>
        </div>
      </div>

      <div className="text-center mt-6 text-[14px] text-gray-400">
        © 2024-2026 {tl('Shopwise 门店智能管理', 'Shopwise Management System', 'Shopwise Manajemen Sistem')}. {tl('版权所有', 'All Rights Reserved', 'Hak Cipta Dilindungi')}.
      </div>
    </div>
  );
}

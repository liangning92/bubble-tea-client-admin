import React from 'react';
import { useAuth } from '../context/AuthContext';

const guideItems = [
  {
    icon: '📦',
    titleZh: '库存管理',
    titleId: 'Manajemen Inventaris',
    contentZh: '在「库存」页面，您可以查看当前所有原料的库存数量。点击原料可编辑预警值。系统会根据安全库存自动预警。',
    contentId: 'Di halaman 「Inventaris」, Anda dapat melihat semua stok bahan saat ini. Klik bahan untuk mengedit nilai peringatan. Sistem akan memperingatkan secara otomatis berdasarkan stok aman.',
  },
  {
    icon: '📥',
    titleZh: '采购入库',
    titleId: 'Penerimaan Pembelian',
    contentZh: '在「采购」页面创建采购订单，供应商送达后点击「确认入库」将原料加入库存。支持批量导入采购记录。',
    contentId: 'Di halaman 「Pembelian」, buat pesanan pembelian. Setelah barang arrives, klik 「Terima Barang」 untuk menambahkan ke inventaris. Mendukung impor batch.',
  },
  {
    icon: '📈',
    titleZh: '销售录入',
    titleId: 'Input Penjualan',
    contentZh: '在「销售」页面快捷录入每笔交易。支持批量导入销售记录（Excel或粘贴文本）。可按日期筛选查看历史销售。',
    contentId: 'Di halaman 「Penjualan」, input transaksi dengan cepat. Mendukung impor batch (Excel atau tempel teks). Dapat filter berdasarkan tanggal.',
  },
  {
    icon: '💰',
    titleZh: '费用管理',
    titleId: 'Manajemen Biaya',
    contentZh: '在「费用」页面记录各项支出：房租、人工、水电、耗材等。支持按日期筛选和批量导入。',
    contentId: 'Di halaman 「Biaya」, catat pengeluaran: sewa, tenaga kerja, utilitas, perlengkapan, dll. Mendukung filter tanggal dan impor batch.',
  },
  {
    icon: '📊',
    titleZh: '利润分析',
    titleId: 'Analisis Profit',
    contentZh: '在「利润」页面查看每日收入、成本、毛利和净利润。按产品查看单品利润和利润率。',
    contentId: 'Di halaman 「Profit」, lihat pendapatan harian, biaya, laba kotor, dan laba bersih. Lihat profit per produk dan margin profit.',
  },
  {
    icon: '👥',
    titleZh: '员工管理',
    titleId: 'Manajemen Staff',
    contentZh: '在「员工」页面管理员工信息、考勤、排班、工资、培训和奖惩记录。管理员可添加/编辑/删除员工。',
    contentId: 'Di halaman 「Staff」, kelola informasi staff, absen, jadwal, gaji, pelatihan, dan penghargaan. Admin dapat menambah/edit/hapus staff.',
  },
  {
    icon: '🧹',
    titleZh: '卫生管理',
    titleId: 'Manajemen Kebersihan',
    contentZh: '卫生管理包含4个页面：\n• 任务设置：创建和管理清洁任务\n• 卫生检查：提交检查记录，支持拍照上传\n• 记录查询：查询历史检查记录\n• 统计：查看各区域完成率和趋势',
    contentId: 'Kebersihan包含4个页面：\n• Pengaturan Tugas: Buat dan kelola tugas kebersihan\n• Pemeriksaan: Kirim catatan pemeriksaan, mendukung foto\n• Riwayat: Query riwayat pemeriksaan\n• Statistik: Lihat tingkat penyelesaian per area dan tren',
  },
  {
    icon: '📤',
    titleZh: '报表导出',
    titleId: 'Ekspor Laporan',
    contentZh: '在「导出」页面可导出日/月/年利润报表、成本报表、营收报表。支持导出为Excel或PDF格式。',
    contentId: 'Di halaman 「Ekspor」, ekspor laporan laba harian/bulanan/tahunan, laporan biaya, laporan pendapatan. Mendukung format Excel atau PDF.',
  },
  {
    icon: '🤖',
    titleZh: '智能导入',
    titleId: 'Import Cerdas',
    contentZh: '在「设置 > 智能导入」，您可以粘贴文本或上传文件（Excel/Word/PDF/图片），系统会自动识别并导入培训记录、卫生任务、费用等数据。',
    contentId: 'Di 「Pengaturan > Import Cerdas」, tempel teks atau upload file (Excel/Word/PDF/Gambar), sistem akan otomatis mengenali dan mengimpor data pelatihan, tugas kebersihan, biaya, dll.',
  },
  {
    icon: '⚙️',
    titleZh: '系统设置',
    titleId: 'Pengaturan Sistem',
    contentZh: '在「设置 > 系统设置」中，您可以：\n• 切换语言（中文/印尼语/英语）\n• 设置货币和日期格式\n• 启用/关闭通知\n• 导出全部数据为JSON\n• 清空业务数据',
    contentId: 'Di 「Pengaturan > Sistem」, Anda dapat:\n• Ganti bahasa (China/Indonesia/English)\n• Set mata uang dan format tanggal\n• Aktifkan/nonaktifkan notifikasi\n• Ekspor semua data sebagai JSON\n• Hapus data bisnis',
  },
  {
    icon: '🔔',
    titleZh: '消息提醒',
    titleId: 'Pengingat Pesan',
    contentZh: '系统会在以下情况发送提醒：\n• 库存低于安全值时\n• 采购订单待入库时\n• 卫生任务逾期未完成时\n• 异常检测到问题时',
    contentId: 'Sistem akan mengirim pengingat saat:\n• Stok di bawah nilai aman\n• Pesanan pembelian menunggu diterima\n• Tugas kebersihan overdue\n• Terdeteksi masalah anomali',
  },
  {
    icon: '🔐',
    titleZh: '账号安全',
    titleId: 'Keamanan Akun',
    contentZh: '请定期修改密码。管理员可以为员工创建不同权限的账号：管理员可管理所有功能，员工只能查看和操作被授权的功能。',
    contentId: 'Ganti sandi secara berkala. Admin dapat membuat akun dengan berbagai izin: Admin dapat kelola semua fungsi, staff hanya dapat melihat dan mengoperasikan fungsi yang diizinkan.',
  },
];

export default function UsageGuidePage() {
  const { t, lang } = useAuth();

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          {lang === 'zh' ? '📖 使用指南' : '📖 Panduan Penggunaan'}
        </h1>
      </div>

      {/* 快速导航 */}
      <div className="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="font-bold mb-3">{lang === 'zh' ? '🚀 快速导航' : '🚀 Navigasi Cepat'}</h3>
        <div className="grid grid-cols-3 gap-2">
          {guideItems.slice(0, 6).map((item, i) => (
            <div key={i} className="bg-white rounded-lg p-2 text-center border border-gray-100">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-[14px] font-medium">{lang === 'zh' ? item.titleZh : item.titleId}</div>
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
                <h3 className="font-bold mb-2">{lang === 'zh' ? item.titleZh : item.titleId}</h3>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {lang === 'zh' ? item.contentZh : item.contentId}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部信息 */}
      <div className="card mt-6 bg-gray-50 text-center">
        <div className="text-sm text-gray-500">
          {lang === 'zh' ? (
            <>
              <div className="font-medium mb-1">🧋 奶茶店管理系统 v2.0</div>
              <div>如有疑问请联系系统管理员</div>
              <div className="text-[14px] mt-1">支持浏览器：Chrome、Safari、Edge（最新版本）</div>
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

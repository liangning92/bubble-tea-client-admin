/**
 * 权限系统常量（前端）
 * 与 shared/permissions.js 保持一致
 */

// 权限粒度
export const PermissionLevel = {
  READ_WRITE: 'read_write',   // 可查看+可编辑
  READ_ONLY: 'read_only',     // 仅可查看
  HIDDEN: 'hidden',           // 不可查看
};

// 薪资查看权限（独立于 PermissionLevel）
export const SalaryViewLevel = {
  NONE: 'none',       // 不可查看
  OWN_ONLY: 'own_only', // 仅查看自己
  ALL: 'all',         // 查看全部
};

// 所有受控模块
export const PermissionModules = [
  { key: 'store_info', labelZh: '门店信息', labelEn: 'Store Info', labelId: 'Info Toko' },
  { key: 'staff_manage', labelZh: '员工管理', labelEn: 'Staff Management', labelId: 'Manajemen Staff' },
  { key: 'attendance', labelZh: '考勤打卡', labelEn: 'Attendance', labelId: 'Kehadiran' },
  { key: 'schedule', labelZh: '排班管理', labelEn: 'Schedule', labelId: 'Jadwal' },
  { key: 'salary', labelZh: '薪资/提成', labelEn: 'Salary/Commission', labelId: 'Gaji/Komisi' },
  { key: 'inventory', labelZh: '库存/物料', labelEn: 'Inventory', labelId: 'Inventaris' },
  { key: 'revenue_flow', labelZh: '营收流水', labelEn: 'Sales Revenue', labelId: 'Aliran Pendapatan' },
  { key: 'profit_detail', labelZh: '财务净利', labelEn: 'Profit Analysis', labelId: 'Analisis Keuntungan' },
  { key: 'expense_claim', labelZh: '成本报销', labelEn: 'Expense & Cost', labelId: 'Biaya & Reimburse' },
  { key: 'hygiene', labelZh: '卫生管理', labelEn: 'Hygiene Management', labelId: 'Manajemen Kebersihan' },
  { key: 'system', labelZh: '系统设置', labelEn: 'System Settings', labelId: 'Pengaturan Sistem' },
];

// 默认权限（admin 或未设置时全开）
export const DefaultPermissions = () => {
  const perms = {};
  PermissionModules.forEach(m => {
    perms[m.key] = PermissionLevel.READ_WRITE;
  });
  return perms;
};

// 全模块隐藏的基准权限（安全默认）
export const RestrictedPermissions = () => {
  const perms = {};
  PermissionModules.forEach(m => {
    perms[m.key] = PermissionLevel.HIDDEN;
  });
  return perms;
};

// 获取用户实际权限
export const resolvePermissions = (staffPermissions, userRole) => {
  // 只有系统 Admin 拥有绝对全权限
  if (userRole === 'admin') {
    return DefaultPermissions();
  }

  // 默认禁权逻辑：如果未设置权限，则返回全隐藏状态
  if (!staffPermissions || staffPermissions === '{}' || staffPermissions === null) {
    return RestrictedPermissions();
  }

  try {
    const parsed = typeof staffPermissions === 'string'
      ? JSON.parse(staffPermissions)
      : staffPermissions;
    
    // 初始化为全隐藏，然后合并实际分配的权限
    const result = RestrictedPermissions();
    Object.keys(parsed).forEach(key => {
      if (PermissionModules.find(m => m.key === key)) {
        result[key] = parsed[key];
      }
    });
    return result;
  } catch {
    return RestrictedPermissions();
  }
};

// 检查是否有访问权限
export const canAccess = (permissions, moduleKey) => {
  if (!permissions) return false;
  return permissions[moduleKey] !== PermissionLevel.HIDDEN;
};

// 检查是否有编辑权限
export const canEdit = (permissions, moduleKey) => {
  if (!permissions) return false;
  return permissions[moduleKey] === PermissionLevel.READ_WRITE;
};

// 权限选项（用于下拉选择）
export const PermissionOptions = [
  { value: PermissionLevel.READ_WRITE, labelZh: '可查看+可编辑', labelEn: 'Read + Write', labelId: 'Lihat + Edit' },
  { value: PermissionLevel.READ_ONLY, labelZh: '仅可查看', labelEn: 'Read Only', labelId: 'Hanya Lihat' },
  { value: PermissionLevel.HIDDEN, labelZh: '不可查看', labelEn: 'Hidden', labelId: 'Sembunyikan' },
];

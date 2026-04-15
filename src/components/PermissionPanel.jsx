import React, { useState } from 'react';
import { PermissionModules, PermissionOptions, PermissionLevel, SalaryViewLevel } from '../utils/permissions';

/**
 * 权限设置面板
 * @param {Object} props
 * @param {Object} props.permissions - 当前模块权限对象
 * @param {Function} props.onChange - 模块权限变更回调 (permissions) => void
 * @param {string} props.salaryView - 薪资查看权限: none | own_only | all
 * @param {Function} props.onSalaryViewChange - 薪资查看权限变更回调 (salaryView) => void
 * @param {string} props.lang - 当前语言
 */
export default function PermissionPanel({ permissions = {}, onChange, salaryView = 'all', onSalaryViewChange, lang = 'zh' }) {
  const [collapsed, setCollapsed] = useState(false);

  const getLabel = (item, field) => {
    if (lang === 'zh') return item[`labelZh`];
    if (lang === 'en') return item[`labelEn`];
    return item[`labelId`];
  };

  const getOptionLabel = (opt) => {
    if (lang === 'zh') return opt.labelZh;
    if (lang === 'en') return opt.labelEn;
    return opt.labelId;
  };

  const handleChange = (moduleKey, value) => {
    onChange({
      ...permissions,
      [moduleKey]: value,
    });
  };

  // 恢复默认（全开，仅管理员使用）
  const resetToDefault = () => {
    const defaultPerms = {};
    PermissionModules.forEach(m => {
      defaultPerms[m.key] = PermissionLevel.READ_WRITE;
    });
    onChange(defaultPerms);
    if (onSalaryViewChange) onSalaryViewChange(SalaryViewLevel.ALL);
  };

  // 新员工安全默认（全关）
  const resetToNewHire = () => {
    const defaultPerms = {};
    PermissionModules.forEach(m => {
      defaultPerms[m.key] = PermissionLevel.HIDDEN;
    });
    onChange(defaultPerms);
    if (onSalaryViewChange) onSalaryViewChange(SalaryViewLevel.NONE);
  };

  const salaryViewOptions = [
    { value: SalaryViewLevel.NONE, labelZh: '不可查看', labelEn: 'No Access', labelId: 'Tidak Akses' },
    { value: SalaryViewLevel.OWN_ONLY, labelZh: '仅查看自己', labelEn: 'View Own Only', labelId: 'Lihat Sendiri' },
    { value: SalaryViewLevel.ALL, labelZh: '查看全部', labelEn: 'View All', labelId: 'Lihat Semua' },
  ];

  return (
    <div className="permission-panel border rounded-2xl p-3 bg-gray-50/50">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-black text-slate-900 text-[13px] uppercase tracking-widest outline-none">
          🔐 {lang === 'zh' ? '权限设置' : lang === 'en' ? 'Permission Settings' : 'Pengaturan Izin'}
        </h4>
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-[12px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest px-2"
          >
            {collapsed ? (lang === 'zh' ? '展开' : 'Expand') : (lang === 'zh' ? '收起' : 'Collapse')}
          </button>
          <button
            type="button"
            onClick={resetToNewHire}
            className="px-2 py-1 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
          >
            🌱 {lang === 'zh' ? '清空' : lang === 'en' ? 'Clear' : 'Bersihkan'}
          </button>
          <button
            type="button"
            onClick={() => {
              const perms = {};
              PermissionModules.forEach(m => perms[m.key] = PermissionLevel.READ_WRITE);
              onChange(perms);
              onSalaryViewChange(SalaryViewLevel.ALL);
            }}
            className="px-2 py-1 bg-slate-900 text-white hover:bg-black rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
          >
             👑 {lang === 'zh' ? '店长' : 'Manager'}
          </button>
          <button
            type="button"
            onClick={() => {
              const perms = {};
              PermissionModules.forEach(m => {
                if (['attendance', 'hygiene', 'schedule'].includes(m.key)) perms[m.key] = PermissionLevel.READ_WRITE;
                else perms[m.key] = PermissionLevel.HIDDEN;
              });
              onChange(perms);
              onSalaryViewChange(SalaryViewLevel.OWN_ONLY);
            }}
            className="px-2 py-1 bg-white border border-slate-100 text-slate-500 hover:border-slate-900 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
          >
             ☕ {lang === 'zh' ? '店员' : 'Staff'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PermissionModules.map(module => (
              <div key={module.key} className="flex items-center gap-2 bg-white/50 p-2 rounded-xl border border-slate-50">
                <span className="text-[12px] font-bold text-slate-600 w-24 truncate" title={getLabel(module, 'labelZh')}>
                  {getLabel(module, 'labelZh')}
                </span>
                <select
                  className="bg-transparent text-[12px] font-black text-slate-900 flex-1 outline-none appearance-none cursor-pointer"
                  value={permissions[module.key] || PermissionLevel.READ_WRITE}
                  onChange={(e) => handleChange(module.key, e.target.value)}
                >
                  {PermissionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {getOptionLabel(opt)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* 薪资查看权限 */}
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-white/50 p-2 rounded-xl border border-slate-50">
              <span className="text-[12px] font-bold text-slate-600 w-24">
                {lang === 'zh' ? '薪资查看权限' : lang === 'en' ? 'Salary View' : 'Akses Gaji'}
              </span>
              <select
                className="bg-transparent text-[12px] font-black text-slate-900 flex-1 outline-none appearance-none cursor-pointer"
                value={salaryView}
                onChange={(e) => onSalaryViewChange && onSalaryViewChange(e.target.value)}
              >
                {salaryViewOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {getOptionLabel(opt)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {collapsed && (
        <div className="text-sm text-gray-500">
          {lang === 'zh' ? `已设置 ${Object.keys(permissions).length} 个模块权限`
            : lang === 'en' ? `${Object.keys(permissions).length} modules configured`
            : `${Object.keys(permissions).length} modul dikonfigurasi`}
        </div>
      )}
    </div>
  );
}

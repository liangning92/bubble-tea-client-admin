import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

const PERM_LABELS = {
  EDIT: { text: '可编辑', textEn: 'EDIT', color: 'bg-orange-500 text-white shadow-orange-500/20' },
  READ: { text: '可读', textEn: 'READ', color: 'bg-blue-600 text-white shadow-blue-600/20' },
  NONE: { text: '无权限', textEn: 'NONE', color: 'bg-slate-50 text-slate-300' }
};

export default function PermissionMatrix() {
  const { t } = useAuth();
  const [matrix, setMatrix] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'audit'
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const data = await api('GET', '/system/permissions/matrix');
      if (data && !data.error) {
        setMatrix(data);
      } else {
        // fallback: use hardcoded
        setMatrix(FALLBACK_MATRIX);
      }
    } catch (e) {
      console.error(e);
      setMatrix(FALLBACK_MATRIX);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await api('GET', '/system/permissions/audit-logs?limit=50');
      if (data && !data.error) {
        setAuditLogs(data.logs || []);
      } else {
        setAuditLogs([]);
      }
    } catch (e) {
      console.error(e);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{t('loading') || '加载中...'}</p>
        </div>
      </div>
    );
  }

  if (!matrix) {
    return <p className="text-center text-slate-400 py-12">{t('emptyState') || '暂无数据'}</p>;
  }

  const roles = Object.keys(matrix);

  // Build module list from permissions
  const modules = buildModules(matrix);

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-slate-100 pb-0">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-2 text-[13px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'matrix'
              ? 'border-orange-500 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {t('permMatrixTab') || '角色矩阵'}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-2 text-[13px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-orange-500 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {t('auditLogsTab') || '审计日志'}
        </button>
      </div>

      {activeTab === 'matrix' && (
        <PermissionMatrixView matrix={matrix} modules={modules} roles={roles} />
      )}

      {activeTab === 'audit' && (
        <AuditLogsView logs={auditLogs} loading={auditLoading} t={t} />
      )}
    </div>
  );
}

function PermissionMatrixView({ matrix, modules, roles }) {
  const { t } = useAuth();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map(role => {
          const roleData = matrix[role];
          const permCount = roleData?.permissions?.length || 0;
          const colorMap = { admin: 'bg-orange-50 border-orange-100', manager: 'bg-blue-50 border-blue-100', staff: 'bg-slate-50 border-slate-100' };
          const iconMap = { admin: '👑', manager: '🧑‍💼', staff: '👤' };
          return (
            <div key={role} className={`card-premium !p-8 !rounded-[32px] border ${colorMap[role] || 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{iconMap[role]}</span>
                <div>
                  <div className="font-black text-slate-900 text-[15px] uppercase tracking-tight">{roleData?.label || role}</div>
                  <div className="text-[12px] text-slate-400 font-black uppercase tracking-widest">{t('role') || '角色'}</div>
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{permCount}</div>
              <div className="text-[12px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('permCount') || '权限项'}</div>
            </div>
          );
        })}
      </div>

      {/* Permission Table */}
      <div className="card-premium !p-0 !rounded-[48px] bg-white border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('moduleCol') || '功能模块'}</th>
                {roles.map(r => (
                  <th key={r} className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                    {matrix[r]?.label || r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modules.map(m => (
                <tr key={m.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="font-black text-slate-900 text-[14px]">{m.label}</div>
                    <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{m.count} {t('permItems') || '项权限'}</div>
                  </td>
                  {roles.map(r => {
                    const perms = m.permsByRole[r] || [];
                    return (
                      <td key={r} className="p-6 text-center align-top">
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {perms.length === 0 ? (
                            <span className="text-[11px] text-slate-300 font-black uppercase">—</span>
                          ) : (
                            perms.map(p => (
                              <span key={p} className="inline-block bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg">
                                {p.split('.')[1] || p}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-slate-50/30 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
              {t('permMatrixHint') || '权限管控策略提示：修改后将立即在关联终端的下一次心跳周期生效'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditLogsView({ logs, loading, t }) {
  const actionColor = (action) => {
    if (!action) return 'bg-slate-100 text-slate-500';
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('remove')) return 'bg-red-50 text-red-600';
    if (a.includes('create') || a.includes('add')) return 'bg-emerald-50 text-emerald-600';
    if (a.includes('update') || a.includes('edit')) return 'bg-blue-50 text-blue-600';
    return 'bg-slate-50 text-slate-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('loading') || '加载中...'}</p>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">{t('noAuditLogs') || '暂无审计日志'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-premium !p-0 !rounded-[32px] bg-white border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('timeCol') || '时间'}</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('userCol') || '操作人'}</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('actionCol') || '操作'}</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('targetCol') || '目标'}</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('detailCol') || '详情'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-5 text-[12px] text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.occurredAt).toLocaleString()}
                  </td>
                  <td className="p-5">
                    <div className="text-[13px] font-black text-slate-900">{log.username}</div>
                    <div className="text-[11px] text-slate-400">{log.user?.role || '-'}</div>
                  </td>
                  <td className="p-5">
                    <span className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-full ${actionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-5 text-[13px] text-slate-600">
                    {log.target || '-'}
                    {log.targetId ? <span className="text-slate-400 ml-1">#{log.targetId}</span> : null}
                  </td>
                  <td className="p-5 text-[12px] text-slate-400 max-w-[200px] truncate">
                    {log.details ? JSON.parse(log.details)?.message || log.details : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ========== Helpers ==========

const FALLBACK_MATRIX = {
  admin: {
    label: '管理员',
    permissions: [
      'dashboard.view', 'dashboard.orders_stream', 'dashboard.alerts',
      'inventory.view', 'inventory.edit', 'inventory.delete',
      'products.view', 'products.edit', 'products.shelve',
      'recipe.view', 'recipe.edit',
      'sales.view', 'sales.export',
      'expense.view', 'expense.edit', 'expense.reimbursement.review',
      'staff.view', 'staff.edit', 'staff.delete',
      'attendance.view', 'attendance.edit',
      'payroll.view', 'payroll.calculate',
      'profit.view', 'profit.report_pdf',
      'tax.view', 'tax.npwp', 'tax.pb1',
      'supplier.view', 'supplier.edit',
      'system.config', 'system.permission_audit'
    ]
  },
  manager: {
    label: '店长',
    permissions: [
      'dashboard.view', 'dashboard.alerts',
      'inventory.view', 'inventory.edit',
      'products.view', 'products.shelve',
      'recipe.view',
      'sales.view', 'sales.export',
      'expense.view', 'expense.reimbursement.submit',
      'staff.view',
      'attendance.view',
      'payroll.view',
      'profit.view',
      'supplier.view',
      'system.config'
    ]
  },
  staff: {
    label: '员工',
    permissions: [
      'dashboard.view',
      'inventory.view',
      'products.view',
      'sales.view', 'sales.create',
      'expense.view', 'expense.reimbursement.submit',
      'attendance.view',
      'hygiene.view', 'hygiene.record'
    ]
  }
};

// Group permissions by module (prefix before the dot)
function buildModules(matrix) {
  const roleNames = Object.keys(matrix);
  const moduleMap = {};

  roleNames.forEach(role => {
    const perms = matrix[role]?.permissions || [];
    perms.forEach(p => {
      const [mod, ...rest] = p.split('.');
      if (!moduleMap[mod]) moduleMap[mod] = {};
      if (!moduleMap[mod][role]) moduleMap[mod][role] = [];
      moduleMap[mod][role].push(p);
    });
  });

  const MODULE_LABELS = {
    dashboard: '经营看板',
    inventory: '库存管理',
    products: '产品管理',
    recipe: '配方/BOM',
    sales: '销售数据',
    expense: '费用报销',
    staff: '员工管理',
    attendance: '考勤审计',
    payroll: '薪酬核算',
    profit: '利润与报表',
    tax: '税务合规',
    supplier: '供应商',
    system: '系统设置',
    hygiene: '卫生管理',
  };

  return Object.entries(moduleMap).map(([key, permsByRole]) => ({
    key,
    label: MODULE_LABELS[key] || key,
    count: new Set(Object.values(permsByRole).flat()).size,
    permsByRole
  })).sort((a, b) => a.key.localeCompare(b.key));
}

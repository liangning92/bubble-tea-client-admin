import React from 'react';

const PERM_LABELS = {
  EDIT: { text: '编辑', color: 'bg-orange-500 text-white shadow-orange-500/20' },
  READ: { text: '只读', color: 'bg-slate-900 text-white shadow-slate-900/20' },
  NONE: { text: '锁定', color: 'bg-slate-50 text-slate-300' }
};

export default function PermissionMatrix() {
  const roles = ['管理员', '店长', '普通员工'];
  const modules = [
    { key: 'revenue', label: '营收数据' },
    { key: 'inventory', label: '库存变动' },
    { key: 'payroll', label: '员工薪酬' },
    { key: 'costs', label: '成本录入' },
    { key: 'marketing', label: '营销活动' },
    { key: 'settings', label: '系统设置' }
  ];

  const matrix = {
    revenue: { 管理员: 'EDIT', 店长: 'READ', 普通员工: 'NONE' },
    inventory: { 管理员: 'EDIT', 店长: 'EDIT', 普通员工: 'READ' },
    payroll: { 管理员: 'EDIT', 店长: 'READ', 普通员工: 'NONE' },
    costs: { 管理员: 'EDIT', 店长: 'EDIT', 普通员工: 'NONE' },
    marketing: { 管理员: 'EDIT', 店长: 'EDIT', 普通员工: 'NONE' },
    settings: { 管理员: 'EDIT', 店长: 'NONE', 普通员工: 'NONE' }
  };

  return (
    <div className="card-premium !p-0 !rounded-[48px] bg-white border-slate-50 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50">
            <th className="p-8 text-[12px] font-black text-slate-400 uppercase tracking-widest">功能模块</th>
            {roles.map(r => (
              <th key={r} className="p-8 text-[12px] font-black text-slate-400 uppercase tracking-widest text-center">{r}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {modules.map(m => (
            <tr key={m.key} className="hover:bg-slate-50 transition-colors group">
              <td className="p-8">
                 <div className="font-black text-slate-900 text-[15px]">{m.label}</div>
              </td>
              {roles.map(r => {
                const perm = matrix[m.key][r];
                const cfg = PERM_LABELS[perm];
                return (
                  <td key={r} className="p-8 text-center child-center">
                    <button className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${cfg.color}`}>
                       {cfg.text}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="p-10 bg-slate-50/50 border-t border-slate-50">
         <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">权限管控策略提示：修改后将立即在关联终端的下一次心跳周期生效。</p>
         </div>
      </div>
    </div>
  );
}

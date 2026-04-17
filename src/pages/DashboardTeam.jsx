import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { i18n } from '../i18n';
import './DashboardTeam.css';

// Agent configuration (mirrors openclaw agents)
const AGENTS = [
  { id: 'doctor-agent', nameKey: 'agentNameCEO', icon: '⚡', roleKey: 'agentRoleCEO', color: '#ffd700' },
  { id: 'product-manager', nameKey: 'agentNameProductManager', icon: '📋', roleKey: 'agentRoleProductManager', color: '#00f0ff' },
  { id: 'data-collector', nameKey: 'agentNameDataCollector', icon: '📊', roleKey: 'agentRoleDataCollector', color: '#00ff88' },
  { id: 'tech-engineer', nameKey: 'agentNameTechEngineer', icon: '🔧', roleKey: 'agentRoleTechEngineer', color: '#b44aff' },
  { id: 'ux-designer', nameKey: 'agentNameUXDesigner', icon: '🎨', roleKey: 'agentRoleUXDesigner', color: '#ff8c00' },
  { id: 'growth-hacker', nameKey: 'agentNameGrowthHacker', icon: '🚀', roleKey: 'agentRoleGrowthHacker', color: '#ff2d78' },
  { id: 'operations-manager', nameKey: 'agentNameOperationsManager', icon: '⚙️', roleKey: 'agentRoleOperationsManager', color: '#00f0ff' },
  { id: 'sales-closer', nameKey: 'agentNameSalesCloser', icon: '💰', roleKey: 'agentRoleSalesCloser', color: '#00ff88' },
  { id: 'customer-success', nameKey: 'agentNameCustomerSuccess', icon: '🤝', roleKey: 'agentRoleCustomerSuccess', color: '#b44aff', cronId: 'customer-service' },
  { id: 'procurement', nameKey: 'agentNameProcurement', icon: '📦', roleKey: 'agentRoleProcurement', color: '#ffd700' },
];

// Mock agent task descriptions (keys for i18n)
const MOCK_TASK_KEYS = {
  'doctor-agent': 'taskDoctorAgent',
  'product-manager': 'taskProductManager',
  'data-collector': 'taskDataCollector',
  'tech-engineer': 'taskTechEngineer',
  'ux-designer': 'taskUXDesigner',
  'growth-hacker': 'taskGrowthHacker',
  'operations-manager': 'taskOperationsManager',
  'sales-closer': 'taskSalesCloser',
  'customer-success': 'taskCustomerSuccess',
};
  'procurement': 'taskProcurement',
};

// Mock cron job history for each agent
const MOCK_CRON_HISTORY = [
  { nameKey: 'cronSalesDataCollection', status: 'success', lastRun: '14:32:10', duration: '2.3s', nextRun: '15:00:00' },
  { nameKey: 'cronInventoryCheck', status: 'success', lastRun: '14:30:00', duration: '5.1s', nextRun: '15:00:00' },
  { nameKey: 'cronAnomalyScan', status: 'failed', lastRun: '14:28:45', duration: '0.8s', nextRun: '15:00:00' },
  { nameKey: 'cronReportGeneration', status: 'success', lastRun: '14:00:00', duration: '18.2s', nextRun: '15:00:00' },
  { nameKey: 'cronInventoryAlert', status: 'success', lastRun: '13:45:00', duration: '3.4s', nextRun: '14:45:00' },
];

// Determine real agent status from cron job data
function determineAgentStatus(cronJobs, agentId, t) {
  const now = Date.now();
  const MS_30_MIN = 30 * 60 * 1000;
  const MS_1_HOUR = 60 * 60 * 1000;
  const MS_6_HOURS = 6 * 60 * 60 * 1000;

  // Find all cron jobs for this agent
  const agentJobs = cronJobs.filter(job => {
    const cronAgentId = job.agentId || '';
    return cronAgentId === agentId ||
           cronAgentId === AGENTS.find(a => a.id === agentId)?.cronId;
  });

  if (agentJobs.length === 0) {
    return { status: 'idle', dot: '⚪', labelKey: 'agentStatusIdle', className: 'idle', lastActive: null };
  }

  // Find the most recent job run
  let mostRecentJob = null;
  let mostRecentRunAt = 0;
  let mostRecentStatus = 'idle';

  for (const job of agentJobs) {
    const runAt = job.state?.lastRunAtMs || 0;
    if (runAt > mostRecentRunAt) {
      mostRecentRunAt = runAt;
      mostRecentJob = job;
      mostRecentStatus = job.state?.lastRunStatus || job.state?.lastStatus || 'idle';
    }
  }

  // If no jobs have ever run (only nextRunAt), show scheduled status
  if (!mostRecentJob || !mostRecentRunAt) {
    const nextRunAt = agentJobs[0]?.state?.nextRunAtMs;
    if (nextRunAt && nextRunAt > now) {
      // Scheduled for future
      const hoursUntil = Math.round((nextRunAt - now) / 3600000);
      const timeStr = hoursUntil < 1 ? '不到1小时' : `${hoursUntil}小时后`;
      return { status: 'scheduled', dot: '⚪', labelKey: `agentStatusScheduled`, timeStr: timeStr, className: 'scheduled', lastActive: null };
    }
    return { status: 'idle', dot: '⚪', labelKey: 'agentStatusIdle', className: 'idle', lastActive: null };
  }

  const elapsed = now - mostRecentRunAt;
  const lastStatus = mostRecentJob.state?.lastRunStatus || mostRecentJob.state?.lastStatus || 'idle';

  // 1. Running now (lastRunStatus === "ok" within 30 min)
  if (lastStatus === 'ok' && elapsed < MS_30_MIN) {
    return { status: 'running', dot: '🟢', labelKey: 'agentStatusWorking', className: 'running', lastActive: mostRecentRunAt };
  }

  // 2. Currently running / executing
  const nextRunAt = mostRecentJob.state?.nextRunAtMs || 0;
  if (nextRunAt > 0 && nextRunAt < now + 60000 && elapsed < MS_30_MIN) {
    return { status: 'executing', dot: '🟡', labelKey: 'agentStatusExecuting', className: 'executing', lastActive: mostRecentRunAt };
  }

  // 3. Error within 1 hour
  if (lastStatus === 'error' && elapsed < MS_1_HOUR) {
    return { status: 'error', dot: '🔴', labelKey: 'agentStatusError', className: 'error', lastActive: mostRecentRunAt };
  }

  // 4. Success run within 1 hour
  if (lastStatus === 'ok' && elapsed < MS_1_HOUR) {
    return { status: 'running', dot: '🟢', labelKey: 'agentStatusWorking', className: 'running', lastActive: mostRecentRunAt };
  }

  // 5. Ran within 6 hours
  if (elapsed < MS_6_HOURS) {
    return { status: 'idle', dot: '🟡', labelKey: 'agentStatusIdleMid', className: 'idle', lastActive: mostRecentRunAt };
  }

  // 6. Otherwise
  return { status: 'idle', dot: '⚪', labelKey: 'agentStatusIdle', className: 'idle', lastActive: mostRecentRunAt };
}

function formatLastActive(lastRunAtMs, t) {
  if (!lastRunAtMs) return t('noRecords');
  const diff = Date.now() - lastRunAtMs;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t('justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${t('minutesAgo')}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t('hoursAgo')}`;
  return `${Math.floor(hours / 24)}${t('daysAgo')}`;
}

function getAgentStatsFromCron(cronJobs, agentId) {
  const agentJobs = cronJobs.filter(job => {
    const cronAgentId = job.agentId || '';
    return cronAgentId === agentId ||
           cronAgentId === AGENTS.find(a => a.id === agentId)?.cronId;
  });
  const successCount = agentJobs.filter(j => j.state?.lastRunStatus === 'ok').length;
  const failCount = agentJobs.filter(j => j.state?.lastRunStatus === 'error').length;
  return { successCount, failCount, totalCount: agentJobs.length };
}

// Floating particle component
function Particle({ style }) {
  return <div className="particle" style={style} />;
}

// Scanline overlay
function Scanlines() {
  return <div className="scanlines" />;
}

// Top Status Bar
function TopBar({ onRefresh, refreshing }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) => {
    return d.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const formatDate = (d) => {
    const curLang = localStorage.getItem('lang') || 'zh';
    const weekdays = i18n[curLang]?.weekdays || i18n.zh.weekdays;
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]} ${d.getFullYear()}`;
  };

  return (
    <div className="top-bar">
      <div className="top-bar-brand">
        <div className="top-bar-logo w-12 h-12 overflow-hidden bg-white rounded-full shadow-lg border border-slate-100 p-0.5">
           <img src="/shopwise-brand-logo.png" className="w-full h-full object-contain rounded-full" alt="Shopwise" />
        </div>
        <div>
          <div className="top-bar-title">店智汇 AI 智能生产管理终端</div>
          <div className="top-bar-subtitle uppercase tracking-widest text-[10px] opacity-60">SaaS 门店全链路智能控制系统</div>
        </div>
      </div>
      <div className="top-bar-right">
        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
          <span style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>⟳</span>
          {refreshing ? '同步中' : '刷新'}
        </button>
        <div className="top-bar-clock">
          <div className="clock-time">{formatTime(time)}</div>
          <div className="clock-date">{formatDate(time)}</div>
        </div>
        <div className="system-status">
          <div className="status-dot" />
          <span>系统在线运行</span>
        </div>
      </div>
    </div>
  );
}

// P0 Emergency Alerts Component (V2 Intelligence)
function P0Alerts({ anomalies, attendance, hygiene, onAction }) {
  const alerts = [];

  // 1. Inventory Alerts (Stock <= SafeStock)
  if (anomalies?.abnormalCount > 0) {
    alerts.push({
      id: 'inv-alert',
      severity: 'high',
      icon: '📦',
      title: `库存紧急: ${anomalies.abnormalCount} 项物料短缺`,
      desc: '珍珠、奶精库存已低于安全线，建议立即补货。',
      action: '自动生成采购单',
      link: '/inventory'
    });
  }

  // 2. Attendance Alerts (3 days tardy)
  if (attendance?.critical > 0) {
    alerts.push({
      id: 'att-alert',
      severity: 'medium',
      icon: '👥',
      title: `${attendance.critical} 名员工考勤预警`,
      desc: '监测到部分员工连续3天记录异常，请核对。',
      action: '查看明细',
      link: '/attendance'
    });
  }

  // 3. Hygiene Alerts (Pending tasks)
  if (hygiene?.pendingCount > 0) {
    alerts.push({
      id: 'hyg-alert',
      severity: 'low',
      icon: '🧹',
      title: `卫生合规: ${hygiene.pendingCount} 项待完成`,
      desc: '今日仍有关键卫生任务未打卡，请督促执行。',
      action: '查看任务',
      link: '/hygiene'
    });
  }

  // 4. Marketing Achievements (V2.1 Growth Engine)
  if (anomalies?.marketingConv > 0) {
    alerts.push({
      id: 'mkt-alert',
      severity: 'high',
      icon: '🚀',
      title: `增长达成: 召回 ${anomalies.marketingConv} 名会员`,
      desc: '昨日自动化回归礼包触达成功，召回沉睡会员并产生复购。',
      action: '查看 ROI 报表',
      link: '/crm'
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="p0-alerts-container animate-fade-in">
      <div className="section-header">
        <span className="section-icon">🚨</span>
        <span className="section-title">待处理异常 (P0)</span>
        <div className="section-line"></div>
      </div>
      <div className="p0-alerts-grid">
        {alerts.map(alert => (
          <div key={alert.id} className={`p0-alert-card severity-${alert.severity}`}>
            <div className="p0-alert-icon">{alert.icon}</div>
            <div className="p0-alert-body">
              <div className="p0-alert-title">{alert.title}</div>
              <div className="p0-alert-desc">{alert.desc}</div>
            </div>
            <button className="p0-alert-action" onClick={() => onAction(alert.link)}>
              {alert.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Agent Card (expandable)
function AgentCard({ agent, expanded, onToggle, statusInfo, cronJobs = [] }) {
  const status = statusInfo?.status || 'idle';
  const lastActive = statusInfo?.lastActive ? formatLastActive(statusInfo.lastActive, t) : '暂无记录';
  const task = MOCK_TASK_KEYS[agent.id] ? t(MOCK_TASK_KEYS[agent.id]) : t('noTask');
  const agentStats = statusInfo?.stats || { successCount: 0, failCount: 0, totalCount: 0 };

  const statusConfig = {
    running: { labelKey: 'agentStatusWorking', dot: '🟢', className: 'running' },
    executing: { labelKey: 'agentStatusExecuting', dot: '🟡', className: 'executing' },
    idle: { labelKey: 'agentStatusIdle', dot: '⚪', className: 'idle' },
    error: { labelKey: 'agentStatusError', dot: '🔴', className: 'error' },
  };
  const cfg = statusConfig[status] || statusConfig.idle;
  const statusLabel = t(cfg.labelKey);

  const cfg = statusConfig[status] || statusConfig.idle;
  const learningProgress = Math.round(((agent.id.charCodeAt(0) * 7) % 100));

  return (
    <div
      className={`glass-card agent-card status-${status} expandable-card ${expanded ? 'expanded' : ''}`}
      onClick={onToggle}
      style={{ cursor: 'pointer' }}
    >
      <div className="scanner-line" />
      <div className="agent-header">
        <div className={`agent-avatar ${cfg.className}`} style={{ fontSize: 22 }}>
          {agent.icon}
        </div>
        <div className="agent-info">
          <div className="agent-name">{t(agent.nameKey)}</div>
          <div className="agent-role">{t(agent.roleKey)}</div>
        </div>
        <div className="expand-arrow" style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.6 }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      <div className={`agent-status-badge ${cfg.className}`}>
        <span className="status-dot-sm" />
        {cfg.dot} {cfg.label}
      </div>

      <div className="agent-task">📌 {task}</div>

      <div className="agent-footer">
        <span className="agent-last-active">⏱ {lastActive}</span>
        <span className="agent-model">M2.7</span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="expand-content agent-details">
          <div className="detail-divider" />
          <div className="detail-section-title">📋 最近任务 (Cron Jobs)</div>
          <div className="cron-job-list">
            {cronJobs.length === 0 && (
              <div style={{ fontSize: 12, color: 'rgba(224,232,255,0.3)', padding: '8px 0' }}>暂无定时任务</div>
            )}
            {cronJobs.map((job, i) => {
              const runStatus = job.state?.lastRunStatus || job.state?.lastStatus || 'idle';
              const runAt = job.state?.lastRunAtMs;
              const timeStr = runAt ? new Date(runAt).toLocaleTimeString('zh-CN', { hour12: false }) : '—';
              return (
                <div key={i} className="cron-job-item">
                  <div className="cron-job-left">
                    <span className={`cron-status-dot ${runStatus === 'ok' ? 'success' : runStatus === 'error' ? 'failed' : 'pending'}`} />
                    <span className="cron-job-name">{t(job.nameKey)}</span>
                  </div>
                  <div className="cron-job-right">
                    <span className="cron-time">{timeStr}</span>
                    <span className={`cron-badge ${runStatus === 'ok' ? 'success' : runStatus === 'error' ? 'failed' : 'pending'}`}>
                      {runStatus === 'ok' ? '✓' : runStatus === 'error' ? '✗' : '○'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="detail-divider" />

          <div className="detail-section-title">⏱ 运行统计</div>
          <div className="stats-row-mini">
            <div className="stat-mini-item">
              <span className="stat-mini-value green">{agentStats.successCount}</span>
              <span className="stat-mini-label">成功</span>
            </div>
            <div className="stat-mini-item">
              <span className="stat-mini-value red">{agentStats.failCount}</span>
              <span className="stat-mini-label">失败</span>
            </div>
            <div className="stat-mini-item">
              <span className="stat-mini-value cyan">{agentStats.totalCount}</span>
              <span className="stat-mini-label">总计</span>
            </div>
          </div>

          <div className="detail-divider" />

          <div className="detail-section-title">🧠 学习进度</div>
          <div className="learning-progress-bar">
            <div className="learning-progress-fill" style={{ width: `${learningProgress}%` }} />
          </div>
          <div className="learning-progress-label">
            <span>知识库学习</span>
            <span style={{ color: '#00ff88' }}>{learningProgress}%</span>
          </div>
          <div className="learning-meta" style={{ marginTop: 6 }}>
            <span style={{ opacity: 0.5 }}>最后学习: </span>
            <span>{lastActive}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card
function StatCard({ value, label, color, icon, glow }) {
  return (
    <div className="glass-card stat-card" style={{ '--stat-color': color, '--stat-glow': glow }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// System Status Panel (expandable)
function SystemPanel({ anomalies, pendingOrders, salesSummary, loading, expanded, onToggle }) {
  if (loading) {
    return (
      <div className="glass-card panel">
        <div className="panel-title">
          <span>🖥️</span>
          <span className="section-title">系统状态</span>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: 36, marginBottom: 8, borderRadius: 6 }} />
        ))}
      </div>
    );
  }

  const abnormalCount = anomalies?.abnormalCount || 0;
  const highSeverity = anomalies?.high || 0;

  // Mock detailed data for expanded view
  const mockInventoryAnomalies = [
    { name: '珍珠 (Tapioca Pearls)', deviation: '+23%', status: 'warning' },
    { name: '奶盖 (Cheese Foam)', deviation: '-15%', status: 'critical' },
    { name: '椰果 (Coconut Jelly)', deviation: '-8%', status: 'normal' },
    { name: '茶叶 (Tea Leaves)', deviation: '+5%', status: 'normal' },
  ];

  const mockSalesByProduct = [
    { name: '珍珠奶茶', count: 142, revenue: 'Rp 2,840,000' },
    { name: '奶盖系列', count: 98, revenue: 'Rp 2,450,000' },
    { name: '水果茶', count: 67, revenue: 'Rp 1,876,000' },
    { name: '椰奶系列', count: 43, revenue: 'Rp 1,075,000' },
  ];

  const mockPendingPurchases = [
    { id: 'PO-2024-0182', supplier: '大昌食材供应商', items: '珍珠 100kg / 椰果 50kg', eta: '今日 18:00' },
    { id: 'PO-2024-0183', supplier: '新鲜乳业', items: '奶盖原料 30箱', eta: '明日 09:00' },
  ];

  return (
    <div className={`glass-card panel expandable-panel ${expanded ? 'expanded' : ''}`} onClick={onToggle} style={{ cursor: 'pointer' }}>
      <div className="panel-title">
        <span>🖥️</span>
        <span className="section-title">系统状态</span>
        <span className="expand-arrow" style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>
          {expanded ? '▲ 收起' : '▼ 展开'}
        </span>
      </div>

      <div className="system-metric">
        <span className="metric-label">
          <span style={{ opacity: 0.5 }}>⚡</span> 服务器状态
        </span>
        <span className="metric-value green">● 正常</span>
      </div>

      <div className="system-metric">
        <span className="metric-label">
          <span style={{ opacity: 0.5 }}>📊</span> 库存异常项
        </span>
        <span className={`metric-value ${abnormalCount > 0 ? 'orange' : 'green'}`}>
          {abnormalCount} {abnormalCount > 0 && '⚠'}
        </span>
      </div>

      {highSeverity > 0 && (
        <div className="system-metric">
          <span className="metric-label">
            <span style={{ opacity: 0.5 }}>🚨</span> 严重偏差
          </span>
          <span className="metric-value red">{highSeverity}</span>
        </div>
      )}

      <div className="system-metric">
        <span className="metric-label">
          <span style={{ opacity: 0.5 }}>📦</span> 待入库订单
        </span>
        <span className="metric-value cyan">{pendingOrders || 0}</span>
      </div>

      <div className="system-metric">
        <span className="metric-label">
          <span style={{ opacity: 0.5 }}>💰</span> 今日销售额
        </span>
        <span className="metric-value green">
          {salesSummary ? `Rp ${Math.round(salesSummary).toLocaleString('id-ID')}` : '—'}
        </span>
      </div>

      <div className="system-metric">
        <span className="metric-label">
          <span style={{ opacity: 0.5 }}>🧋</span> 今日订单数
        </span>
        <span className="metric-value purple">{salesSummary?.count || '—'}</span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="expand-content">
          <div className="detail-divider" />

          <div className="detail-section-title">📦 库存异常详细</div>
          <div className="anomaly-list">
            {mockInventoryAnomalies.map((item, i) => (
              <div key={i} className="anomaly-item">
                <span className="anomaly-name">{item.name}</span>
                <span className={`anomaly-deviation ${item.status}`}>{item.deviation}</span>
                <span className={`anomaly-status-badge ${item.status}`}>
                  {item.status === 'critical' ? '⚠ 严重' : item.status === 'warning' ? '⚡ 注意' : '✓ 正常'}
                </span>
              </div>
            ))}
          </div>

          <div className="detail-divider" />

          <div className="detail-section-title">💰 销售明细 (按产品)</div>
          <div className="sales-detail-list">
            {mockSalesByProduct.map((item, i) => (
              <div key={i} className="sales-detail-item">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{item.name}</div>
                  <div style={{ opacity: 0.5, fontSize: 10 }}>× {item.count} 杯</div>
                </div>
                <div style={{ color: '#00ff88', fontFamily: 'Orbitron, monospace', fontSize: 12 }}>
                  {item.revenue}
                </div>
              </div>
            ))}
          </div>

          <div className="detail-divider" />

          <div className="detail-section-title">📦 待入库订单</div>
          <div className="pending-po-list">
            {mockPendingPurchases.map((po, i) => (
              <div key={i} className="pending-po-item">
                <div className="pending-po-id">{po.id}</div>
                <div className="pending-po-supplier">{po.supplier}</div>
                <div className="pending-po-items">{po.items}</div>
                <div className="pending-po-eta">预计 {po.eta}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Learning Insights Panel (expandable)
function InsightsPanel({ loading, expanded, onToggle }) {
  if (loading) {
    return (
      <div className="glass-card panel">
        <div className="panel-title">
          <span>🧠</span>
          <span className="section-title">学习洞察</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: 50, marginBottom: 8, borderRadius: 6 }} />
        ))}
      </div>
    );
  }

  const insights = [
    { text: '周五下午（15:00-18:00）为销售高峰，建议增加备货量 20%', agent: '数据采集师', time: '今日 14:30' },
    { text: '珍珠库存消耗速度超出预期，建议本周补货 50kg', agent: '采购管理', time: '今日 13:15' },
    { text: '会员复购率达 68%，老客营销 ROI 更高', agent: '增长黑客', time: '今日 11:00' },
    { text: '奶油顶供应稳定，但注意椰果库存偏低', agent: '运营经理', time: '昨日 22:00' },
  ];

  const fullReport = `【AI 学习报告 - 第47周】
  
📊 核心发现:
1. 销售高峰预测准确率: 94.2%
2. 库存消耗预测误差: < 5%
3. 客户满意度趋势: +8.3% QoQ

🧠 模型学习成果:
- 新增产品偏好模式 12 种
- 优化价格敏感度模型
- 更新库存预警阈值 5 项

⚙️ 系统优化建议:
- 建议周二至周四增加早班人员 1 人
- 建议促销重心从新品转向会员复购
- 建议椰果类饮品作为下周主推`;

  return (
    <div className={`glass-card panel expandable-panel ${expanded ? 'expanded' : ''}`} onClick={onToggle} style={{ cursor: 'pointer' }}>
      <div className="panel-title">
        <span>🧠</span>
        <span className="section-title">学习洞察</span>
        <span className="neon-badge purple" style={{ marginLeft: 4 }}>智能诊断</span>
        <span className="expand-arrow" style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>
          {expanded ? '▲ 收起' : '▼ 展开'}
        </span>
      </div>

      {insights.map((insight, i) => (
        <div key={i} className="insight-item">
          <div className="insight-text">💡 {insight.text}</div>
          <div className="insight-meta">{insight.agent} · {insight.time}</div>
        </div>
      ))}

      {/* Expanded Details */}
      {expanded && (
        <div className="expand-content">
          <div className="detail-divider" />
          <div className="detail-section-title">📄 完整学习报告</div>
          <div className="full-report">
            {fullReport.split('\n').map((line, i) => (
              <div key={i} style={{
                fontSize: 11,
                lineHeight: 1.8,
                color: line.startsWith('【') ? '#00f0ff' : line.startsWith('📊') || line.startsWith('🧠') || line.startsWith('⚙️') ? '#ffd700' : 'rgba(224,232,255,0.7)',
                fontWeight: line.startsWith('【') ? 700 : 400,
              }}>
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Task Status Panel (expandable)
function TaskStatusPanel({ stats, expanded, onToggle }) {
  // Mock detailed task list for expanded view
  const mockTaskList = [
    { name: '数据采集 - 昨日销售汇总', agent: '数据采集师', status: 'done', runTime: '08:15:32', nextRun: '08:30:00', duration: '3.2s' },
    { name: '库存扫描 - 异常检测', agent: '运营经理', status: 'done', runTime: '08:20:10', nextRun: '08:30:00', duration: '5.8s' },
    { name: '价格推荐计算', agent: '产品经理', status: 'inProgress', runTime: '08:25:00', nextRun: '08:30:00', duration: '—' },
    { name: '促销推送发送', agent: '增长黑客', status: 'failed', runTime: '08:22:45', nextRun: '08:30:00', duration: 'TIMEOUT' },
    { name: '员工排班优化', agent: '运营经理', status: 'done', runTime: '08:18:00', nextRun: '09:00:00', duration: '12.4s' },
    { name: '会员积分计算', agent: '销售成交', status: 'done', runTime: '08:24:30', nextRun: '08:30:00', duration: '2.1s' },
    { name: '供应商报价分析', agent: '采购管理', status: 'pending', runTime: '—', nextRun: '09:00:00', duration: '—' },
    { name: '舆情监控扫描', agent: '客户成功', status: 'inProgress', runTime: '08:25:45', nextRun: '08:30:00', duration: '—' },
  ];

  return (
    <div
      className={`glass-card panel ${expanded ? 'expanded' : ''}`}
      style={{ marginBottom: 24, cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div className="panel-title">
        <span>📋</span>
        <span className="section-title">今日任务状态</span>
        <span className="expand-arrow" style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>
          {expanded ? '▲ 收起' : '▼ 展开详情'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
        <div>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 24,
            fontWeight: 700,
            color: '#00f0ff',
            textShadow: '0 0 15px rgba(0,240,255,0.5)'
          }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(224,232,255,0.4)', marginTop: 4 }}>
            任务总数
          </div>
        </div>
        <div>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 24,
            fontWeight: 700,
            color: '#ffd700',
            textShadow: '0 0 15px rgba(255,215,0,0.5)'
          }}>
            {stats.inProgress}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(224,232,255,0.4)', marginTop: 4 }}>
            进行中
          </div>
        </div>
        <div>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 24,
            fontWeight: 700,
            color: '#00ff88',
            textShadow: '0 0 15px rgba(0,255,136,0.5)'
          }}>
            {stats.done}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(224,232,255,0.4)', marginTop: 4 }}>
            已完成
          </div>
        </div>
        <div>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 24,
            fontWeight: 700,
            color: '#ff2d78',
            textShadow: '0 0 15px rgba(255,45,120,0.5)'
          }}>
            {stats.failed}
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(224,232,255,0.4)', marginTop: 4 }}>
            失败/超时
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 16 }}>
        <div className="progress-bar-container">
          <div className="progress-label">
            <span>完成进度</span>
            <span style={{ color: '#00ff88' }}>{stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Details - Full Task List */}
      {expanded && (
        <div className="expand-content">
          <div className="detail-divider" />
          <div className="detail-section-title">📋 所有任务详细列表</div>
          <div className="task-detail-list">
            {mockTaskList.map((task, i) => (
              <div key={i} className="task-detail-item">
                <div className="task-detail-left">
                  <span className={`task-status-dot ${task.status}`} />
                  <div>
                    <div className="task-detail-name">{task.name}</div>
                    <div className="task-detail-meta">{task.agent}</div>
                  </div>
                </div>
                <div className="task-detail-right">
                  <span className={`task-status-badge ${task.status}`}>
                    {task.status === 'done' ? '✓ 完成' : task.status === 'inProgress' ? '◐ 进行中' : task.status === 'failed' ? '✗ 失败' : '○ 待执行'}
                  </span>
                  <div className="task-detail-time">
                    {task.runTime !== '—' ? (
                      <>
                        <span style={{ opacity: 0.5 }}>运行: </span>{task.runTime}
                        {task.duration !== '—' && <span style={{ opacity: 0.5 }}> ({task.duration})</span>}
                      </>
                    ) : (
                      <span style={{ opacity: 0.5 }}>—</span>
                    )}
                  </div>
                  <div className="task-detail-next">
                    <span style={{ opacity: 0.5 }}>下次: </span>
                    <span style={{ color: '#00f0ff' }}>{task.nextRun}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Floating particles
function Particles() {
  const particles = useRef([]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    particles.current = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      background: [
        'rgba(0,240,255,0.6)',
        'rgba(180,74,255,0.5)',
        'rgba(0,255,136,0.4)',
        'rgba(255,45,120,0.4)',
      ][Math.floor(Math.random() * 4)],
      animationDuration: Math.random() * 15 + 10,
      animationDelay: Math.random() * 10,
    }));
    forceUpdate(n => n + 1);
  }, []);

  return (
    <>
      <div className="dashboard-bg" />
      <div className="dashboard-grid-overlay" />
      {particles.current.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            background: p.background,
            animationDuration: `${p.animationDuration}s`,
            animationDelay: `${p.animationDelay}s`,
          }}
        />
      ))}
    </>
  );
}

// Main Dashboard Component
export default function DashboardTeam() {
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [anomalies, setAnomalies] = useState(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [todaySales, setTodaySales] = useState(null);
  const [stats, setStats] = useState({ total: 47, inProgress: 12, done: 31, failed: 4 });
  const [loading, setLoading] = useState(true);
  const [forceRender, setForceRender] = useState(0);
  const [cronJobs, setCronJobs] = useState([]);
  const [dashboardAlerts, setDashboardAlerts] = useState(null);

  // Expand state for panels
  const [expandedAgents, setExpandedAgents] = useState({});
  const [expandedTaskPanel, setExpandedTaskPanel] = useState(false);
  const [expandedSystemPanel, setExpandedSystemPanel] = useState(false);
  const [expandedInsightsPanel, setExpandedInsightsPanel] = useState(false);

  const toggleAgent = (agentId) => {
    setExpandedAgents(prev => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  // Fetch all data
  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const today = new Date().toISOString().split('T')[0];

      const [anomaliesRes, salesRes, cronRes, alertsRes] = await Promise.allSettled([
        fetch('/api/anomalies?days=7', { headers }).then(r => r.json()),
        fetch(`/api/sales?startDate=${today}&endDate=${today}`, { headers }).then(r => r.json()),
        fetch('/api/cron', { headers }).then(r => r.json()).catch(() => ({ jobs: [] })),
        fetch('/api/dashboard/alerts', { headers }).then(r => r.json()),
      ]);

      if (anomaliesRes.status === 'fulfilled') {
        const anomalyData = anomaliesRes.value?.data || anomaliesRes.value;
        setAnomalies(anomalyData || null);
      }

      if (salesRes.status === 'fulfilled') {
        const salesData = salesRes.value?.data || salesRes.value;
        if (Array.isArray(salesData)) {
          const total = salesData.reduce((sum, s) => sum + (s.quantity || 0) * (s.unitPrice || 0), 0);
          setTodaySales({ total, count: salesData.length });
        }
      }

      if (cronRes.status === 'fulfilled' && cronRes.value?.jobs) {
        setCronJobs(cronRes.value.jobs);
      }

      if (alertsRes.status === 'fulfilled') {
        setDashboardAlerts(alertsRes.value);
      }
    } catch (e) {
      console.warn('[DashboardTeam] Failed to load data:', e.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Fetch pending orders
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/purchases/pending', {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        setPendingOrders(Array.isArray(items) ? items.length : 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
      setForceRender(n => n + 1); // Trigger agent status refresh
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Total agents & running count (from real cron data)
  const runningCount = AGENTS.filter(a => {
    const info = determineAgentStatus(cronJobs, a.id, t);
    return info.status === 'running' || info.status === 'executing';
  }).length;

  return (
    <div className="dashboard-container">
      <Particles />
      <Scanlines />

      <div className="dashboard-content">
        {/* Back nav */}
        <div style={{ paddingTop: 12, marginBottom: 8 }}>
          <a className="back-link" onClick={() => navigate('/')}>
            ← 返回主面板
          </a>
        </div>

        {/* Top Bar */}
        <TopBar onRefresh={loadData} refreshing={refreshing} />

        {/* Adaptive Layout Wrapper (Vision V2.3) */}
        <div className="dashboard-layout-main">
          {/* Left Column: Primary Monitoring Feed */}
          <div className="dashboard-column-feed">
            {/* 🚨 P0 智能预警区 (VISION V2) */}
            <P0Alerts 
              anomalies={anomalies} 
              attendance={{ critical: dashboardAlerts?.counts?.attendance || 0 }} 
              hygiene={{ pendingCount: dashboardAlerts?.counts?.hygiene || 0 }} 
              onAction={(link) => navigate(link)}
            />

            {/* Stats Row (Responsive Grid in CSS) */}
            <div className="stats-grid-container">
              <StatCard
                icon="💰"
                value={(todaySales?.total || 0).toLocaleString()}
                label="今日营收 (Rp)"
                color="#00f0ff"
                glow="rgba(0,240,255,0.5)"
              />
              <StatCard
                icon="📈"
                value={((todaySales?.total || 0) * 0.4).toLocaleString()}
                label="预计净利 (Rp)"
                color="#00ff88"
                glow="rgba(0,255,136,0.5)"
              />
              <StatCard
                icon="🚀"
                value={((dashboardAlerts?.counts?.marketingTips || 0) * 12.5).toFixed(1) + "x"}
                label="营销 ROI"
                color="#ff2d78"
                glow="rgba(255,45,120,0.5)"
              />
              <StatCard
                icon="👥"
                value={dashboardAlerts?.counts?.memberGain || 0}
                label="新增会员"
                color="#00ff88"
                glow="rgba(0,255,136,0.5)"
              />
            </div>

            {/* Agent Grid */}
            <div className="section-header">
              <span className="section-icon">🤖</span>
              <span className="section-title">Agent 智能舰队</span>
              <div className="section-line" />
              <div className="status-badge-mini">
                {runningCount}/{AGENTS.length} ACTIVE
              </div>
            </div>
            
            <div className="agent-grid" key={forceRender}>
              {AGENTS.map(agent => {
                const statusInfo = {
                  ...determineAgentStatus(cronJobs, agent.id, t),
                  stats: getAgentStatsFromCron(cronJobs, agent.id),
                };
                const agentCronJobs = cronJobs.filter(job => {
                  const cronAgentId = job.agentId || '';
                  return cronAgentId === agent.id || cronAgentId === agent.cronId;
                });
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    expanded={!!expandedAgents[agent.id]}
                    onToggle={() => toggleAgent(agent.id)}
                    statusInfo={statusInfo}
                    cronJobs={agentCronJobs}
                  />
                );
              })}
            </div>
          </div>

          {/* Right Column: Auxiliary Insights & Control */}
          <div className="dashboard-column-side">
            {/* Task Status Panel */}
            <TaskStatusPanel
              stats={stats}
              expanded={expandedTaskPanel}
              onToggle={() => setExpandedTaskPanel(v => !v)}
            />

            {/* System Status Panel */}
            <SystemPanel
              anomalies={anomalies}
              pendingOrders={pendingOrders}
              salesSummary={todaySales}
              loading={loading}
              expanded={expandedSystemPanel}
              onToggle={() => setExpandedSystemPanel(v => !v)}
            />

            {/* Insights Panel */}
            <InsightsPanel
              loading={loading}
              expanded={expandedInsightsPanel}
              onToggle={() => setExpandedInsightsPanel(v => !v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

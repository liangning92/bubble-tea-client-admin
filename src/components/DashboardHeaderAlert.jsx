import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';

/**
 * DashboardHeaderAlert - 仪表板顶部异常聚合组件
 * 显示库存预警、考勤异常、卫生超时的聚合数量
 * 点击展开显示详细分类，点击分类跳转到对应页面
 */
const DashboardHeaderAlert = () => {
  const navigate = useNavigate();
  const { t } = useAuth();
  const [alertsData, setAlertsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(true);

  // 获取异常数据
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api('GET', '/dashboard/alerts');
      
      // 确保数据格式正确
      if (data && data.counts) {
        setAlertsData(data);
      } else {
        // 如果API返回格式不同，尝试适配
        console.warn('API返回格式与预期不同:', data);
        setAlertsData({
          counts: {
            inventory: data?.inventory?.length || 0,
            attendance: data?.attendance?.length || 0,
            hygiene: data?.hygiene?.length || 0,
            total: (data?.inventory?.length || 0) + 
                   (data?.attendance?.length || 0) + 
                   (data?.hygiene?.length || 0)
          }
        });
      }
    } catch (err) {
      console.error('获取异常数据失败:', err);
      setError(t('dashboardAlertError'));
      // 设置默认数据用于演示
      setAlertsData({
        counts: {
          inventory: 0,
          attendance: 0,
          hygiene: 0,
          total: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // 每30秒刷新一次数据
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // 处理分类点击跳转
  const handleCategoryClick = (category) => {
    switch (category) {
      case 'inventory':
        navigate('/inventory');
        break;
      case 'attendance':
        navigate('/attendance');
        break;
      case 'hygiene':
        navigate('/hygiene');
        break;
      default:
        break;
    }
  };

  // 处理总异常点击
  const handleTotalClick = () => {
    setExpanded(!expanded);
    // 点击时停止脉冲动画
    setPulseAnimation(false);
  };

  // 如果没有异常数据或总数为0，不显示组件
  if (!alertsData || alertsData.counts.total === 0) {
    return null;
  }

  // 分类配置
  const categories = [
    {
      key: 'inventory',
      label: t('inventoryAlert'),
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      icon: '📦',
      description: t('inventoryAlertDesc')
    },
    {
      key: 'attendance',
      label: t('attendanceAlert'),
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      icon: '📋',
      description: t('attendanceAlertDesc')
    },
    {
      key: 'hygiene',
      label: t('hygieneAlert'),
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
      icon: '🧹',
      description: t('hygieneAlertDesc')
    }
  ];

  return (
    <div className="mb-6">
      {/* 主异常聚合卡片 */}
      <div 
        className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:from-red-600 hover:to-red-700"
        onClick={handleTotalClick}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 数字红点动画 */}
              <div className="relative">
                {pulseAnimation && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                <span className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-white text-red-600 font-bold text-lg">
                  {alertsData.counts.total}
                </span>
              </div>
              
              <div>
                <h3 className="font-bold text-lg">
                  {t?.dashboardAlerts || '异常提醒'}
                </h3>
                <p className="text-sm text-red-100 opacity-90">
                  {t?.dashboardAlertsDesc || '点击查看详细分类'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {expanded ? (t?.collapse || '收起') : (t?.expand || '展开')}
              </span>
              <svg 
                className={`w-5 h-5 transform transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 展开的分类详情 */}
      {expanded && (
        <div className="mt-2 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {categories.map((category) => {
              const count = alertsData.counts[category.key] || 0;
              if (count === 0) return null;
              
              return (
                <div
                  key={category.key}
                  className={`${category.color} text-white rounded-lg p-4 cursor-pointer transition-all duration-300 ${category.hoverColor} hover:shadow-lg transform hover:-translate-y-1`}
                  onClick={() => handleCategoryClick(category.key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon}</span>
                      <h4 className="font-bold">{category.label}</h4>
                    </div>
                    <span className="bg-white/20 text-white font-bold px-2 py-1 rounded-full text-sm">
                      {count}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="opacity-80">
                      {t?.clickToView || '点击查看详情'}
                    </span>
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 错误状态显示 */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {/* 加载状态 */}
          {loading && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">{t?.loading || '加载中...'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHeaderAlert;
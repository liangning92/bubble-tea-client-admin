import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * DynamicQRCheckIn - 动态二维码考勤组件
 * 每30秒刷新二维码（基于 staffId + Date.now()）
 * 显示当前班次状态（上班中/下班）
 */
export default function DynamicQRCheckIn({ staffId, shiftStart, shiftId, onCheckIn, config = {} }) {
  const { t } = useAuth();
  const [timestamp, setTimestamp] = useState(Date.now());
  const [shiftStatus, setShiftStatus] = useState('working'); // 'working' | 'off'

  // 每30秒刷新二维码
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 班次时长计算
  const shiftDuration = useMemo(() => {
    if (!shiftStart) return '--:--:--';
    const start = new Date(shiftStart).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [shiftStart, timestamp]);

  // 动态二维码内容
  const qrData = useMemo(() => {
    return JSON.stringify({
      staffId: staffId || 'default',
      timestamp: timestamp,
      shiftStart: shiftStart || null,
      shiftId: shiftId || 'default',
      type: 'checkin',
    });
  }, [staffId, timestamp, shiftStart, shiftId]);

  // 模拟扫码打卡
  const handleScan = async () => {
    if (onCheckIn) {
      try {
        await onCheckIn({ staffId, timestamp, type: 'clock_in' });
      } catch (err) {
        console.error('Check-in failed:', err);
      }
    }
  };

  // 切换班次状态
  const toggleShift = () => {
    setShiftStatus((prev) => (prev === 'working' ? 'off' : 'working'));
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-700/50 text-white">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400">{t('staffCheckIn') || '员工考勤'}</div>
            <div className="text-lg font-black">{staffId || t('staff') || '员工'}</div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-black uppercase ${shiftStatus === 'working' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'}`}>
          {shiftStatus === 'working' ? (t('working') || '上班中') : (t('offDuty') || '下班')}
        </div>
      </div>

      {/* 二维码区域 */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-48 h-48 bg-white rounded-3xl p-4 mb-6 shadow-lg shadow-orange-500/10">
          {/* 模拟二维码 */}
          <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* 模拟二维码图案 */}
              <rect x="5" y="5" width="30" height="30" fill="black" />
              <rect x="10" y="10" width="20" height="20" fill="white" />
              <rect x="15" y="15" width="10" height="10" fill="black" />
              <rect x="65" y="5" width="30" height="30" fill="black" />
              <rect x="70" y="10" width="20" height="20" fill="white" />
              <rect x="75" y="15" width="10" height="10" fill="black" />
              <rect x="5" y="65" width="30" height="30" fill="black" />
              <rect x="10" y="70" width="20" height="20" fill="white" />
              <rect x="15" y="75" width="10" height="10" fill="black" />
              {/* 中间区域 */}
              <rect x="40" y="5" width="5" height="5" fill="black" />
              <rect x="50" y="5" width="5" height="5" fill="black" />
              <rect x="40" y="15" width="5" height="5" fill="black" />
              <rect x="45" y="15" width="5" height="5" fill="black" />
              <rect x="55" y="15" width="5" height="5" fill="black" />
              <rect x="5" y="40" width="5" height="5" fill="black" />
              <rect x="15" y="45" width="5" height="5" fill="black" />
              <rect x="25" y="40" width="5" height="5" fill="black" />
              <rect x="65" y="40" width="5" height="5" fill="black" />
              <rect x="75" y="45" width="5" height="5" fill="black" />
              <rect x="85" y="40" width="5" height="5" fill="black" />
              <rect x="40" y="40" width="20" height="20" fill="black" />
              <rect x="65" y="65" width="30" height="30" fill="black" />
              <rect x="70" y="70" width="20" height="20" fill="white" />
              <rect x="75" y="75" width="10" height="10" fill="black" />
              {/* 动态数据点 */}
              <rect x="45" y="45" width="10" height="10" fill="white" />
              <rect x="50" y="50" width="5" height="5" fill="black" />
            </svg>
          </div>
        </div>

        {/* 刷新倒计时 */}
        <div className="flex items-center gap-2 text-slate-400 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm">{t('autoRefresh') || '自动刷新'}: 30s</span>
        </div>

        <div className="text-xs text-slate-500 mb-6">
          {t('scanToCheckIn') || '请扫描二维码打卡'}
        </div>

        {/* 打卡按钮 */}
        <button
          onClick={handleScan}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
        >
          {t('clockIn') || '打卡上班'}
        </button>
      </div>

      {/* 班次信息 */}
      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">{t('shiftStart') || '上班时间'}</div>
            <div className="text-lg font-black">{shiftStart ? new Date(shiftStart).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">{t('shiftDuration') || '工作时长'}</div>
            <div className="text-lg font-black text-orange-500">{shiftDuration}</div>
          </div>
        </div>

        <button
          onClick={toggleShift}
          className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm font-bold text-slate-400 transition-all"
        >
          {shiftStatus === 'working' ? (t('endShift') || '结束班次') : (t('startShift') || '开始班次')}
        </button>
      </div>
    </div>
  );
}

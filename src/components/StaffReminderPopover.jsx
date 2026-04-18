import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * StaffReminderPopover - 店员定时提醒组件
 * 每 intervalMinutes 分钟自动弹出
 * 显示4种提醒类型：清洁、交班、食材、设备
 */
export default function StaffReminderPopover({ config = {}, onDismiss }) {
  const { t } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // 默认配置
  const defaultConfig = {
    enabled: true,
    intervalMinutes: 30,
    types: ['clean', 'shift', 'ingredient', 'device'],
    soundEnabled: true,
  };
  const reminderConfig = { ...defaultConfig, ...config };

  // 提醒类型定义
  const reminderTypes = [
    {
      key: 'clean',
      icon: '🧹',
      title: t('cleanReminder'),
      desc: t('cleanReminderDesc'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      key: 'shift',
      icon: '👥',
      title: t('shiftReminder'),
      desc: t('shiftReminderDesc'),
      color: 'from-purple-500 to-purple-600',
    },
    {
      key: 'ingredient',
      icon: '📦',
      title: t('ingredientReminder'),
      desc: t('ingredientReminderDesc'),
      color: 'from-green-500 to-green-600',
    },
    {
      key: 'device',
      icon: '⚙️',
      title: t('deviceReminder'),
      desc: t('deviceReminderDesc'),
      color: 'from-orange-500 to-orange-600',
    },
  ];

  // 播放提示音
  const playSound = useCallback(() => {
    if (reminderConfig.soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (e) {
        console.warn('Audio not supported');
      }
    }
  }, [reminderConfig.soundEnabled]);

  // 倒计时逻辑
  useEffect(() => {
    if (!reminderConfig.enabled) return;

    setTimeLeft(reminderConfig.intervalMinutes * 60);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 时间到，弹出提醒
          setIsVisible(true);
          playSound();
          return reminderConfig.intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [reminderConfig.enabled, reminderConfig.intervalMinutes, playSound]);

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 关闭提醒
  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  // 手动触发测试
  const handleTest = () => {
    setIsVisible(true);
    playSound();
  };

  if (!reminderConfig.enabled) return null;

  return (
    <>
      {/* 状态栏小图标（始终显示） */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-3 bg-slate-900/90 backdrop-blur-sm rounded-2xl px-4 py-3 border border-slate-700/50 shadow-xl">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
          <span className="text-xl">⏰</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 font-bold uppercase">{t('nextReminder')}</div>
          <div className="text-lg font-black text-white tabular-nums">{formatTime(timeLeft)}</div>
        </div>
        <button
          onClick={handleTest}
          className="ml-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-400 transition-all"
        >
          {t('test')}
        </button>
      </div>

      {/* 弹窗 */}
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-[40px] p-8 w-full max-w-lg border border-slate-700/50 shadow-2xl animate-soft">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl animate-bounce">
                  ⏰
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest">{t('staffReminder') || '店员提醒'</h2>
                  <p className="text-sm text-slate-400">{t('timeForCheck') || '该检查一下这些了'}</p>
                </div>
              </div>
            </div>

            {/* 提醒列表 */}
            <div className="space-y-4 mb-8">
              {reminderTypes
                .filter((type) => reminderConfig.types.includes(type.key))
                .map((type) => (
                  <div
                    key={type.key}
                    className={`p-5 rounded-2xl bg-gradient-to-r ${type.color} flex items-center gap-4 shadow-lg`}
                  >
                    <span className="text-4xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="text-lg font-black text-white">{type.title}</div>
                      <div className="text-sm text-white/70">{type.desc}</div>
                    </div>
                  </div>
                ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={handleDismiss}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest text-white transition-all active:scale-95"
              >
                {t('gotIt') || '知道了'}
              </button>
              <button
                onClick={() => {
                  handleDismiss();
                  setTimeLeft(reminderConfig.intervalMinutes * 60);
                }}
                className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl font-black uppercase tracking-widest text-white transition-all active:scale-95"
              >
                {t('snooze') || '稍后提醒'} ({Math.floor(reminderConfig.intervalMinutes / 2)}m)
              </button>
            </div>

            {/* 设置提示 */}
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 text-center">
                {t('reminderInterval')}: {reminderConfig.intervalMinutes} {t('minutes') || '分钟'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

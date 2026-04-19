import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, user } from '../context/AuthContext'; 
import BusinessDataTranslator from '../components/BusinessDataTranslator';
import { QRCodeCanvas } from 'qrcode.react';

export default function POSPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['全部']);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(null); // { name, code, orderNo }
  const [shiftModal, setShiftModal] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrExpires, setQrExpires] = useState(0);
  const [blindCashInput, setBlindCashInput] = useState('');
  const [shiftResult, setShiftResult] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null); // { amount, type, label }
  const [orderChannel, setOrderChannel] = useState('offline'); // offline | grab | gofood | shopee
  const [printReceipt, setPrintReceipt] = useState(null); // { orderNo, items, total, discount, final, time }

  useEffect(() => {
    loadProducts();
  }, [user]);

  // 【智能考勤】动态二维码刷新器
  useEffect(() => {
    let timer;
    if (attendanceModal) {
      const getNewToken = async () => {
        try {
          const res = await api('GET', '/attendance/qr-generate');
          if (res?.token) {
            setQrToken(res.token);
            setQrExpires(res.expiresIn || 30);
          }
        } catch (e) { console.error("QR Fetch failed", e); }
      };
      getNewToken();
      timer = setInterval(getNewToken, 25000); // 提前5秒刷新
    }
    return () => clearInterval(timer);
  }, [attendanceModal]);

  // 【闪电矩阵】快捷键与硬件扫码枪直连器 (Enter/Space 一键结账)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (successModal || shiftModal || loading || cart.length === 0) return;
      // 屏蔽如果是某个输入框被 focus 时的回车
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleCheckout('cash');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [successModal, shiftModal, loading, cart]);

  const loadProducts = async () => {
    try {
      // 并行获取产品和销量数据
      const [prodRes, salesRes] = await Promise.all([
        api('GET', '/products'),
        api('GET', '/sales?limit=2000').catch(() => ({ data: [] }))
      ]);
      
      if (prodRes?.error) throw new Error(prodRes.error);
      const list = Array.isArray(prodRes) ? prodRes : (prodRes?.data || prodRes?.items || []);
      
      // 按销量排序：热销产品排在前面
      const salesItems = Array.isArray(salesRes) ? salesRes : (salesRes?.data || []);
      const salesCount = {};
      for (const o of salesItems) {
        const name = o.productName || o.name || '';
        salesCount[name] = (salesCount[name] || 0) + (o.quantity || 1);
      }
      
      // 按销量降序排列，销量相同的按名称排序
      list.sort((a, b) => {
        const aQty = salesCount[a.name] || 0;
        const bQty = salesCount[b.name] || 0;
        if (bQty !== aQty) return bQty - aQty;
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setProducts(list);
      localStorage.setItem('pos_offline_products', JSON.stringify(list)); // 离线缓存

      const cats = ['全部', ...new Set(list.map(p => p.category || '其它'))];
      setCategories(cats);
    } catch (err) {
      console.warn("网络异常，启用离线菜谱兜底:", err);
      // PWA 离线态降级：读取缓存
      const cached = localStorage.getItem('pos_offline_products');
      if (cached) {
        const list = JSON.parse(cached);
        setProducts(list);
        setCategories(['全部', ...new Set(list.map(p => p.category || '其它'))]);
        window.dispatchEvent(new CustomEvent('app:notification', { detail: { type: 'warning', message: '已切换至离线模式' } }));
      } else {
        window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '首次加载需联网拉取商品', type: 'network' } }));
      }
    }
  };

  // 离线队列同步器 (静默重试)
  useEffect(() => {
    const syncOfflineOrders = async () => {
      if (!navigator.onLine) return;
      const cachedOrders = JSON.parse(localStorage.getItem('pos_offline_orders') || '[]');
      if (cachedOrders.length === 0) return;
      
      const remainingOrders = [];
      let successCount = 0;
      
      for (const order of cachedOrders) {
        try {
          const res = await api('POST', '/pos/checkout', order.payload);
          if (res?.error) throw new Error(res.error);
          successCount++;
        } catch (e) {
          remainingOrders.push(order);
        }
      }
      
      localStorage.setItem('pos_offline_orders', JSON.stringify(remainingOrders));
      if (successCount > 0) {
        window.dispatchEvent(new CustomEvent('app:success', { detail: `网络恢复，已自劢补录 ${successCount} 笔离线账单！` }));
      }
    };

    const interval = setInterval(syncOfflineOrders, 10000); // 10秒探查一次
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = activeCategory === '全部' 
    ? products 
    : products.filter(p => (p.category || '其它') === activeCategory);

  const addToCart = (product) => {
    setCart(prev => {
      const exist = prev.find(item => item.productId === product.id);
      if (exist) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.sellingPrice,
        quantity: 1
      }];
    });
  };

  const changeQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));
  const clearCart = () => window.confirm(t('clearCartConfirm')) && setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = discountInfo ? (discountInfo.type === 'percent' ? (subtotal * discountInfo.value / 100) : discountInfo.value) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    // 模拟瑞幸式的营销码校验
    const code = couponCode.toUpperCase();
    if (code === 'LUCKIN60') {
      setDiscountInfo({ type: 'percent', value: 40, label: '瑞幸式 4.8 折新客券' }); // 60% off -> 40% value? No, 60 is off, so 40 is price.
      window.dispatchEvent(new CustomEvent('app:success', { detail: '已成功应用：瑞幸特惠 60% OFF' }));
    } else if (code === 'BOGO') {
      setDiscountInfo({ type: 'fixed', value: cart[0]?.unitPrice || 0, label: '买一赠一 (BOGO)' });
      window.dispatchEvent(new CustomEvent('app:success', { detail: '已成功应用：买一赠一' }));
    } else if (code.startsWith('VIP')) {
      setDiscountInfo({ type: 'fixed', value: 10000, label: '会员专享立减券' });
    } else {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '券码无效或已过期' } }));
    }
    setCouponCode('');
  };

  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return;
    setLoading(true);
    const checkoutPayload = {
      items: cart,
      paymentMethod,
      channel: orderChannel, // offline | grab | gofood | shopee
      totalAmount,
      finalAmount: totalAmount
    };

    try {
      if (!navigator.onLine) throw new Error('OFFLINE_MODE');

      const res = await api('POST', '/pos/checkout', checkoutPayload);
      if (res?.error) {
        // 如果后端明确拦截（比如没开店、类型错），直接报红，不走离线重试
        throw new Error(res.error);
      }
      
      // 【数字化增长引擎】检测是否满足转会员门槛 (Lock-in Logic)
      const MEMBER_THRESHOLD = 30000;
      const isEligibleForMember = totalAmount >= MEMBER_THRESHOLD;

      try {
        const crmRes = await api('POST', '/crm/discounts/auto-generate', { amountSpent: totalAmount });
        if (crmRes && crmRes.data && crmRes.data.code) {
           setPrintReceipt({
             orderNo: res.order?.orderNo || 'OK',
             items: [...cart],
             total: subtotal,
             discount: discountAmount,
             final: totalAmount,
             time: new Date().toLocaleString(),
             marketingCode: crmRes.data.code,
             marketingName: crmRes.data.name
           });
           
           setSuccessModal({
             name: crmRes.data.name,
             code: crmRes.data.code,
             orderNo: res.order?.orderNo || 'OK',
             eligibleForMember: isEligibleForMember
           });
           setCart([]);
           setDiscountInfo(null);
           setLoading(false);
           return;
        }
      } catch (e) {
        console.warn("会员营销引擎无响应", e);
      }
      
      window.dispatchEvent(new CustomEvent('app:success', { detail: `结账成功！排单号: ${res.order?.orderNo || 'OK'}` }));
      setCart([]);
    } catch (err) {
      if (err.message === 'OFFLINE_MODE' || err.message.includes('网络') || err.message.includes('fetch')) {
        // 压入离线队列
        const offlineId = `OFF-${Date.now()}`;
        const queue = JSON.parse(localStorage.getItem('pos_offline_orders') || '[]');
        queue.push({ id: offlineId, payload: checkoutPayload, time: new Date().toISOString() });
        localStorage.setItem('pos_offline_orders', JSON.stringify(queue));

        window.dispatchEvent(new CustomEvent('app:success', { detail: `离线模式：由于当前无网络，已为您生成暂存结单号 ${offlineId}，将在联网后自动上传！` }));
        setCart([]); // 依然给顾客清空点单走人
      } else {
        window.dispatchEvent(new CustomEvent('app:error', { detail: { message: err.message || '结算通信失败' } }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShiftClose = async () => {
    if (!blindCashInput || isNaN(blindCashInput)) {
       window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '请如实填写钱箱实点现金数值' } }));
       return;
    }
    setLoading(true);
    try {
      // 调取后台真实计算
      const stats = await api('GET', '/pos/shift-stats');
      const expected = stats.expectedCash || 0;
      const actual = parseInt(blindCashInput) || 0;
      const diff = actual - expected;

      await api('POST', '/pos/shift-close', {
        actualCash: actual,
        expectedCash: expected,
        difference: diff
      });

      setShiftResult({ expected, actual, diff });
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '服务器结算异常' } }));
    } finally {
      setLoading(false);
    }
  };

  // 全方位应用 TailwindCSS + 玻璃拟态 (Glassmorphism)
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden select-none">
      
      {/* 【左侧：智能商品瀑布流区】 */}
      <div className="flex-[7] flex flex-col h-full overflow-hidden relative">
        {/* 背景光斑效果 */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* 顶部悬浮导航 */}
        <div className="relative z-10 px-8 py-6 flex items-center justify-between bg-white/60 backdrop-blur-md border-b border-white/50 sticky top-0 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t('spaceCheckout')}</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">SaaS Edition • 极速点单</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                 setAttendanceModal(true);
              }}
              className="px-4 py-3.5 bg-indigo-100 text-indigo-700 font-bold rounded-xl shadow-sm border border-indigo-200 hover:bg-indigo-200 hover:shadow transition-all active:scale-95 flex items-center gap-2"
            >
              🕒 考勤扫码
            </button>
            <button 
              onClick={() => {
                 setShiftModal(true);
                 setShiftResult(null);
                 setBlindCashInput('');
              }}
              className="px-4 py-3.5 bg-orange-100 text-orange-700 font-bold rounded-xl shadow-sm border border-orange-200 hover:bg-orange-200 hover:shadow transition-all active:scale-95 flex items-center gap-2"
            >
              🔒 防飞单交班
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="px-4 py-3.5 bg-white text-slate-700 font-semibold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:shadow transition-all active:scale-95"
            >
              退出全屏
            </button>
          </div>
        </div>

        {/* 分类标签横向滑动轴 */}
        <div className="relative z-10 px-8 py-3 flex gap-3 overflow-x-auto no-scrollbar border-b border-slate-200/50">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-3.5 rounded-full font-bold text-sm transition-all duration-300 shadow-sm ${
                activeCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 商品卡片矩阵 */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8 pt-6">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <div className="text-6xl mb-4">🧋</div>
              <p className="text-xl font-bold">{t('noProductsInCategory')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-1">
              {filteredProducts.map(p => {
                const gradients = [
                  'from-indigo-400 via-purple-400 to-pink-400',
                  'from-cyan-400 via-sky-400 to-blue-400',
                  'from-emerald-400 via-teal-400 to-cyan-400',
                  'from-orange-400 via-amber-400 to-yellow-400',
                  'from-rose-400 via-red-400 to-orange-400'
                ];
                const gradientClass = gradients[(p.id || 0) % gradients.length];
                
                return (
                  <div 
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group relative h-48 rounded-3xl cursor-pointer hover:-translate-y-2 transition-all duration-300 active:scale-95 flex flex-col justify-end overflow-hidden shadow-sm hover:shadow-2xl"
                  >
                    {/* 模拟全幅高斯模糊果茶实景图 (伪图层) */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-80 group-hover:opacity-100 transition-opacity duration-300 blur-[2px] group-hover:blur-0 scale-110 group-hover:scale-100`}></div>
                    
                    {/* 玻璃拟态遮罩文字层 */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-white/30 backdrop-blur-md border-t border-white/40 h-2/3 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="absolute -top-3 left-3 bg-slate-900/80 text-white text-[14px] font-bold px-4 py-0.5 rounded-full backdrop-blur-xl border border-white/20">
                        <BusinessDataTranslator text={p.category || '核心品'} />
                      </div>
                      <h3 className="text-[17px] font-black text-slate-900 leading-tight mb-1 drop-shadow-md">
                        <BusinessDataTranslator text={p.name} />
                      </h3>
                      <p className="text-lg font-black text-slate-900 drop-shadow-md">Rp {p.sellingPrice.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 【右侧：智能聚合结算滑台】 */}
      <div className="flex-[3] bg-white border-l border-slate-200 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] flex flex-col z-20 relative">
        <div className="px-4 py-6 border-b border-slate-100/80 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span>{t('currentBill')}</span>
              <span className="bg-indigo-100 text-indigo-700 text-sm py-0.5 px-4.5 rounded-full">{cart.length} 项</span>
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-red-500 hover:text-red-600 font-bold text-sm bg-red-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                清空
              </button>
            )}
          </div>
        </div>

        {/* 购物车流 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-40 text-center">
              <span className="text-6xl mb-4 grayscale">🛒</span>
              <p className="font-bold text-slate-600"{t('waitForOrder')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-slate-800">
                    <BusinessDataTranslator text={item.productName} />
                  </h4>
                  <div className="text-emerald-500 font-bold mt-1">Rp {item.unitPrice.toLocaleString()}</div>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <button onClick={() => changeQuantity(item.productId, -1)} className="w-9 h-9 rounded-lg bg-white shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-90 transition-all flex items-center justify-center font-bold text-lg">-</button>
                  <span className="w-6 text-center font-bold text-lg text-slate-800">{item.quantity}</span>
                  <button onClick={() => changeQuantity(item.productId, 1)} className="w-9 h-9 rounded-lg bg-white shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-90 transition-all flex items-center justify-center font-bold text-lg">+</button>
                </div>
                <button onClick={() => removeItem(item.productId)} className="ml-3 text-red-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all">
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* 高级吸底计算与支付面板 */}
          <div className="space-y-4 mb-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span className="text-label-caps">{t('subtotal')}</span>
              <span>Rp {subtotal.toLocaleString()}</span>
            </div>
            {discountInfo && (
              <div className="flex justify-between text-sm font-bold text-red-500 animate-in slide-in-from-right-2">
                <span className="flex items-center gap-1">🏷️ {discountInfo.label}</span>
                <span>- Rp {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="h-px bg-slate-200 my-2"></div>
            <div className="flex justify-between items-end">
              <span className="text-label-caps !text-slate-800">{t('grandTotal')}</span>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">Rp {totalAmount.toLocaleString()}</div>
            </div>
          </div>

          <div className="mb-6 flex gap-2">
            <input 
              type="text" 
              placeholder={t('placeholderCouponCode')} 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
            />
            <button 
              onClick={handleApplyCoupon}
              className="px-4 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all"
            >
              核销
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 col-span-2">
              <p className="text-label-caps mb-4">{t('channel')}</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'offline', label: '堂食/自提', color: 'bg-white text-slate-800' },
                  { id: 'grab', label: 'GrabFood', color: 'bg-emerald-50 text-emerald-600' },
                  { id: 'gofood', label: 'GoFood', color: 'bg-green-50 text-green-700' },
                  { id: 'shopee', label: 'ShopeeFood', color: 'bg-orange-50 text-orange-600' }
                ].map(ch => (
                  <button 
                    key={ch.id}
                    type="button"
                    onClick={() => setOrderChannel(ch.id)}
                    className={`py-3 rounded-xl text-[14px] font-black border transition-all ${orderChannel === ch.id ? `ring-2 ring-indigo-500 border-indigo-500 ${ch.color}` : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button"
              disabled={loading || cart.length === 0}
              onClick={() => handleCheckout('cash')}
              className={`py-5 rounded-2xl font-black text-xl flex flex-col items-center justify-center transition-all shadow-sm relative overflow-hidden ${
                cart.length === 0 ? 'bg-slate-100 text-slate-400' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 active:scale-[0.98]'
              }`}
            >
              {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : (
                <>
                  <span className="relative z-10">{t('cashReceived')}</span>
                  <span className="text-[14px] font-semibold opacity-80 mt-1 relative z-10 flex items-center gap-1">
                    <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[14px]">Space</kbd> 极速结单
                  </span>
                </>
              )}
            </button>
            <button 
              type="button"
              disabled={loading || cart.length === 0}
              onClick={() => handleCheckout('digital')}
              className={`py-5 rounded-2xl font-black text-xl flex flex-col items-center justify-center transition-all shadow-sm ${
                cart.length === 0 ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-[0.98]'
              }`}
            >
              <span>{t('digitalAggregation')}</span>
              <span className="text-[14px] font-semibold opacity-70 mt-1">Digital QR/Card</span>
            </button>
          </div>
        </div>
      {/* 🚀 【智能营销】成功后弹窗和交接班弹窗将放在根容器内部 */}

      {/* 🚀 【智能营销】成功后弹窗 */}
      {successModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center text-white font-black">
              店本会员转化建议
            </div>
            <div className="p-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-4 border border-emerald-100 shadow-inner">💎</div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{t('membershipGuide')}</h3>
                <p className="text-sm text-slate-500 font-medium px-4 mt-2">
                  该订单已达标，建议邀请顾客加入会员并领取专属权益礼包。
                </p>
              </div>

              <div className="w-full space-y-4 mb-6">
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">📱</span>
                  <input 
                    type="text" 
                    placeholder={t('placeholderCustomerPhone')} 
                    className="w-full pl-12 pr-5 py-5 bg-slate-50 rounded-2xl border-2 border-slate-200 text-xl font-black focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
                    id="success-modal-phone"
                  />
                </div>
                
                <button 
                  onClick={async () => {
                    const phone = document.getElementById('success-modal-phone')?.value;
                    if (!phone) {
                      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '请输入手机号' } }));
                      return;
                    }

                    try {
                      // 1. 保存会员信息到 CRM
                      await api('POST', '/members', { phone, name: '新会员' });
                      
                      // 2. 处理 WhatsApp 联想
                      const mode = localStorage.getItem('wa_comm_mode') || 'auto';
                      if (mode === 'safe') {
                        const msg = `🎉 欢迎加入品牌会员！您的专属礼遇 [${successModal.name}] 已发放，码号: ${successModal.code}。期待再次光临！`;
                        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }
                      
                      window.dispatchEvent(new CustomEvent('app:success', { detail: '转化成功：已发放会员权益' }));
                      setSuccessModal(null);
                    } catch (e) {
                      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: '会员转化失败: ' + e.message } }));
                    }
                  }} 
                  className={`w-full py-5 text-white rounded-[24px] font-black uppercase tracking-widest shadow-2xl transition-all ${
                    localStorage.getItem('wa_comm_mode') === 'safe' ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-slate-900 shadow-slate-900/30'
                  }`}
                >
                  {localStorage.getItem('wa_comm_mode') === 'safe' ? '通过链接触达' : '确认转化并发送'}
                </button>
                <button onClick={() => setSuccessModal(null)} className="w-full py-3 text-slate-400 font-bold text-sm">{t('skipMembership')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 【防飞单】盲交交接班弹窗 */}
      {shiftModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-center">
              <h2 className="text-2xl font-black text-white tracking-tight">安全交接班机制</h2>
            </div>
            
            <div className="p-8 text-center flex flex-col items-center">
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-bold mb-6">
                请仔细清点钱箱内现金 (盲校验资)
              </div>
              
              {!shiftResult ? (
                <>
                    <input
                       type="number"
                       autoFocus
                       value={blindCashInput}
                       onChange={(e) => setBlindCashInput(e.target.value)}
                       placeholder={t('placeholderCashTotal')}
                       className="w-full text-center text-3xl font-black text-slate-800 bg-slate-100 border-2 border-slate-200 rounded-xl py-3 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all mb-6"
                    />
                  <div className="flex gap-4 w-full">
                    <button 
                      disabled={loading}
                      onClick={() => setShiftModal(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-300 active:scale-95 transition-all"
                    >
                      取消
                    </button>
                    <button 
                      disabled={loading}
                      onClick={handleShiftClose}
                      className="flex-1 btn-primary py-3 text-lg"
                    >
                      {loading ? <div className="animate-spin h-6 w-6 border-b-2 border-white rounded-full"></div> : '核对并打标'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full animate-in zoom-in duration-300">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                    <div className="flex justify-between mb-2">
                       <span className="text-slate-500 font-bold">POS 系统应收：</span>
                       <span className="font-black text-slate-800">Rp {shiftResult.expected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                       <span className="text-slate-500 font-bold">您提交实收：</span>
                       <span className="font-black text-slate-800">Rp {shiftResult.actual.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200 my-3 pt-3 flex justify-between">
                       <span className="text-slate-500 font-bold">{t('varianceAccount')}:</span>
                       <span className={`font-black text-xl ${shiftResult.diff === 0 ? 'text-green-500' : 'text-red-500'}`}>
                         {shiftResult.diff > 0 ? '+' : ''}{shiftResult.diff.toLocaleString()}
                       </span>
                    </div>
                  </div>
                  {shiftResult.diff !== 0 && (
                     <p className="text-red-500 text-sm font-bold mb-6">{t('varianceReported')}</p>
                  )}
                  <button 
                    onClick={() => {
                      setShiftModal(false);
                      navigate('/'); // 强制退回内参台
                    }}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white font-black text-lg hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    确认并注销下线
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🕒 【智能考勤】动态打卡码弹窗 */}
      {attendanceModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
          <div className="bg-white max-w-sm w-full rounded-[40px] shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-8 text-center text-white">
              <h2 className="text-2xl font-black tracking-tight mb-1">员工考勤中心</h2>
              <p className="text-indigo-100 text-[14px] font-bold opacity-80">请使用手机端扫码完成打卡</p>
            </div>
            
            <div className="p-10 flex flex-col items-center">
              <div className="relative p-6 bg-slate-50 rounded-[32px] border-4 border-indigo-50 mb-6 group">
                {qrToken ? (
                  <QRCodeCanvas 
                    value={qrToken} 
                    size={200} 
                    level="H"
                    includeMargin={false}
                    className="rounded-xl shadow-inner transition-transform group-hover:scale-105 duration-500"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-slate-100 rounded-xl animate-pulse">
                    <span className="text-slate-400 font-bold">{t('generating')}</span>
                  </div>
                )}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[14px] font-black px-4 py-1 rounded-full shadow-lg border-2 border-white">
                  每 30 秒自动刷新
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">📱</div>
                  <div className="flex-1">
                    <p className="text-[14px] font-black text-emerald-600 uppercase tracking-widest">打卡提示</p>
                    <p className="text-[14px] font-bold text-emerald-800">断网状态下扫码也有效</p>
                  </div>
                </div>

                <button 
                  onClick={() => setAttendanceModal(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                  关闭窗口
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 【数字化小票】收据模拟预览 */}
      {printReceipt && (
        <div className="fixed top-8 left-8 z-[100] w-72 bg-white shadow-2xl rounded-sm border border-slate-200 p-4 font-mono text-[14px] animate-in slide-in-from-top-10">
          <div className="text-center border-b border-dashed border-slate-300 pb-2 mb-2">
            <h3 className="font-bold text-[14px]">{t('digitalReceiptInternal')}</h3>
            <p>Order: {printReceipt.orderNo}</p>
            <p>{printReceipt.time}</p>
          </div>
          <div className="space-y-4 mb-2">
            {printReceipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.productName} x {item.quantity}</span>
                <span>{(item.unitPrice * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-slate-300 pt-2 space-y-4">
            <div className="flex justify-between font-bold">
              <span>应收总额</span>
              <span>Rp {printReceipt.total.toLocaleString()}</span>
            </div>
            {printReceipt.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>减免优惠</span>
                <span>- {printReceipt.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-[14px] pt-1">
              <span>待付结算</span>
              <span>Rp {printReceipt.final.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-4 text-center bg-slate-50 p-2 rounded border border-slate-100">
             <p className="font-bold">Next Trip Gift:</p>
             <p className="text-indigo-600 font-black">{printReceipt.marketingCode}</p>
             <p className="text-[8px]">{printReceipt.marketingName}</p>
          </div>
          <button onClick={() => setPrintReceipt(null)} className="w-full mt-2 py-1 bg-slate-100 hover:bg-slate-200 transition-all text-slate-500 rounded">关闭预览</button>
        </div>
      )}
    </div>
  );
}

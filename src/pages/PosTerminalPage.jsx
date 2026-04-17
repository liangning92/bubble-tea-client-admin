import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api, useAuth } from "../context/AuthContext"; 
import BusinessDataTranslator from "../components/BusinessDataTranslator";

export default function PosTerminalPage() {
  const { t, lang } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([t('all')]);
  const [activeCategory, setActiveCategory] = useState(t('all'));
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configProduct, setConfigProduct] = useState(null);
  const [addons, setAddons] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [sugarLevel, setSugarLevel] = useState("100%");
  const [iceLevel, setIceLevel] = useState("正常冰");
  const [successModal, setSuccessModal] = useState(null);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const totalAmount = subtotal;

  const formatCurrency = (num) => `${t('currencySymbol') || '¥'} ${num?.toLocaleString()}`;

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const [pRes, aRes] = await Promise.all([api("GET", "/products"), api("GET", "/addons")]);
      const list = Array.isArray(pRes) ? pRes : (pRes?.data || pRes?.items || []);
      setProducts(list);
      setAddons(Array.isArray(aRes) ? aRes : []);
      setCategories([t('all'), ...new Set(list.map(p => p.category || t('catOther')) || [])]);
    } catch (err) { console.warn("Product load failed"); }
  }

  const addToCart = () => {
    if (!configProduct) return;
    const cartKey = `${configProduct.id}-${selectedSpecs?.name || "STD"}-${sugarLevel}-${iceLevel}-${selectedAddons.map(a => a.id).sort().join(",")}`;
    const existing = cart.find(i => i.cartKey === cartKey);
    
    if (existing) {
      setCart(cart.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      const unitPrice = (configProduct.sellingPrice || 0) + (selectedSpecs?.priceAdjustment || 0) + selectedAddons.reduce((s, a) => s + (a.price || 0), 0);
      setCart([...cart, {
        cartKey,
        productId: configProduct.id,
        productName: configProduct.name,
        unitPrice,
        quantity: 1,
        config: { spec: selectedSpecs?.name || "标准", sugar: sugarLevel, ice: iceLevel, addons: selectedAddons.map(a => a.name) }
      }]);
    }
    setConfigProduct(null);
  };

  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await api("POST", "/pos/checkout", { items: cart, paymentMethod, totalAmount, finalAmount: totalAmount });
      setSuccessModal({ orderNo: res?.order?.orderNo || "OK" });
      setCart([]);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const filteredProducts = activeCategory === t('all') ? products : products.filter(p => (p.category || t('catOther')) === activeCategory);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-950 rounded-[40px] overflow-hidden border border-slate-800 animate-soft text-slate-200">
      {/* Categories */}
      <div className="w-24 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-4 overflow-y-auto no-scrollbar">
         {categories.map(cat => (
           <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-16 h-16 rounded-2xl flex items-center justify-center text-[12px] font-black uppercase text-center px-1 transition-all ${activeCategory === cat ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
              {cat}
           </button>
         ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-slate-900/50">
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => setConfigProduct(p)} className="aspect-square bg-slate-800 rounded-3xl border border-slate-700 p-6 flex flex-col justify-between text-left hover:border-orange-500 transition-all active:scale-95 group">
                 <h3 className="font-black text-white leading-tight group-hover:text-orange-500"><BusinessDataTranslator text={p.name} /></h3>
                 <p className="text-xl font-black text-orange-500 font-mono tracking-tighter">{formatCurrency(p.sellingPrice)}</p>
              </button>
            ))}
         </div>
      </div>

      {/* Cart */}
      <div className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col">
         <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <span className="font-black text-orange-500 text-[12px] uppercase tracking-widest italic">{t('cart') || 'BILL'}</span>
            <button onClick={() => setCart([])} className="text-[12px] font-black text-slate-600 hover:text-red-500 uppercase">{t('clear')}</button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map(item => (
              <div key={item.cartKey} className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                 <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-[14px] text-white truncate w-32"><BusinessDataTranslator text={item.productName} /></h4>
                    <button onClick={() => setCart(cart.filter(i => i.cartKey !== item.cartKey))} className="text-slate-600">✕</button>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-orange-500 font-black">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    <div className="flex items-center gap-2">
                       <button onClick={() => setCart(cart.map(i => i.cartKey === item.cartKey ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">-</button>
                       <span className="text-[12px] font-bold">{item.quantity}</span>
                       <button onClick={() => setCart(cart.map(i => i.cartKey === item.cartKey ? { ...i, quantity: i.quantity + 1 } : i))} className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">+</button>
                    </div>
                 </div>
              </div>
            ))}
         </div>
         <div className="p-6 bg-slate-900/50 border-t border-slate-800">
            <div className="flex justify-between items-end mb-6">
               <span className="text-[12px] font-black text-slate-500 uppercase">{t('totalAmount') || 'TOTAL'}</span>
               <span className="text-2xl font-black text-orange-500 tracking-tighter">{formatCurrency(totalAmount)}</span>
            </div>
            <button onClick={() => handleCheckout("CASH")} disabled={loading} className="w-full btn-primary !py-5 text-lg">
               {loading ? '...' : t('checkout') || 'PAY NOW'}
            </button>
         </div>
      </div>

      {/* Simple Config Modal */}
      {configProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setConfigProduct(null)}>
           <div className="bg-white rounded-[40px] p-10 w-full max-w-md text-slate-900" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-black uppercase mb-8"><BusinessDataTranslator text={configProduct.name} /></h2>
              <button onClick={addToCart} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest mb-4">{t('addToBill')}</button>
              <button onClick={() => setConfigProduct(null)} className="w-full py-5 bg-slate-100 rounded-3xl text-slate-400 font-black uppercase">{t('cancel')}</button>
           </div>
        </div>
      )}

      {/* Success */}
      {successModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
           <div className="bg-white p-12 rounded-[50px] text-center max-w-xs">
              <div className="text-5xl mb-6">✅</div>
              <h3 className="text-xl font-black text-slate-900 uppercase mb-8">支付成功</h3>
              <button onClick={() => setSuccessModal(null)} className="px-12 py-3 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest">完成</button>
           </div>
        </div>
      )}
    </div>
  );
}

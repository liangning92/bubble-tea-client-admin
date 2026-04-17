import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function RecipeModal({ show, onClose, editRecipe, onSaved }) {
  const { lang, t } = useAuth();
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [ingredients, setIngredients] = useState([{ inventoryId: '', usageAmount: '' }]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('zh');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') || 'zh';
    setLang(savedLang);
    
    if (show) {
      loadInventory();
      if (editRecipe) {
        setName(editRecipe.name);
        setSellingPrice(editRecipe.sellingPrice?.toString() || '');
        if (editRecipe.ingredients && editRecipe.ingredients.length > 0) {
          setIngredients(editRecipe.ingredients.map(i => ({
            inventoryId: i.inventoryId?.toString() || '',
            usageAmount: i.usageAmount?.toString() || ''
          })));
        } else {
          setIngredients([{ inventoryId: '', usageAmount: '' }]);
        }
      } else {
        setName('');
        setSellingPrice('');
        setIngredients([{ inventoryId: '', usageAmount: '' }]);
      }
    }
  }, [show, editRecipe]);

  const loadInventory = async () => {
    try {
      const data = await api('GET', '/inventory');
      if (Array.isArray(data)) {
        setInventoryList(data);
      }
    } catch (e) {
      console.error('加载库存失败:', e);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { inventoryId: '', usageAmount: '' }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('enterProductName'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const validIngredients = ingredients
        .filter(i => i.inventoryId && i.usageAmount && parseFloat(i.usageAmount) > 0)
        .map(i => ({
          inventoryId: parseInt(i.inventoryId),
          usageAmount: parseFloat(i.usageAmount)
        }));

      const payload = {
        name: name.trim(),
        sellingPrice: parseFloat(sellingPrice) || 0,
        ingredients: validIngredients
      };

      let result;
      if (editRecipe) {
        result = await api('PUT', `/recipes/${editRecipe.name}`, payload);
      } else {
        result = await api('POST', '/recipes', payload);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            {editRecipe 
              ? t('editRecipe')
              : t('addRecipe')}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 产品名称 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {lang === 'zh' ? '产品名称' : 'Nama Produk'} *
            </label>
            <input
              type="text"
              className="input w-full"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={lang === 'zh' ? '例如：珍珠奶茶' : 'Contoh: Thai Tea'}
              required
              disabled={!!editRecipe}
            />
          </div>

          {/* 售价 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {lang === 'zh' ? '售价 (Rp)' : 'Harga Jual (Rp)'}
            </label>
            <input
              type="number"
              className="input w-full"
              value={sellingPrice}
              onChange={e => setSellingPrice(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          {/* 原料配方 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">
                {lang === 'zh' ? '原料配方' : 'Bahan Resep'}
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                + {lang === 'zh' ? '添加原料' : 'Tambah Bahan'}
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    className="input flex-1"
                    value={ing.inventoryId}
                    onChange={e => updateIngredient(index, 'inventoryId', e.target.value)}
                  >
                    <option value="">
                      {lang === 'zh' ? '选择原料' : 'Pilih Bahan'}
                    </option>
                    {inventoryList.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input w-24"
                    value={ing.usageAmount}
                    onChange={e => updateIngredient(index, 'usageAmount', e.target.value)}
                    placeholder={lang === 'zh' ? '用量' : 'Jumlah'}
                    min="0"
                    step="0.1"
                  />
                  <span className="text-gray-500 text-sm w-8">
                    {inventoryList.find(i => i.id.toString() === ing.inventoryId)?.unit || '-'}
                  </span>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {lang === 'zh' ? '取消' : 'Batal'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading 
                ? (lang === 'zh' ? '保存中...' : 'Menyimpan...')
                : (lang === 'zh' ? '保存' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

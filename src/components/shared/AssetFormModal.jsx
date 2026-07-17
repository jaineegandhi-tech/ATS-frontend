import { useState } from 'react';
import Modal from './Modal';
import { ASSET_CATEGORIES, ASSET_CONDITIONS, saveAsset } from '../../utils/assets';

const EMPTY = {
  name: '',
  category: '',
  brand: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  purchaseCost: '',
  warrantyExpiry: '',
  condition: 'Good',
};

export default function AssetFormModal({ title, asset = null, currentUser, onClose, onSaved }) {
  const [form, setForm] = useState(asset ? {
    name: asset.name || '',
    category: asset.category || '',
    brand: asset.brand || '',
    model: asset.model || '',
    serialNumber: asset.serialNumber || '',
    purchaseDate: asset.purchaseDate || '',
    purchaseCost: asset.purchaseCost || '',
    warrantyExpiry: asset.warrantyExpiry || '',
    condition: asset.condition || 'Good',
  } : EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  function handleSubmit(e, assignAfter = false) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Please enter an asset name.');
    if (!form.category) return setError('Please select a category.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        purchaseCost: parseFloat(form.purchaseCost) || 0,
      };
      const id = saveAsset({ asset: payload, user: currentUser, editId: asset?.id || null });
      onSaved(id, assignAfter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Asset Name</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. MacBook Pro 16&quot;" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category</option>
              {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Brand</label>
            <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Apple" />
          </div>
          <div>
            <label className="label">Model</label>
            <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. MacBook Pro M3" />
          </div>
          <div>
            <label className="label">Serial Number</label>
            <input className="input" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="e.g. SN123456" />
          </div>
          <div>
            <label className="label">Asset Condition</label>
            <select className="input" value={form.condition} onChange={e => set('condition', e.target.value)}>
              {ASSET_CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Purchase Date</label>
            <input type="date" className="input" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Purchase Cost</label>
            <input type="number" min="0" step="0.01" className="input" value={form.purchaseCost} onChange={e => set('purchaseCost', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="label">Warranty Expiry</label>
            <input type="date" className="input" value={form.warrantyExpiry} onChange={e => set('warrantyExpiry', e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          {!asset && (
            <button
              type="button"
              className="btn-secondary btn"
              disabled={saving}
              onClick={e => handleSubmit(e, true)}
            >
              Assign Asset
            </button>
          )}
          <button type="submit" className="btn-primary btn" disabled={saving} onClick={e => handleSubmit(e, false)}>
            {saving ? 'Saving...' : 'Save Asset'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

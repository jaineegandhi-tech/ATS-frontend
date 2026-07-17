import { useState } from 'react';
import Modal from './Modal';
import { ASSET_CONDITIONS, returnAsset } from '../../utils/assets';
import { todayStr } from '../../utils/helpers';

export default function AssetReturnModal({ asset, currentUser, onClose, onSaved }) {
  const [returnedDate, setReturnedDate] = useState(todayStr());
  const [conditionOnReturn, setConditionOnReturn] = useState(asset.condition || 'Good');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!returnedDate) return setError('Please enter a returned date.');

    setSaving(true);
    try {
      returnAsset({ assetId: asset.id, returnedDate, conditionOnReturn, user: currentUser });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Mark Asset Returned" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Asset</label>
          <p className="text-sm text-gray-800 py-2 font-semibold">{asset.name} <span className="text-gray-400 font-normal">({asset.id})</span></p>
        </div>

        <div>
          <label className="label">Assigned To</label>
          <p className="text-sm text-gray-800 py-2">{asset.assignedEmployeeName || '—'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Returned Date</label>
            <input type="date" className="input" value={returnedDate} onChange={e => setReturnedDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Condition on Return</label>
            <select className="input" value={conditionOnReturn} onChange={e => setConditionOnReturn(e.target.value)}>
              {ASSET_CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary btn" disabled={saving}>
            {saving ? 'Saving...' : 'Mark Returned'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useState } from 'react';
import Modal from './Modal';
import { assignAsset, getAllAssets } from '../../utils/assets';
import { todayStr } from '../../utils/helpers';

export default function AssetAssignModal({
  asset = null,
  employees,
  currentUser,
  onClose,
  onSaved,
  preselectedEmployeeId = null,
  pickAsset = false,
}) {
  const availableAssets = getAllAssets().filter(a => a.status === 'Available');
  const [assetId, setAssetId] = useState(asset?.id || '');
  const [employeeId, setEmployeeId] = useState(preselectedEmployeeId || '');
  const [assignedDate, setAssignedDate] = useState(todayStr());
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedAsset = pickAsset
    ? availableAssets.find(a => a.id === assetId)
    : asset;
  const selectedEmployee = employees.find(e => e.id === employeeId);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selectedAsset) return setError(pickAsset ? 'Please select an asset.' : 'Asset not found.');
    if (!selectedEmployee) return setError('Please select an employee.');
    if (!assignedDate) return setError('Please enter an assigned date.');

    setSaving(true);
    try {
      assignAsset({
        assetId: selectedAsset.id,
        employee: selectedEmployee,
        assignedDate,
        expectedReturnDate,
        notes,
        user: currentUser,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Assign Asset" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {pickAsset ? (
          <div>
            <label className="label">Asset</label>
            <select className="input" value={assetId} onChange={e => setAssetId(e.target.value)}>
              <option value="">Select available asset</option>
              {availableAssets.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.id}) — {a.category}</option>
              ))}
            </select>
            {availableAssets.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No available assets. Add assets in Asset Management first.</p>
            )}
          </div>
        ) : (
          <div>
            <label className="label">Asset</label>
            <p className="text-sm text-gray-800 py-2 font-semibold">{asset.name} <span className="text-gray-400 font-normal">({asset.id})</span></p>
          </div>
        )}

        <div>
          <label className="label">Employee</label>
          {preselectedEmployeeId ? (
            <p className="text-sm text-gray-800 py-2 font-semibold">
              {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '—'}
            </p>
          ) : (
            <select className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">Select employee</option>
              {employees.filter(e => e.status === 'active').map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {emp.department || emp.id}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Assigned Date</label>
            <input type="date" className="input" value={assignedDate} onChange={e => setAssignedDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Expected Return Date</label>
            <input type="date" className="input" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes about this assignment" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary btn" disabled={saving || (pickAsset && availableAssets.length === 0)}>
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

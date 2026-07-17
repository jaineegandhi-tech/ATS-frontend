import { useMemo, useState } from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS, getStore } from '../../utils/store';
import { ASSET_CATEGORIES, ASSET_STATUSES, getAllAssets } from '../../utils/assets';
import AssetTable from '../../components/shared/AssetTable';
import AssetFormModal from '../../components/shared/AssetFormModal';
import AssetAssignModal from '../../components/shared/AssetAssignModal';
import AssetReturnModal from '../../components/shared/AssetReturnModal';
import AssetHistoryModal from '../../components/shared/AssetHistoryModal';

export default function AssetManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [, forceUpdate] = useState(0);

  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const assets = getAllAssets();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(a => (
      (!q || `${a.id} ${a.name} ${a.category} ${a.brand} ${a.model} ${a.serialNumber} ${a.assignedEmployeeName}`.toLowerCase().includes(q)) &&
      (!category || a.category === category) &&
      (!status || a.status === status) &&
      (!employeeId || a.assignedEmployeeId === employeeId)
    ));
  }, [assets, category, employeeId, search, status]);

  function handleSaved(newId, assignAfter = false) {
    setShowAdd(false);
    setEditTarget(null);
    forceUpdate(n => n + 1);
    if (assignAfter && newId) {
      const asset = getAllAssets().find(a => a.id === newId);
      if (asset) setAssignTarget(asset);
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} of {assets.length} assets</p>
        </div>
        <button className="btn-primary btn" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Asset
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 input-sm" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select className="input w-auto input-sm" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="input w-auto input-sm" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {ASSET_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="input w-auto input-sm" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <AssetTable
          assets={filtered}
          canManage
          onEdit={setEditTarget}
          onAssign={setAssignTarget}
          onReturn={setReturnTarget}
          onHistory={setHistoryTarget}
        />
      </div>

      {(showAdd || editTarget) && (
        <AssetFormModal
          title={editTarget ? 'Edit Asset' : 'Add Asset'}
          asset={editTarget}
          currentUser={user}
          onClose={() => { setShowAdd(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {assignTarget && (
        <AssetAssignModal
          asset={assignTarget}
          employees={employees}
          currentUser={user}
          onClose={() => setAssignTarget(null)}
          onSaved={() => { setAssignTarget(null); forceUpdate(n => n + 1); }}
        />
      )}

      {returnTarget && (
        <AssetReturnModal
          asset={returnTarget}
          currentUser={user}
          onClose={() => setReturnTarget(null)}
          onSaved={() => { setReturnTarget(null); forceUpdate(n => n + 1); }}
        />
      )}

      {historyTarget && (
        <AssetHistoryModal
          asset={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}

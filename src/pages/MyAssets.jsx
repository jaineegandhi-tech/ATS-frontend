import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ASSET_CATEGORIES, getVisibleAssets } from '../utils/assets';
import AssetEmployeeTable from '../components/shared/AssetEmployeeTable';

export default function MyAssets() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [, forceUpdate] = useState(0);

  const assets = getVisibleAssets(user, user?.id);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(a => (
      (!q || `${a.name} ${a.category} ${a.serialNumber} ${a.status}`.toLowerCase().includes(q)) &&
      (!category || a.category === category)
    ));
  }, [assets, category, search]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Assets</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} of {assets.length} assigned assets</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 input-sm" placeholder="Search your assets..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select className="input w-auto input-sm" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <AssetEmployeeTable assets={filtered} />
      </div>
    </div>
  );
}

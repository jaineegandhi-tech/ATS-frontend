import { Package, Search } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import StatusBadge from './StatusBadge';

export default function AssetEmployeeTable({ assets }) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Search size={28} className="mx-auto mb-2 text-gray-200" />
        No assets assigned to you.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {['Asset Name', 'Category', 'Serial Number', 'Assigned Date', 'Expected Return', 'Status'].map(h => (
              <th key={h} className="table-th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => (
            <tr key={asset.id} className="table-row">
              <td className="table-td">
                <div className="flex items-start gap-2">
                  <Package size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="font-semibold text-gray-900 text-sm">{asset.name}</p>
                </div>
              </td>
              <td className="table-td">
                <span className="badge-blue">{asset.category}</span>
              </td>
              <td className="table-td text-gray-500 font-mono text-xs">{asset.serialNumber || '—'}</td>
              <td className="table-td text-gray-500">{formatDate(asset.assignedDate)}</td>
              <td className="table-td text-gray-500">{formatDate(asset.expectedReturnDate)}</td>
              <td className="table-td"><StatusBadge status={asset.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

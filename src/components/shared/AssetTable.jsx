import { History, Package, Pencil, RotateCcw, Search, UserPlus } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import StatusBadge from './StatusBadge';

export default function AssetTable({
  assets,
  canManage = false,
  onEdit,
  onAssign,
  onReturn,
  onHistory,
}) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Search size={28} className="mx-auto mb-2 text-gray-200" />
        No assets found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {['Asset ID', 'Asset Name', 'Category', 'Assigned Employee', 'Assigned Date', 'Expected Return', 'Status']
              .concat(canManage ? ['Actions'] : [])
              .map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => (
            <tr key={asset.id} className="table-row">
              <td className="table-td">
                <span className="text-xs font-mono text-gray-500">{asset.id}</span>
              </td>
              <td className="table-td">
                <div className="flex items-start gap-2">
                  <Package size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{asset.name}</p>
                    {(asset.brand || asset.model) && (
                      <p className="text-xs text-gray-400">{[asset.brand, asset.model].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="table-td">
                <span className="badge-blue">{asset.category}</span>
              </td>
              <td className="table-td">
                {asset.assignedEmployeeName ? (
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{asset.assignedEmployeeName}</p>
                    <p className="text-xs text-gray-400">{asset.assignedEmployeeId}</p>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="table-td text-gray-500">{formatDate(asset.assignedDate)}</td>
              <td className="table-td text-gray-500">{formatDate(asset.expectedReturnDate)}</td>
              <td className="table-td"><StatusBadge status={asset.status} /></td>
              {canManage && (
                <td className="table-td">
                  <div className="flex items-center gap-1.5">
                    <button className="btn btn-xs btn-secondary" title="Edit" onClick={() => onEdit(asset)}>
                      <Pencil size={12} />
                    </button>
                    {asset.status === 'Available' && (
                      <button className="btn btn-xs btn-secondary" title="Assign" onClick={() => onAssign(asset)}>
                        <UserPlus size={12} />
                      </button>
                    )}
                    {asset.status === 'Assigned' && (
                      <button className="btn btn-xs btn-secondary" title="Mark Returned" onClick={() => onReturn(asset)}>
                        <RotateCcw size={12} />
                      </button>
                    )}
                    <button className="btn btn-xs btn-secondary" title="View History" onClick={() => onHistory(asset)}>
                      <History size={12} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

}

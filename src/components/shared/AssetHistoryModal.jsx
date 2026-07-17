import { History } from 'lucide-react';
import Modal from './Modal';
import { formatDate } from '../../utils/helpers';

export default function AssetHistoryModal({ asset, onClose }) {
  const history = asset.history || [];

  return (
    <Modal title={`Asset History — ${asset.name}`} onClose={onClose} size="lg">
      {history.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <History size={28} className="mx-auto mb-2 text-gray-200" />
          No assignment history for this asset.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Assigned Employee', 'Assigned By', 'Assigned Date', 'Expected Return', 'Returned Date', 'Condition on Return', 'Notes'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(entry => (
                <tr key={entry.id} className="table-row">
                  <td className="table-td">
                    <p className="font-semibold text-gray-900 text-sm">{entry.assignedEmployeeName}</p>
                    <p className="text-xs text-gray-400">{entry.assignedEmployeeId}</p>
                  </td>
                  <td className="table-td">{entry.assignedByName || '—'}</td>
                  <td className="table-td text-gray-500">{formatDate(entry.assignedDate)}</td>
                  <td className="table-td text-gray-500">{formatDate(entry.expectedReturnDate)}</td>
                  <td className="table-td text-gray-500">{formatDate(entry.returnedDate)}</td>
                  <td className="table-td">{entry.conditionOnReturn || '—'}</td>
                  <td className="table-td text-gray-500 text-xs max-w-[160px]">{entry.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

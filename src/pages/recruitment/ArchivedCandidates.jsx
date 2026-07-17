import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import { Eye, RotateCcw } from 'lucide-react';

export default function ArchivedCandidates() {
  useStorageSync();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  const candidates = getStore(STORAGE_KEYS.CANDIDATES).filter(c => c.status === 'archived');

  function restore(id) {
    const all = getStore(STORAGE_KEYS.CANDIDATES);
    setStore(STORAGE_KEYS.CANDIDATES, all.map(c => c.id === id ? { ...c, status: 'New Candidate' } : c));
    addLog('Candidate Restored', user.id, `Candidate ${id} restored from archive`);
    forceUpdate(n => n + 1);
  }

  return (
    <div className="space-y-5">
      <h1 className="page-title">Archived Candidates</h1>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['ID', 'Candidate', 'Applied Position', 'Department', 'Created', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {candidates.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No archived candidates.</td></tr>
              ) : candidates.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-td text-xs text-gray-400">{c.id}</td>
                  <td className="table-td">
                    <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </td>
                  <td className="table-td">{c.appliedPosition}</td>
                  <td className="table-td">{c.department}</td>
                  <td className="table-td">{formatDate(c.createdAt)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/recruitment/candidates/${c.id}`)}><Eye size={13} /></button>
                      <button className="btn btn-sm btn-secondary" title="Restore" onClick={() => restore(c.id)}><RotateCcw size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

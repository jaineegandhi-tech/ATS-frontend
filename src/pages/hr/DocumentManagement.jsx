import { useMemo, useState } from 'react';
import { FileUp, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS, getStore } from '../../utils/store';
import { deleteDocument, DOCUMENT_TYPES, getVisibleDocuments } from '../../utils/documents';
import DocumentFormModal from '../../components/shared/DocumentFormModal';
import DocumentTable from '../../components/shared/DocumentTable';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

export default function DocumentManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [, forceUpdate] = useState(0);

  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const documents = getVisibleDocuments(user);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter(doc => (
      (!q || `${doc.employeeName} ${doc.department} ${doc.type} ${doc.name} ${doc.fileName} ${doc.uploadedByName}`.toLowerCase().includes(q)) &&
      (!employeeId || doc.employeeId === employeeId) &&
      (!type || doc.type === type)
    ));
  }, [documents, employeeId, search, type]);

  function refresh() {
    setShowUpload(false);
    setReplaceTarget(null);
    setDeleteTarget(null);
    forceUpdate(n => n + 1);
  }

  function handleDelete() {
    deleteDocument(deleteTarget.id, user);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} of {documents.length} documents</p>
        </div>
        <button className="btn-primary btn" onClick={() => setShowUpload(true)}>
          <FileUp size={15} /> Upload Document
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 input-sm" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select className="input w-auto input-sm" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
            <select className="input w-auto input-sm" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All Types</option>
              {DOCUMENT_TYPES.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <DocumentTable
          documents={filtered}
          showEmployee
          canDelete
          onReplace={setReplaceTarget}
          onDelete={setDeleteTarget}
        />
      </div>

      {showUpload && (
        <DocumentFormModal
          title="Upload Document"
          employees={employees}
          currentUser={user}
          onClose={() => setShowUpload(false)}
          onSaved={refresh}
        />
      )}

      {replaceTarget && (
        <DocumentFormModal
          title="Replace Document"
          employees={employees}
          currentUser={user}
          replacing={replaceTarget}
          onClose={() => setReplaceTarget(null)}
          onSaved={refresh}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Document"
          message={`Delete ${deleteTarget.name} for ${deleteTarget.employeeName}? This cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

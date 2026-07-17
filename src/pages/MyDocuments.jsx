import { useMemo, useState } from 'react';
import { FileUp, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_TYPES, getVisibleDocuments } from '../utils/documents';
import DocumentFormModal from '../components/shared/DocumentFormModal';
import DocumentTable from '../components/shared/DocumentTable';

export default function MyDocuments() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [, forceUpdate] = useState(0);

  const documents = getVisibleDocuments(user, user?.id);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter(doc => (
      (!q || `${doc.type} ${doc.name} ${doc.fileName} ${doc.uploadedByName}`.toLowerCase().includes(q)) &&
      (!type || doc.type === type)
    ));
  }, [documents, search, type]);

  function refresh() {
    setShowUpload(false);
    setReplaceTarget(null);
    forceUpdate(n => n + 1);
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Documents</h1>
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
            <input className="input pl-9 input-sm" placeholder="Search your documents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select className="input w-auto input-sm" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All Types</option>
              {DOCUMENT_TYPES.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <DocumentTable documents={filtered} onReplace={setReplaceTarget} />
      </div>

      {showUpload && (
        <DocumentFormModal
          title="Upload Document"
          fixedEmployee={user}
          currentUser={user}
          onClose={() => setShowUpload(false)}
          onSaved={refresh}
        />
      )}

      {replaceTarget && (
        <DocumentFormModal
          title="Replace Document"
          fixedEmployee={user}
          currentUser={user}
          replacing={replaceTarget}
          onClose={() => setReplaceTarget(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

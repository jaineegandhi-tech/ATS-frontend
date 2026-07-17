import { useState } from 'react';
import Modal from './Modal';
import {
  ACCEPTED_DOCUMENT_EXTENSIONS,
  DOCUMENT_TYPES,
  readDocumentFile,
  saveDocument,
  validateDocumentFile,
} from '../../utils/documents';

export default function DocumentFormModal({ title, employees = [], currentUser, fixedEmployee = null, replacing = null, onClose, onSaved }) {
  const [employeeId, setEmployeeId] = useState(fixedEmployee?.id || replacing?.employeeId || '');
  const [type, setType] = useState(replacing?.type || '');
  const [name, setName] = useState(replacing?.name || '');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedEmployee = fixedEmployee || employees.find(emp => emp.id === employeeId);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selectedEmployee) return setError('Please select an employee.');
    if (!type) return setError('Please select a document type.');
    if (!name.trim()) return setError('Please enter a document name.');
    const fileError = validateDocumentFile(file);
    if (fileError) return setError(fileError);

    try {
      setSaving(true);
      const dataUrl = await readDocumentFile(file);
      saveDocument({
        employee: selectedEmployee,
        type,
        name: name.trim(),
        file,
        dataUrl,
        uploadedBy: currentUser,
        replaceId: replacing?.id,
      });
      onSaved();
    } catch (err) {
      setError(`${err.message} If this is a large file, browser storage may not have enough space.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!fixedEmployee && (
          <div>
            <label className="label">Employee</label>
            <select className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={Boolean(replacing)}>
              <option value="">Select employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} - {emp.department || emp.id}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Document Type</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              <option value="">Select type</option>
              {DOCUMENT_TYPES.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Document Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Example: PAN card front" />
          </div>
        </div>

        <div>
          <label className="label">Upload File</label>
          <input className="input" type="file" accept={ACCEPTED_DOCUMENT_EXTENSIONS} onChange={e => setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, or PNG. Maximum size 20 MB.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-3 py-2 text-sm">{error}</div>}

        <div className="flex justify-end gap-2.5">
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary btn" disabled={saving}>{saving ? 'Saving...' : replacing ? 'Save' : 'Upload'}</button>
        </div>
      </form>
    </Modal>
  );
}

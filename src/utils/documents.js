import { STORAGE_KEYS, getStore, setStore, addLog } from './store';

export const DOCUMENT_TYPES = [
  'Resume',
  'Aadhaar Card',
  'PAN Card',
  'Passport',
  'Driving License',
  'Educational Certificates',
  'Experience Certificate',
  'Offer Letter',
  'Appointment Letter',
  'Salary Letter',
  'Relieving Letter',
  'Other',
];

export const ACCEPTED_DOCUMENT_FORMATS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export const ACCEPTED_DOCUMENT_EXTENSIONS = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

export function canAccessAllDocuments(user) {
  return user?.role === 'hr' || user?.role === 'management';
}

export function getVisibleDocuments(user, employeeId = null) {
  const documents = getStore(STORAGE_KEYS.DOCUMENTS);
  if (canAccessAllDocuments(user)) {
    return employeeId ? documents.filter(doc => doc.employeeId === employeeId) : documents;
  }
  return documents.filter(doc => doc.employeeId === user?.id);
}

export function validateDocumentFile(file) {
  if (!file) return 'Please choose a file.';
  if (!ACCEPTED_DOCUMENT_FORMATS.includes(file.type)) {
    return 'Supported formats are PDF, DOC, DOCX, JPG, and PNG.';
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return 'File size must be 20 MB or less.';
  }
  return '';
}

export function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readDocumentFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result);
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export function saveDocument({ employee, type, name, file, dataUrl, uploadedBy, replaceId = null }) {
  const documents = getStore(STORAGE_KEYS.DOCUMENTS);
  const uploadedAt = new Date().toISOString();
  const uploadedByName = `${uploadedBy.firstName} ${uploadedBy.lastName}`;

  const payload = {
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    department: employee.department || '',
    type,
    name,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    dataUrl,
    uploadedAt,
    uploadedById: uploadedBy.id,
    uploadedByName,
    status: 'Active',
  };

  const updated = replaceId
    ? documents.map(doc => doc.id === replaceId ? { ...doc, ...payload, id: doc.id, createdAt: doc.createdAt || uploadedAt } : doc)
    : [{ id: `DOC${Date.now()}`, createdAt: uploadedAt, ...payload }, ...documents];

  setStore(STORAGE_KEYS.DOCUMENTS, updated);
  addLog(replaceId ? 'Document Replaced' : 'Document Uploaded', uploadedBy.id, `${uploadedByName} ${replaceId ? 'replaced' : 'uploaded'} ${name} for ${employee.firstName} ${employee.lastName}`);
}

export function deleteDocument(documentId, user) {
  const documents = getStore(STORAGE_KEYS.DOCUMENTS);
  const target = documents.find(doc => doc.id === documentId);
  setStore(STORAGE_KEYS.DOCUMENTS, documents.filter(doc => doc.id !== documentId));
  if (target && user) {
    addLog('Document Deleted', user.id, `${user.firstName} ${user.lastName} deleted ${target.name} for ${target.employeeName}`);
  }
}

export function downloadDocument(doc) {
  const link = document.createElement('a');
  link.href = doc.dataUrl;
  link.download = doc.fileName || doc.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function viewDocument(doc) {
  const win = window.open();
  if (win) {
    win.document.write(`<iframe title="${doc.name}" src="${doc.dataUrl}" style="border:0;width:100%;height:100vh"></iframe>`);
    win.document.close();
  } else {
    downloadDocument(doc);
  }
}

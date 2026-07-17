import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmClass = 'btn-danger' }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={18} className="text-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          <div className="flex justify-end gap-2.5 mt-5">
            <button className="btn-secondary btn btn-sm" onClick={onCancel}>Cancel</button>
            <button className={`btn btn-sm ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

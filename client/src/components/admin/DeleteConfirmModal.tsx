import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemName?: string;
  description?: string;
  confirmText?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  description = 'This action is permanent and cannot be undone. Any associated dependencies or analytics may be permanently affected.',
  confirmText = 'Delete Permanently',
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4 mb-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            {itemName && (
              <p className="text-sm font-semibold text-rose-500 dark:text-rose-400 mt-0.5 break-words">
                "{itemName}"
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end space-x-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

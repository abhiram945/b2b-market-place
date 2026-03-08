import React from 'react';
import { X, AlertCircle, CheckCircle } from '../icons';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type }) => {
  if (!isOpen) return null;

  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
  const buttonColor = type === 'success' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm m-4">
        <div className="p-6 text-center">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${type === 'success' ? 'bg-green-100' : 'bg-red-100'} dark:${type === 'success' ? 'bg-green-900' : 'bg-red-900'}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <h3 id="modal-title" className="mt-5 text-xl font-semibold text-gray-900">
                {title}
            </h3>
            <div className="mt-2">
                <p className="text-sm text-gray-500">
                    {message}
                </p>
            </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

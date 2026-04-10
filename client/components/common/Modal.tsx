import React from 'react';
import { X as XIcon } from '../icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeButtonClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, closeButtonClassName = 'text-gray-400 hover:text-brand-red' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">
            {title.split(' ').map((word, i) => (
                <span key={i} className={i === 0 ? "text-brand-red mr-1" : ""}>{word} </span>
            ))}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 transition-all cursor-pointer transform hover:rotate-90 ${closeButtonClassName}`}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

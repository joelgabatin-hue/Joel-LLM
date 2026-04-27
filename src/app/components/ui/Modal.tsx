import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'default' | 'large';
}

export default function Modal({ isOpen, onClose, title, children, size = 'default' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] ${
          size === 'large' ? 'w-full max-w-4xl' : 'w-full max-w-lg'
        } max-h-[90vh] overflow-y-auto m-4`}
      >
        <div className="sticky top-0 bg-white border-b border-[#D1D5DB] px-6 py-4 flex items-center justify-between">
          <h2 className="text-[24px] font-semibold text-[#111827]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#4B5563]" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

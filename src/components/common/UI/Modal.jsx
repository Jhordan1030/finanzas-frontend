import React from 'react';
import { X } from 'lucide-react';

const Modal = ({
                 isOpen,
                 onClose,
                 title,
                 children,
                 size = 'md',
                 showCloseButton = true,
                 backdropClose = true,
                 className = ''
               }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          {backdropClose && (
              <div
                  className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
                  onClick={onClose}
                  aria-hidden="true"
              />
          )}

          {/* Trick to center modal */}
          <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
          >
          &#8203;
        </span>

          <div
              className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]} ${className}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3
                    className="text-lg font-semibold text-gray-900"
                    id="modal-title"
                >
                  {title}
                </h3>
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Cerrar modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              {children}
            </div>
          </div>
        </div>
      </div>
  );
};

export default Modal;
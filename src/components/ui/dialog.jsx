import React from 'react';
import { X } from 'lucide-react';

const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const DialogHeader = ({ children, className = "" }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const DialogTitle = ({ children, className = "" }) => (
  <h2 className={`text-lg font-semibold ${className}`}>
    {children}
  </h2>
);

const DialogDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-gray-600 mt-2 ${className}`}>
    {children}
  </p>
);

const DialogClose = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
  >
    <X className="h-4 w-4" />
  </button>
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
};
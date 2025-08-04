import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({ children, value, onValueChange }) => {
  return (
    <div className="relative">
      {React.Children.map(children, child => 
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  );
};

const SelectTrigger = ({ children, className = "", value, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {React.Children.map(React.Children.toArray(children).find(child => child.type === SelectContent)?.props.children, child =>
            React.cloneElement(child, { 
              onSelect: (selectedValue) => {
                onValueChange(selectedValue);
                setIsOpen(false);
              }
            })
          )}
        </div>
      )}
    </>
  );
};

const SelectValue = ({ placeholder, value }) => {
  return <span>{value || placeholder}</span>;
};

const SelectContent = ({ children }) => {
  return <>{children}</>;
};

const SelectItem = ({ children, value, onSelect }) => {
  return (
    <div
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      onClick={() => onSelect(value)}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Check className="h-4 w-4" />
      </span>
      {children}
    </div>
  );
};

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
};
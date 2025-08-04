import React from 'react';
import { Check } from 'lucide-react';

const Checkbox = ({ 
  checked, 
  onCheckedChange, 
  className = "", 
  id,
  ...props 
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      className={`peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white ${
        checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
      } ${className}`}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      {checked && (
        <Check className="h-3 w-3" />
      )}
    </button>
  );
};

export { Checkbox };
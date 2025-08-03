import React, { useState } from 'react';

export function Tabs({ children, defaultValue, value, onValueChange, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultValue || value || '');
  
  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) onValueChange(newValue);
  };

  return (
    <div className={`tabs ${className}`}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, onTabChange: handleTabChange })
      )}
    </div>
  );
}

export function TabsList({ children, className = '', activeTab, onTabChange }) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, onTabChange })
      )}
    </div>
  );
}

export function TabsTrigger({ children, value, className = '', activeTab, onTabChange }) {
  const isActive = activeTab === value;
  
  return (
    <button
      onClick={() => onTabChange(value)}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive 
          ? 'text-blue-600 border-b-2 border-blue-600' 
          : 'text-gray-500 hover:text-gray-700'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className = '', activeTab }) {
  if (activeTab !== value) return null;
  
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
}

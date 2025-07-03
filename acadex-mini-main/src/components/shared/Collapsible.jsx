import React, { useState } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

const Collapsible = ({ title, children, isCollapsed, classes }) => {
  const [isOpen, setIsOpen] = useState(!isCollapsed);

  const toggleCollapsible = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`border border-slate-300 rounded-md overflow-hidden ${classes}`}>
      <button
        className="w-full dark:bg-slate-700 dark:text-white p-4 text-left bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
        onClick={toggleCollapsible}
      >
        <span className="font-semibold">{title}</span>
        {isOpen ? (
          <FiChevronUp className="h-5 w-5" />
        ) : (
          <FiChevronDown className="h-5 w-5" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

function Dropdown({ trigger, children, align = 'right', className }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn-ghost flex items-center gap-2"
      >
        {trigger}
        <ChevronDown className="w-4 h-4" />
      </button>
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-2 ${align === 'right' ? 'right-0' : 'left-0'} ${className || ''}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

Dropdown.Item = ({ children, onClick, className, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
      active
        ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    } ${className || ''}`}
  >
    {children}
  </button>
);

export default Dropdown;
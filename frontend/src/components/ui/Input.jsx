import { forwardRef } from 'react';

const Input = forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={`
        w-full px-4 py-2.5 rounded-lg
        border
        ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary-500 focus:border-primary-500'}
        bg-white dark:bg-slate-800
        text-slate-900 dark:text-slate-50
        placeholder-slate-400 dark:placeholder-slate-500
        focus:outline-none transition-all duration-200
        ${className || ''}
      `}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
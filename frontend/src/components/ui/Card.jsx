import { forwardRef } from 'react';

const Card = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`
        bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800
        shadow-sm transition-all duration-200 hover:shadow-md
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

Card.Header = ({ className, children }) => (
  <div className={`flex items-center gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 ${className || ''}`}>
    {children}
  </div>
);

Card.Content = ({ className, children }) => (
  <div className={`px-6 py-4 ${className || ''}`}>{children}</div>
);

Card.Footer = ({ className, children }) => (
  <div className={`flex items-center gap-4 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl ${className || ''}`}>
    {children}
  </div>
);

export default Card;
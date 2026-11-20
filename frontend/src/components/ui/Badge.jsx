function Badge({ className, variant = 'secondary', children }) {
  const variants = {
    primary: 'bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20',
    secondary: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    success: 'bg-success-50 text-success-600 border-success-100 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20',
    warning: 'bg-warning-50 text-warning-600 border-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20',
    danger: 'bg-danger-50 text-danger-600 border-danger-100 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/20',
    info: 'bg-info-50 text-info-600 border-info-100 dark:bg-info-500/10 dark:text-info-400 dark:border-info-500/20',
    outline: 'bg-transparent text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-700',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variants[variant]} ${className || ''}
      `}
    >
      {children}
    </span>
  );
}

export default Badge;
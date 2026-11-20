import { Inbox, Clock, Bell, SearchX, Users } from 'lucide-react';

const ICONS = {
  tasks: Inbox,
  noResults: SearchX,
  notifications: Bell,
  empty: Clock,
  team: Users,
};

function EmptyState({ type = 'empty', title, description, action, actionLabel, className, icon }) {
  const Icon = icon || ICONS[type] || ICONS.empty;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-20 px-6 ${className || ''}`}
    >
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mb-6">{description}</p>
      )}
      {action && actionLabel && (
        <button className="btn-primary">{actionLabel}</button>
      )}
    </div>
  );
}

export default EmptyState;
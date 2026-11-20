function Separator({ className, orientation = 'horizontal' }) {
  return (
    <div
      className={`
        flex-shrink-0
        ${orientation === 'horizontal' ? 'w-full h-[1px]' : 'h-full w-[1px]'}
        bg-slate-200 dark:bg-slate-800
        ${className || ''}
      `}
    />
  );
}

export default Separator;
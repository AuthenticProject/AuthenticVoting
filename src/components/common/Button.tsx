import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary-gold' | 'primary-navy' | 'secondary' | 'danger' | 'outline';
  size?: 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary-gold',
  size = 'lg',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none touch-manipulation focus:outline-none focus:ring-4 focus:ring-gold-accent/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none shadow-md';

  const sizeClasses = {
    md: 'min-h-[48px] px-6 py-3 text-base',
    lg: 'min-h-[56px] px-8 py-3.5 text-lg',
    xl: 'min-h-[64px] px-10 py-4 text-xl tracking-wide',
  };

  const variantClasses = {
    'primary-gold':
      'bg-gradient-to-r from-gold-light via-gold-accent to-gold-dark text-navy-900 font-bold hover:brightness-105 shadow-gold-accent/20 border border-gold-light/40',
    'primary-navy':
      'bg-navy-primary text-white hover:bg-navy-secondary border border-navy-light/40 shadow-navy-900/30',
    'secondary':
      'bg-white text-navy-primary hover:bg-slate-50 border-2 border-slate-border text-slate-700 shadow-sm',
    'danger':
      'bg-rose-600 text-white hover:bg-rose-700 border border-rose-500 shadow-rose-600/20',
    'outline':
      'bg-transparent text-navy-primary border-2 border-navy-primary/30 hover:border-navy-primary hover:bg-navy-primary/5',
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-3">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Memproses...</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-3">
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>
      )}
    </button>
  );
};

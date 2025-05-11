import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return 'bg-primary text-primary-foreground hover:bg-primary/90';
        case 'success':
          return 'bg-green-600 text-white hover:bg-green-700';
        case 'danger':
          return 'bg-red-600 text-white hover:bg-red-700';
        case 'outline':
          return 'border border-input bg-background hover:bg-muted';
        case 'ghost':
          return 'hover:bg-muted';
        default:
          return 'bg-card text-card-foreground border border-input hover:bg-muted';
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'h-8 px-3 text-xs';
        case 'lg':
          return 'h-11 px-8';
        case 'icon':
          return 'h-9 w-9 p-0'; // Tamanho específico para botão de ícone
        default:
          return 'h-10 px-4 py-2';
      }
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none',
          getVariantClasses(),
          getSizeClasses(),
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
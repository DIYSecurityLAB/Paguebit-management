import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import Button from './Button';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Modal({
  title,
  isOpen,
  onClose,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    };
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Size variations
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fadeIn">
      <div 
        ref={modalRef}
        className={cn(
          "bg-card border border-border rounded-lg shadow-lg w-full flex flex-col animate-slideIn",
          sizeStyles[size],
          className
        )}
        style={{ maxHeight: 'calc(100vh - 32px)', margin: '16px' }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-card flex-shrink-0">
          <h2 className="text-base sm:text-lg font-medium text-foreground truncate">{title}</h2>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-muted ml-2 flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-grow">
          {children}
        </div>
        
        {footer && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-card flex-shrink-0 space-y-2 sm:space-y-0 sm:space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
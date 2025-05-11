import { cn } from '../utils/cn';

interface CardItemProps {
  title: string;
  titleClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function CardItem({ 
  title, 
  titleClassName,
  children, 
  footer, 
  onClick,
  className 
}: CardItemProps) {
  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50",
        className
      )}
      onClick={onClick}
    >
      <div className="px-4 py-3 bg-card border-b border-border">
        <h3 className={`font-medium text-foreground ${titleClassName || ''}`}>{title}</h3>
      </div>
      
      <div className="p-4 flex flex-col space-y-2">
        {children}
      </div>
      
      {footer && (
        <div className="px-4 py-3 bg-muted/40 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}
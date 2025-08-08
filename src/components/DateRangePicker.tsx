import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../utils/cn';
import Button from './Button';

interface DateRangePickerProps {
  label?: string;
  value: { from: string; to: string };
  onChange: (value: { from: string; to: string }) => void;
  disabled?: boolean;
  className?: string;
}

export default function DateRangePicker({
  label,
  value,
  onChange,
  disabled = false,
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDisplayValue = () => {
    if (!value.from && !value.to) return 'Selecionar período';
    if (value.from && !value.to) return `De ${formatDate(value.from)}`;
    if (!value.from && value.to) return `Até ${formatDate(value.to)}`;
    return `${formatDate(value.from)} - ${formatDate(value.to)}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (!value.from || (value.from && value.to)) {
      // Primeiro clique ou resetar seleção
      onChange({ from: dateStr, to: '' });
    } else {
      // Segundo clique
      if (new Date(dateStr) < new Date(value.from)) {
        onChange({ from: dateStr, to: value.from });
      } else {
        onChange({ from: value.from, to: dateStr });
      }
      setIsOpen(false);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!value.from || !value.to) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr >= value.from && dateStr <= value.to;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === value.from || dateStr === value.to;
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: '', to: '' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="text-xs text-muted-foreground mb-1 block flex items-center">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          {label}
        </label>
      )}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2.5 text-sm bg-background border border-input rounded-lg cursor-pointer",
          "flex items-center justify-between min-h-[40px]",
          "hover:border-primary/50 transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-primary ring-2 ring-primary/20"
        )}
      >
        <div className="flex items-center flex-1">
          <Calendar className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
          <span className={cn(
            "truncate",
            (!value.from && !value.to) && "text-muted-foreground"
          )}>
            {formatDisplayValue()}
          </span>
        </div>
        
        {(value.from || value.to) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] lg:absolute lg:inset-auto lg:top-full lg:left-0 lg:right-0 lg:z-50">
          {/* Overlay para mobile */}
          <div 
            className="fixed inset-0 bg-black/20 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Container do calendário */}
          <div className={cn(
            "relative z-10 mx-4 mt-16 mb-4 lg:mx-0 lg:mt-1 lg:mb-0",
            "bg-popover border border-border rounded-lg shadow-xl p-4",
            "max-w-sm mx-auto lg:max-w-none lg:min-w-[320px]"
          )}>
            {/* Header do calendário */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="font-medium text-sm">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-xs text-muted-foreground text-center p-2 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendário */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => (
                <div key={index} className="aspect-square">
                  {date && (
                    <button
                      onClick={() => handleDayClick(date)}
                      className={cn(
                        "w-full h-full text-xs rounded-md transition-all duration-150",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isDateSelected(date) && "bg-primary text-primary-foreground font-medium",
                        isDateInRange(date) && !isDateSelected(date) && "bg-primary/10 text-primary",
                        !isDateInRange(date) && !isDateSelected(date) && "text-foreground"
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Ações rápidas */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  const today = new Date();
                  const todayStr = today.toISOString().split('T')[0];
                  onChange({ from: todayStr, to: todayStr });
                  setIsOpen(false);
                }}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  onChange({ 
                    from: weekAgo.toISOString().split('T')[0], 
                    to: today.toISOString().split('T')[0] 
                  });
                  setIsOpen(false);
                }}
              >
                7 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                  onChange({ 
                    from: monthAgo.toISOString().split('T')[0], 
                    to: today.toISOString().split('T')[0] 
                  });
                  setIsOpen(false);
                }}
              >
                30 dias
              </Button>
            </div>

            {/* Botão fechar para mobile */}
            <div className="lg:hidden mt-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

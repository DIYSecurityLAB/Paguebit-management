import { useEffect, useState, useCallback, memo, useRef } from 'react';
import Button from './Button';
import { X, Search, Filter, Sliders } from 'lucide-react';
import { cn } from '../utils/cn';
import Select from './Select';
import DateRangePicker from './DateRangePicker';
import { 
  Clock, FileCheck, CheckCircle, XCircle, 
  DollarSign, Loader, AlertCircle
} from 'lucide-react';

interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'daterange';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  onFilterChange: (filters: Record<string, any>) => void;
  className?: string;
  isLoading?: boolean;
}

function FilterBar({ filters, onFilterChange, className, isLoading = false }: FilterBarProps) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [shouldUpdate, setShouldUpdate] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce states
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [debouncedTextValues, setDebouncedTextValues] = useState<Record<string, string>>({});

  const isInitialMount = useRef(true);

  // Atualiza o valor do campo de texto imediatamente, mas só dispara o filtro após debounce
  const handleTextChange = useCallback((key: string, value: string) => {
    setDebouncedTextValues(prev => ({ ...prev, [key]: value }));

    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(() => {
      setFilterValues(prev => {
        if (value === '') {
          const newFilters = { ...prev };
          delete newFilters[key];
          return newFilters;
        }
        return { ...prev, [key]: value };
      });
      setShouldUpdate(true);
    }, 1000);
  }, []);

  // Para select e daterange, dispara imediatamente
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilterValues(prev => {
      if (value === '') {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
    setShouldUpdate(true);
  }, []);

  const handleDateRangeChange = useCallback((value: { from: string; to: string }) => {
    setDateRange(value);
    setShouldUpdate(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    setDateRange({ from: '', to: '' });
    setDebouncedTextValues({});
    onFilterChange({});
  }, [onFilterChange]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (shouldUpdate || (!shouldUpdate && Object.keys(filterValues).length === 0 && !dateRange.from && !dateRange.to)) {
      const dateFilters: Record<string, string> = {};
      if (dateRange.from) {
        dateFilters['dateRangeFrom'] = dateRange.from;
      }
      if (dateRange.to) {
        dateFilters['dateRangeTo'] = dateRange.to;
      }
      onFilterChange({ ...filterValues, ...dateFilters });
      setShouldUpdate(false);
    }
  }, [filterValues, dateRange, shouldUpdate, onFilterChange]);

  const hasActiveFilters = Object.keys(filterValues).length > 0 || dateRange.from || dateRange.to;
  const activeFilterCount = Object.keys(filterValues).length + (dateRange.from || dateRange.to ? 1 : 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'receipt_sent':
        return <FileCheck className="h-4 w-4 text-blue-500" />;
      case 'under_review':
        return <Search className="h-4 w-4 text-purple-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'not_approved':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paid':
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case 'withdrawal_processing':
        return <Loader className="h-4 w-4 text-indigo-500" />;
      case 'processing':
        return <Loader className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Filter className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl shadow-sm overflow-visible transition-all duration-300",
      className
    )}>
      {/* Header do FilterBar */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Sliders className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Filtros</h3>
            </div>
            
            {activeFilterCount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpar
              </Button>
            )}
            
            {/* Área clicável maior para mobile */}
            <div
              className="lg:hidden cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isExpanded ? 'Ocultar' : 'Mostrar'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo dos filtros */}
      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-visible",
        "lg:block", // Sempre visível em desktop
        isExpanded ? "block" : "hidden" // Controlado por toggle em mobile
      )}>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map((filter) => {
              if (filter.type === 'text') {
                return (
                  <div key={filter.key} className="space-y-2">
                    <label htmlFor={filter.key} className="text-xs font-medium text-muted-foreground">
                      {filter.label}
                    </label>
                    <div className="relative group">
                      <input
                        id={filter.key}
                        type="text"
                        placeholder={filter.placeholder}
                        value={debouncedTextValues[filter.key] ?? filterValues[filter.key] ?? ''}
                        onChange={(e) => handleTextChange(filter.key, e.target.value)}
                        className={cn(
                          "w-full px-3 py-2.5 pl-10 text-sm bg-background border border-input rounded-lg",
                          "placeholder:text-muted-foreground/60",
                          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                          "transition-all duration-200",
                          "group-hover:border-primary/50",
                          isLoading && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isLoading}
                      />
                      <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-hover:text-primary/70" />
                    </div>
                  </div>
                );
              }

              if (filter.type === 'select') {
                const seen = new Set<string>();
                const selectOptions = [
                  { value: '', label: 'Todos', icon: <Filter className="h-4 w-4 text-gray-500" /> },
                  ...filter.options!
                    .filter(option => {
                      if (option.value === '') return false;
                      if (seen.has(option.value)) return false;
                      seen.add(option.value);
                      return true;
                    })
                    .map(option => ({
                      value: option.value,
                      label: option.label,
                      icon: getStatusIcon(option.value)
                    }))
                ];
                
                return (
                  <div key={filter.key} className="space-y-2">
                    <Select
                      label={filter.label}
                      options={selectOptions}
                      value={filterValues[filter.key] || ''}
                      onChange={(value) => handleFilterChange(filter.key, value)}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                );
              }

              if (filter.type === 'daterange') {
                return (
                  <div key={filter.key} className="sm:col-span-2 lg:col-span-1 xl:col-span-2 space-y-2 relative z-1">
                    <DateRangePicker
                      label={filter.label}
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Ações adicionais em mobile */}
          {isExpanded && hasActiveFilters && (
            <div className="lg:hidden pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-sm"
                onClick={handleClearFilters}
                leftIcon={<X className="h-4 w-4" />}
                isLoading={isLoading}
                disabled={isLoading}
              >
                Limpar Todos os Filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(FilterBar);
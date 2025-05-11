import { useEffect, useState, useCallback, memo, useRef } from 'react';
import Button from './Button';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

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
  const [dateRangeFrom, setDateRangeFrom] = useState<string>('');
  const [dateRangeTo, setDateRangeTo] = useState<string>('');
  const [shouldUpdate, setShouldUpdate] = useState(false);
  
  // Referência para evitar o loop infinito
  const isInitialMount = useRef(true);

  // Usar useCallback para evitar recriação da função a cada renderização
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilterValues(prev => {
      // Se o valor for vazio, remova o filtro
      if (value === '') {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
    setShouldUpdate(true);
  }, []);

  const handleDateRangeChange = useCallback((type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setDateRangeFrom(value);
    } else {
      setDateRangeTo(value);
    }
    setShouldUpdate(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    // Limpa todos os filtros internamente
    setFilterValues({});
    setDateRangeFrom('');
    setDateRangeTo('');
    
    // Envia um objeto vazio para o componente pai
    // Isso sinaliza para limpar todos os filtros
    onFilterChange({});
    
    // Não definimos shouldUpdate aqui, pois queremos enviar a atualização diretamente
  }, [onFilterChange]);

  // Atualizar o componente pai apenas quando houver uma mudança real e explícita
  useEffect(() => {
    // Pular a execução na renderização inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Só notificar mudanças quando o sinalizador shouldUpdate for verdadeiro
    if (shouldUpdate) {
      const dateFilters: Record<string, string> = {};
      if (dateRangeFrom) {
        dateFilters['dateRangeFrom'] = dateRangeFrom;
      }
      if (dateRangeTo) {
        dateFilters['dateRangeTo'] = dateRangeTo;
      }
      
      onFilterChange({ ...filterValues, ...dateFilters });
      setShouldUpdate(false);
    }
  }, [filterValues, dateRangeFrom, dateRangeTo, shouldUpdate, onFilterChange]);

  const hasActiveFilters = Object.keys(filterValues).length > 0 || dateRangeFrom || dateRangeTo;

  return (
    <div className={cn("flex flex-wrap gap-3 items-end", className)}>
      {filters.map((filter) => {
        if (filter.type === 'text') {
          return (
            <div key={filter.key} className="flex flex-col space-y-1">
              <label htmlFor={filter.key} className="text-sm font-medium">
                {filter.label}
              </label>
              <input
                id={filter.key}
                type="text"
                placeholder={filter.placeholder}
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
            </div>
          );
        }

        if (filter.type === 'select') {
          return (
            <div key={filter.key} className="flex flex-col space-y-1">
              <label htmlFor={filter.key} className="text-sm font-medium">
                {filter.label}
              </label>
              <select
                id={filter.key}
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              >
                <option value="">Todos</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (filter.type === 'daterange') {
          return (
            <div key={filter.key} className="flex flex-col space-y-1">
              <label className="text-sm font-medium">
                {filter.label}
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRangeFrom}
                  onChange={(e) => handleDateRangeChange('from', e.target.value)}
                  className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isLoading}
                />
                <span className="self-center">até</span>
                <input
                  type="date"
                  value={dateRangeTo}
                  onChange={(e) => handleDateRangeChange('to', e.target.value)}
                  className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isLoading}
                />
              </div>
            </div>
          );
        }

        return null;
      })}

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="self-end"
          onClick={handleClearFilters}
          leftIcon={<X className="h-4 w-4" />}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}

// Usar memo para evitar re-renderizações desnecessárias
export default memo(FilterBar);
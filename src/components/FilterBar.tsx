import { useEffect, useState, useCallback, memo, useRef } from 'react';
import Button from './Button';
import { X, Search, Calendar, Filter } from 'lucide-react';
import { cn } from '../utils/cn';
import Select from './Select';
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

  // Mapeamento de ícones e cores por status
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
    <div className={cn("p-4 bg-card border border-border rounded-lg shadow-sm", className)}>
      <h3 className="font-medium text-sm mb-3 flex items-center">
        <Filter className="h-4 w-4 mr-1.5" /> Filtros
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filters.map((filter) => {
          if (filter.type === 'text') {
            return (
              <div key={filter.key} className="relative">
                <label htmlFor={filter.key} className="text-xs text-muted-foreground mb-1 block">
                  {filter.label}
                </label>
                <div className="relative">
                  <input
                    id={filter.key}
                    type="text"
                    placeholder={filter.placeholder}
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-1.5 pl-8 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isLoading}
                  />
                  <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            );
          }

          if (filter.type === 'select') {
            // Transformar as opções para incluir ícones
            const selectOptions = [
              { value: '', label: 'Todos', icon: <Filter className="h-4 w-4 text-gray-500" /> },
              ...filter.options!.map(option => ({
                value: option.value,
                label: option.label,
                icon: getStatusIcon(option.value)
              }))
            ];
            
            return (
              <div key={filter.key} className="relative">
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
              <div key={filter.key} className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {filter.label}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRangeFrom}
                      onChange={(e) => handleDateRangeChange('from', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={isLoading}
                      placeholder="De"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRangeTo}
                      onChange={(e) => handleDateRangeChange('to', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={isLoading}
                      placeholder="Até"
                    />
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleClearFilters}
            leftIcon={<X className="h-3.5 w-3.5" />}
            isLoading={isLoading}
            disabled={isLoading}
          >
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}

// Usar memo para evitar re-renderizações desnecessárias
export default memo(FilterBar);
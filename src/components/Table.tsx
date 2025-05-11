import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface TableColumn<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortKey?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  onRowClick?: (item: T) => void;
}

export default function Table<T>({
  data,
  columns,
  isLoading = false,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
}: TableProps<T>) {
  const renderSortIndicator = (column: TableColumn<T>) => {
    if (!column.sortable || !column.sortKey || !onSort) return null;
    
    if (sortColumn === column.sortKey) {
      return sortDirection === 'asc' 
        ? <ArrowUp className="h-4 w-4 ml-1" /> 
        : <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return null;
  };

  const handleHeaderClick = (column: TableColumn<T>) => {
    if (column.sortable && column.sortKey && onSort) {
      onSort(column.sortKey);
    }
  };

  const renderRows = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={columns.length} className="py-10 text-center text-muted-foreground">
            <div className="flex flex-col items-center">
              <svg 
                className="animate-spin h-8 w-8 text-primary mb-2" 
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
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Carregando...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="py-10 text-center text-muted-foreground">
            Nenhum resultado encontrado
          </td>
        </tr>
      );
    }

    function cn(...classes: (string | false | null | undefined)[]): string {
      return classes.filter(Boolean).join(' ');
    }

    return data.map((item, rowIndex) => (
      <tr 
      key={rowIndex} 
      className={cn(
        "border-b border-border last:border-0",
        onRowClick && "hover:bg-muted/50 cursor-pointer"
      )}
      onClick={() => onRowClick?.(item)}
      >
      {columns.map((column, colIndex) => {
        const value = column.accessor(item);
        
        return (
        <td 
          key={colIndex}
          className={cn("py-3 px-4", (column as any).className)}
        >
          {value as React.ReactNode}
        </td>
        );
      })}
      </tr>
    ));
  };

  const renderHeader = (column: TableColumn<T>) => {
    if (column.sortable && column.sortKey && onSort) {
      return (
        <button
          className="flex items-center w-full text-left focus:outline-none"
          onClick={() => onSort(column.sortKey as string)}
        >
          {column.header}
          {sortColumn === column.sortKey && (
            <span className="ml-1">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </span>
          )}
        </button>
      );
    }
    
    return column.header;
  };

  return (
    <div className="relative overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {columns.map((column, i) => (
              <th 
                key={i} 
                className={`px-4 py-3 text-left font-medium ${column.sortable ? 'cursor-pointer hover:bg-muted/80' : ''}`}
              >
                {renderHeader(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {renderRows()}
        </tbody>
      </table>
    </div>
  );
}
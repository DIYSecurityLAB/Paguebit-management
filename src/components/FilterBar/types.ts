export type FilterType = "select" | "daterange" | "text";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface FilterOption {
  key: string;
  label: string;
  type: FilterType;
  placeholder?: string;
  options?: SelectOption[];
}

export interface FilterBarProps {
  filters: FilterOption[];
  onFilterChange: (filters: Record<string, any>) => void;
  className?: string;
  isLoading?: boolean;
}

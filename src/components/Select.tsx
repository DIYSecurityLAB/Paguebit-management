import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../utils/cn';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const Select = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Selecione uma opção',
  label,
  className,
  disabled = false
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(
    options.find(opt => opt.value === value) || null
  );
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedOption(options.find(opt => opt.value === value) || null);
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectRef]);

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block w-full", className)} ref={selectRef}>
      {label && (
        <label className="text-xs text-muted-foreground mb-1 block">
          {label}
        </label>
      )}
      <button
        type="button"
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm",
          "border border-input rounded-md bg-background",
          "focus:outline-none focus:ring-1 focus:ring-primary",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/20",
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="mr-2">{selectedOption.icon}</span>
              )}
              <span 
                className={cn(
                  "truncate",
                  selectedOption.color
                )}
              >
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover shadow-md overflow-hidden">
          <ul className="py-1 max-h-60 overflow-auto" role="listbox">
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === selectedOption?.value}
                className={cn(
                  "px-3 py-2 flex items-center cursor-pointer text-sm",
                  "hover:bg-muted/70 transition-colors",
                  option.value === selectedOption?.value ? "bg-muted/50" : ""
                )}
                onClick={() => handleOptionClick(option)}
              >
                <div className="flex items-center flex-grow">
                  {option.icon && (
                    <span className="mr-2">{option.icon}</span>
                  )}
                  <span className={cn("truncate", option.color)}>
                    {option.label}
                  </span>
                </div>
                {option.value === selectedOption?.value && (
                  <Check className="h-4 w-4 ml-2 text-primary" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;

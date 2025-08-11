import React, { createContext, useContext, useState } from "react";
import { cn } from "../lib/utils";

type TabsContextType = {
  value: string;
  setValue: (val: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  value?: string;
  onValueChange?: (val: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}
export function Tabs({ value, onValueChange, defaultValue, children, className }: TabsProps) {
  // Se for controlado, use props, senão use estado interno
  const isControlled = value !== undefined && onValueChange !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const ctxValue = {
    value: isControlled ? value! : internalValue,
    setValue: isControlled ? onValueChange! : setInternalValue,
  };
  return (
    <TabsContext.Provider value={ctxValue}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}
export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-background p-1 text-muted-foreground", className)}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-primary/10 text-primary shadow-sm" : "",
        className
      )}
      aria-selected={isActive}
      onClick={() => ctx.setValue(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
export function TabsContent({ value, children, className }: TabsContentProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return (
    <div className={cn("mt-2 ring-offset-background", className)}>
      {children}
    </div>
  );
}

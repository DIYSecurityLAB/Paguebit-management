import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-card rounded-lg shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
}

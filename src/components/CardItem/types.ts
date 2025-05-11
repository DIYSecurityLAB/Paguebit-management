import { ReactNode } from 'react';

export interface CardItemProps {
  title: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

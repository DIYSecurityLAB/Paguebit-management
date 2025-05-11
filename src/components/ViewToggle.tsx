import { useEffect, useState, ReactNode } from 'react';
import { Table, LayoutGrid, Smartphone } from 'lucide-react';
import Button from './Button';

// Definindo os tipos de visualização possíveis
export type ViewMode = 'auto' | 'table' | 'card';

interface ViewToggleProps {
  storageKey: string;
  tableView: ReactNode;
  cardView: ReactNode;
  className?: string;
}

export default function ViewToggle({ 
  storageKey, 
  tableView, 
  cardView, 
  className = ''
}: ViewToggleProps) {
  const [isMobile, setIsMobile] = useState(false);
  // Estado para controlar o modo de visualização
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Recupera a preferência salva no localStorage ou usa 'auto' como padrão
    const savedMode = localStorage.getItem(storageKey);
    return (savedMode as ViewMode) || 'auto';
  });

  // Monitora mudanças de tamanho da tela para modo automático
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Salva a preferência do usuário no localStorage quando o modo muda
  useEffect(() => {
    localStorage.setItem(storageKey, viewMode);
  }, [viewMode, storageKey]);

  // Determina qual componente deve ser renderizado com base no modo e tamanho da tela
  const renderViewComponent = () => {
    if (viewMode === 'auto') {
      return isMobile ? cardView : tableView;
    }
    return viewMode === 'card' ? cardView : tableView;
  };

  return (
    <div className={className}>
      <div className="flex items-center space-x-2 bg-card border border-border rounded-md p-1">
        <Button
          variant={viewMode === 'auto' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('auto')}
          leftIcon={<Smartphone className="h-4 w-4" />}
          className="rounded-sm"
        >
          Auto
        </Button>
        <Button
          variant={viewMode === 'card' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('card')}
          leftIcon={<LayoutGrid className="h-4 w-4" />}
          className="rounded-sm"
        >
          Cards
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('table')}
          leftIcon={<Table className="h-4 w-4" />}
          className="rounded-sm"
        >
          Tabela
        </Button>
      </div>
      {renderViewComponent()}
    </div>
  );
}

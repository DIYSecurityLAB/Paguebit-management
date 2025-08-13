import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ImageViewerProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export default function ImageViewer({ src, alt, isOpen, onClose, onDownload }: ImageViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Garantir que o arrastar seja liberado mesmo se o mouse sair da tela
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Função util para clamp
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  // Cálculo centralizado de zoom alterando posição para manter foco do ponto (cx, cy em coords do elemento)
  const applyZoomAtPoint = useCallback((nextZoom: number, cx: number, cy: number) => {
    nextZoom = clamp(nextZoom, 0.5, 5);
    setZoomLevel(prevZoom => {
      if (!imageRef.current) return nextZoom;
      if (prevZoom === nextZoom) return prevZoom;
      const rect = imageRef.current.getBoundingClientRect();
      // Coordenadas relativas (0..1)
      const rx = (cx - rect.left) / rect.width;
      const ry = (cy - rect.top) / rect.height;
      setPosition(prevPos => {
        if (nextZoom <= 1) return { x: 0, y: 0 };
        const scaleDelta = nextZoom / prevZoom;
        // Ajusta de forma que o ponto sob o cursor permaneça visualmente estável
        const newX = (prevPos.x - (rx - 0.5) * rect.width) * scaleDelta + (rx - 0.5) * rect.width;
        const newY = (prevPos.y - (ry - 0.5) * rect.height) * scaleDelta + (ry - 0.5) * rect.height;
        return { x: newX, y: newY };
      });
      return nextZoom;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { clientX, clientY, deltaY, deltaMode } = e;
    // Normalização: deltaMode 1 = linhas (~15px), 2 = página (~100px)
    let delta = deltaY;
    if (deltaMode === 1) delta *= 15;
    else if (deltaMode === 2) delta *= 100;
    // Converte em fator
    const sensitivity = 300; // maior => zoom mais suave
    const factor = 1 - delta / sensitivity;
    let targetZoom = zoomLevel * factor;
    applyZoomAtPoint(targetZoom, clientX, clientY);
  }, [zoomLevel, applyZoomAtPoint]);

  const handleZoomIn = useCallback(() => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      applyZoomAtPoint(zoomLevel + 0.5, rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      setZoomLevel(prev => Math.min(prev + 0.5, 5));
    }
  }, [zoomLevel, applyZoomAtPoint]);

  const handleZoomOut = useCallback(() => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      applyZoomAtPoint(zoomLevel - 0.5, rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    }
  }, [zoomLevel, applyZoomAtPoint]);

  // Duplo clique / toque
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const next = zoomLevel <= 1 ? 2 : 1;
    applyZoomAtPoint(next, e.clientX, e.clientY);
  };

  // Suporte a pinch (Pointer Events)
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchRef.current = { distance: dist, zoom: zoomLevel };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && initialPinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const { distance, zoom } = initialPinchRef.current;
      if (distance > 0) {
        const scale = dist / distance;
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        applyZoomAtPoint(zoom * scale, midX, midY);
      }
    } else if (isDragging) {
      // arraste com mouse já existente
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      initialPinchRef.current = null;
    }
  };

  // Toque simples + duplo toque (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    if (e.touches.length === 1 && now - lastTapRef.current < 300) {
      const t = e.touches[0];
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        applyZoomAtPoint(zoomLevel <= 1 ? 2 : 1, t.clientX, t.clientY);
      }
      e.preventDefault();
    }
    lastTapRef.current = now;
  };

  // Adicione o event listener manualmente para wheel (passive: false)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { clientX, clientY, deltaY, deltaMode } = e;
      let delta = deltaY;
      if (deltaMode === 1) delta *= 15;
      else if (deltaMode === 2) delta *= 100;
      const sensitivity = 300;
      const factor = 1 - delta / sensitivity;
      let targetZoom = zoomLevel * factor;
      applyZoomAtPoint(targetZoom, clientX, clientY);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, applyZoomAtPoint, isOpen]);

  // Atalhos de teclado
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetView();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, { passive: false });
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleZoomIn, handleZoomOut, onClose]);

  // Processa o src da imagem para exibir corretamente (base64 ou URL)
  const getImageUrl = () => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    return `data:image/jpeg;base64,${src}`;
  };

  // Função para realizar o download da imagem diretamente
  const handleDirectDownload = () => {
    if (!src) return;

    try {
      const imageUrl = getImageUrl();
      // Use setTimeout para evitar manipulação do DOM durante render do React
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `comprovante_${new Date().toISOString().split('T')[0]}.jpg`;
        document.body.appendChild(link);
        link.click();
        // Só remove se ainda estiver no DOM
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      }, 0);
    } catch (error) {
      console.error('Falha ao baixar imagem:', error);
    }
  };

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload();
    } else {
      handleDirectDownload();
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center">
      {/* Overlay sem eventos de clique */}
      <div className="absolute inset-0 bg-black/90 pointer-events-none" />

      {/* Conteúdo do visualizador */}
      <div className="relative z-10 flex flex-col w-full h-full">
        {/* Cabeçalho com controles - Melhorado para ter ícones maiores */}
        <div className="w-full flex flex-wrap items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-black/80">
          <div className="text-white text-base sm:text-xl font-medium truncate max-w-[50%] sm:max-w-[60%]">
            {alt}
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-black/40 px-3 py-2 rounded-full">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} className="text-white hover:bg-black/40 p-2">
                <ZoomOut className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <span className="text-white text-sm sm:text-base font-medium">{(zoomLevel * 100).toFixed(0)}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} className="text-white hover:bg-black/40 p-2">
                <ZoomIn className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRotate} className="text-white hover:bg-black/40 p-2 rounded-full">
              <RotateCw className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetView} className="text-white hover:bg-black/40 p-2 rounded-full">
              <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadClick}
              className="text-white hover:bg-black/40 p-2 rounded-full"
            >
              <Download className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-black/40 p-2 rounded-full">
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>

        {/* Container da imagem - Redução do tamanho máximo */}
        <div
          ref={containerRef}
          className="flex-1 w-full flex items-center justify-center overflow-hidden select-none"
          onPointerDown={(e) => { onPointerDown(e); handleMouseDown(e as any); }}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => { onPointerUp(e); handleMouseUp(); }}
          onPointerCancel={onPointerUp}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          style={{
            cursor: isDragging || pointersRef.current.size === 2 ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default'),
            touchAction: 'none'
          }}
        >
          <div
            className="p-4 bg-black/20 rounded-lg"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging || pointersRef.current.size === 2 ? 'none' : 'transform 0.1s ease-out',
              maxWidth: '90%',
              maxHeight: '80vh'
            }}
          >
            <img
              ref={imageRef}
              src={getImageUrl()}
              alt={alt}
              className="max-h-[calc(80vh-120px)] max-w-full object-contain select-none shadow-xl"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                transition: (isDragging || pointersRef.current.size === 2) ? 'none' : 'transform 0.15s ease-out'
              }}
              draggable="false"
              onDragStart={e => e.preventDefault()}
            />
          </div>
        </div>

        {/* Instruções na parte inferior - Mais legíveis */}
        <div className="py-3 sm:py-4 px-3 sm:px-6 text-white text-xs sm:text-sm bg-black/80 w-full text-center">
          <span className="hidden sm:inline">Use a roda do mouse para zoom • {zoomLevel > 1 ? 'Arraste para mover •' : ''} Botões no topo para mais opções</span>
          <span className="sm:hidden">Pinch para zoom • {zoomLevel > 1 ? 'Arraste para mover •' : ''} Toque nos ícones para mais opções</span>
        </div>
      </div>
    </div>
  );
}

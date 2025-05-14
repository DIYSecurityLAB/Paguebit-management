import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4">{message}</p>
            
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground italic mb-4">
                Esta ação será gravada e auditada no sistema.
              </p>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelButtonText}
                </Button>
                <Button
                  variant="default"
                  onClick={onConfirm}
                  isLoading={isLoading}
                >
                  {confirmButtonText}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

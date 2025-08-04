import Modal from './Modal';
import Button from './Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar ação",
  message = "Tem certeza que deseja realizar esta ação?"
}: DeleteConfirmModalProps) {
  const confirmLabel =
    title?.toLowerCase().includes('ativar') ? 'Ativar' :
    title?.toLowerCase().includes('desativar') ? 'Desativar' :
    'Confirmar';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-foreground">{message}</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

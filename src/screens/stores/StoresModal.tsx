import Modal from '../../components/Modal';
import { Store } from '../../domain/entities/Store.entity';

interface StoresModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
}

export default function StoresModal({ store, isOpen, onClose }: StoresModalProps) {
  return (
    <Modal
      title="Detalhes da Loja"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Nome</label>
            <p className="font-medium">
              {store.name || <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">OwnerId</label>
            <p className="font-medium">
              {store.ownerId || <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">WhitelabelId</label>
            <p className="font-medium">
              {store.whitelabelId || <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Criado em</label>
            <p className="font-medium">
              {store.createdAt ? new Date(store.createdAt).toLocaleString() : <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Atualizado em</label>
            <p className="font-medium">
              {store.updatedAt ? new Date(store.updatedAt).toLocaleString() : <span className="text-red-500">sem informação</span>}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

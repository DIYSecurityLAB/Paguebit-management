import Modal from '../../components/Modal';
import { User } from '../../models/types';

interface UsersModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function UsersModal({ user, isOpen, onClose }: UsersModalProps) {
  return (
    <Modal
      title="Detalhes do Usuário"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Foto do usuário */}
          {user.pictureUrl && (
            <div className="col-span-2 flex flex-col items-center mb-2">
              <img
                src={user.pictureUrl}
                alt="Foto do usuário"
                className="w-24 h-24 rounded-full object-cover border"
              />
            </div>
          )}
          <div>
            <label className="text-sm text-muted-foreground">Nome</label>
            <p className="font-medium">
              {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="font-medium">
              {user.email || <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Documento</label>
            <p className="font-medium">
              {user.documentId ? 
                `${user.documentType}: ${user.documentId}` : 
                <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Telefone</label>
            <p className="font-medium">
              {user.phoneNumber || <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Função</label>
            <p className="font-medium capitalize">
              {user.role || <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          {user.referral && (
            <div>
              <label className="text-sm text-muted-foreground">Indicação</label>
              <p className="font-medium">{user.referral}</p>
            </div>
          )}
          <div>
            <label className="text-sm text-muted-foreground">Planeja transacionar mensalmente</label>
            <p className="font-medium">
              R$ {user.monthlyVolume !== undefined && user.monthlyVolume !== null
                ? user.monthlyVolume
                : <span className="text-red-500">sem informação</span>}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
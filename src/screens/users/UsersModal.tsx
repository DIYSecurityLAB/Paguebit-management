import Modal from '../../components/Modal';
import { User } from '../../domain/entities/User.entity';

interface UsersModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
}

export default function UsersModal({ user, isOpen, onClose, loading }: UsersModalProps) {
  return (
    <Modal
      title="Detalhes do Usuário"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando...</div>
      ) : (
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
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <p className="font-medium">
              {user.active === true || user.active === 'true'
                ? <span className="text-green-600">Ativo</span>
                : <span className="text-red-500">Inativo</span>}
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
          <div>
            <label className="text-sm text-muted-foreground">Criado em</label>
            <p className="font-medium">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleString('pt-BR')
                : <span className="text-red-500">sem informação</span>}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Atualizado em</label>
            <p className="font-medium">
              {user.updatedAt
                ? new Date(user.updatedAt).toLocaleString('pt-BR')
                : <span className="text-red-500">sem informação</span>}
            </p>
          </div>
        </div>
        {/* Exibe as lojas vinculadas */}
        {user.stores && user.stores.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Loja(s) vinculada(s)</h2>
            <ul className="space-y-2">
              {user.stores.map(store => (
                <li key={store.id} className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{store.id}</span>
                  {store.name && (
                    <span className="text-sm ml-2">{store.name}</span>
                  )}
                  <button
                    className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-muted transition"
                    onClick={() => window.open(`/stores/${store.id}`, '_blank')}
                    type="button"
                  >
                    Abrir loja
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7m5-5 2 2m0 0-2 2m2-2H9"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}
    </Modal>
  );
}
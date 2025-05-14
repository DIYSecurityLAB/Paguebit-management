import { useState } from 'react';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Copy } from 'lucide-react';
import { AuditLog } from '../../models/types';

interface AuditLogDetailModalProps {
  log: AuditLog;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditLogDetailModal({ log, isOpen, onClose }: AuditLogDetailModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // Função para formatar o JSON para exibição
  const formatJSON = (jsonString?: string) => {
    if (!jsonString) return null;
    
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  const handleCopy = (text: string | undefined, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  const previousValue = formatJSON(log.previousValue);
  const newValue = formatJSON(log.newValue);

  return (
    <Modal
      title="Detalhes do Log de Auditoria"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">ID do Log</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs break-all">{log.id}</span>
            <button
              type="button"
              className="p-1 rounded hover:bg-muted transition-colors"
              onClick={() => handleCopy(log.id, 'id')}
              title="Copiar ID"
            >
              <Copy className="h-4 w-4" />
            </button>
            {copied === 'id' && (
              <span className="text-xs text-green-600 ml-1">Copiado!</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Data/Hora</label>
            <p className="font-medium">
              {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
            </p>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Ação</label>
            <p className="font-medium">{log.action}</p>
          </div>
          
          {/* Informações do usuário que realizou a ação, com detalhes melhorados */}
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Usuário</label>
            <div className="bg-muted/30 rounded-md p-3 mt-1">
              {log.user ? (
                <div className="space-y-1">
                  <p className="font-medium">{log.user.name}</p>
                  <p className="text-sm text-muted-foreground">{log.user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs">ID: {log.user.id}</span>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={() => handleCopy(log.user?.id, 'userId')}
                      title="Copiar ID"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copied === 'userId' && (
                      <span className="text-xs text-green-600 ml-1">Copiado!</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs break-all">{log.userId}</span>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-muted transition-colors"
                    onClick={() => handleCopy(log.userId, 'userId')}
                    title="Copiar ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copied === 'userId' && (
                    <span className="text-xs text-green-600 ml-1">Copiado!</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Usuário afetado (se existir) */}
          {log.affectedUserId && (
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">Usuário Afetado</label>
              <div className="bg-muted/30 rounded-md p-3 mt-1">
                {log.affectedUser ? (
                  <div className="space-y-1">
                    <p className="font-medium">{log.affectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{log.affectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs">ID: {log.affectedUser.id}</span>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={() => handleCopy(log.affectedUser?.id, 'affectedUserId')}
                        title="Copiar ID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {copied === 'affectedUserId' && (
                        <span className="text-xs text-green-600 ml-1">Copiado!</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs break-all">{log.affectedUserId}</span>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={() => handleCopy(log.affectedUserId, 'affectedUserId')}
                      title="Copiar ID"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {copied === 'affectedUserId' && (
                      <span className="text-xs text-green-600 ml-1">Copiado!</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {log.paymentId && (
            <div>
              <label className="text-sm text-muted-foreground">ID do Pagamento</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs break-all">{log.paymentId}</span>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted transition-colors"
                  onClick={() => handleCopy(log.paymentId, 'paymentId')}
                  title="Copiar ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copied === 'paymentId' && (
                  <span className="text-xs text-green-600 ml-1">Copiado!</span>
                )}
              </div>
            </div>
          )}
          
          {log.withdrawalId && (
            <div>
              <label className="text-sm text-muted-foreground">ID do Saque</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs break-all">{log.withdrawalId}</span>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted transition-colors"
                  onClick={() => handleCopy(log.withdrawalId, 'withdrawalId')}
                  title="Copiar ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copied === 'withdrawalId' && (
                  <span className="text-xs text-green-600 ml-1">Copiado!</span>
                )}
              </div>
            </div>
          )}
          
          {log.notificationId && (
            <div>
              <label className="text-sm text-muted-foreground">ID da Notificação</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs break-all">{log.notificationId}</span>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted transition-colors"
                  onClick={() => handleCopy(log.notificationId, 'notificationId')}
                  title="Copiar ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copied === 'notificationId' && (
                  <span className="text-xs text-green-600 ml-1">Copiado!</span>
                )}
              </div>
            </div>
          )}
        </div>

        {previousValue && (
          <div>
            <label className="text-sm text-muted-foreground">Valor Anterior</label>
            <div className="mt-1 relative">
              <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                {previousValue}
              </pre>
              <button
                type="button"
                className="absolute top-2 right-2 p-1 rounded hover:bg-card transition-colors"
                onClick={() => handleCopy(previousValue, 'previousValue')}
                title="Copiar"
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied === 'previousValue' && (
                <span className="absolute top-2 right-8 text-xs text-green-600">Copiado!</span>
              )}
            </div>
          </div>
        )}

        {newValue && (
          <div>
            <label className="text-sm text-muted-foreground">Novo Valor</label>
            <div className="mt-1 relative">
              <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                {newValue}
              </pre>
              <button
                type="button"
                className="absolute top-2 right-2 p-1 rounded hover:bg-card transition-colors"
                onClick={() => handleCopy(newValue, 'newValue')}
                title="Copiar"
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied === 'newValue' && (
                <span className="absolute top-2 right-8 text-xs text-green-600">Copiado!</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

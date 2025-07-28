import { useState } from 'react';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
 import { Copy } from 'lucide-react';
import { AuditLog } from '../../domain/entities/AuditLog.entity';

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
              {log.createdAt instanceof Date
                ? format(log.createdAt, "dd/MM/yyyy HH:mm:ss")
                : (typeof log.createdAt === 'string' && log.createdAt.length > 0
                  ? (() => { try { return format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"); } catch { return '-'; } })()
                  : '-')}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Ação</label>
            <p className="font-medium">{log.action}</p>
          </div>
          {/* Campos novos: storeId, whitelabelId, performedBy */}
          {log.storeId && (
            <div>
              <label className="text-sm text-muted-foreground">ID da Loja</label>
              <span className="font-mono text-xs break-all">{log.storeId}</span>
            </div>
          )}
          {log.whitelabelId && (
            <div>
              <label className="text-sm text-muted-foreground">Whitelabel</label>
              <span className="font-mono text-xs break-all">{log.whitelabelId}</span>
            </div>
          )}
          {log.performedBy && (
            <div>
              <label className="text-sm text-muted-foreground">Realizado por</label>
              <span className="font-mono text-xs break-all">{log.performedBy}</span>
            </div>
          )}
          {/* ...existing code... */}
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

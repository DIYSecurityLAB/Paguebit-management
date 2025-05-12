import { useState } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import { ArrowLeft, Download, Edit, Eye, XCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import ImageViewer from '../../../components/ImageViewer';
import { ReviewedPayment, Step } from './BatchReceiptDownloadModal';

interface SummaryStepProps {
  isOpen: boolean;
  onClose: () => void;
  reviewedPayments: ReviewedPayment[];
  setReviewedPayments: (payments: ReviewedPayment[]) => void;
  setCurrentStep: (step: Step) => void;
  setCurrentIndex: (index: number) => void;
  handleGeneratePdf: () => void;
  isGeneratingPdf: boolean;
}

export default function SummaryStep({ 
  isOpen, 
  onClose, 
  reviewedPayments,
  setReviewedPayments,
  setCurrentStep,
  setCurrentIndex,
  handleGeneratePdf,
  isGeneratingPdf
}: SummaryStepProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  
  const validPayments = reviewedPayments.filter(item => !item.ignored);
  
  // Função para iniciar a edição de um item
  const startEditing = (item: ReviewedPayment) => {
    setEditingItemId(item.payment.id);
    setEditedName(item.name);
  };

  // Função para salvar a edição
  const saveEditing = () => {
    if (editingItemId) {
      const updatedPayments = reviewedPayments.map(item => 
        item.payment.id === editingItemId 
          ? { ...item, name: editedName } 
          : item
      );
      setReviewedPayments(updatedPayments);
      setEditingItemId(null);
    }
  };

  // NOVO: verificar se algum nome não contém "fraguismo"
  const anyMissingFraguismo = validPayments.some(item =>
    !item.name?.toLowerCase().includes('fraguismo')
  );
  // NOVO: lista de ids dos comprovantes sem "fraguismo"
  const missingFraguismoIds = validPayments
    .filter(item => !item.name?.toLowerCase().includes('fraguismo'))
    .map(item => item.payment.id);

  return (
    <>
      <Modal
        title="Resumo de Comprovantes"
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              Revise os comprovantes selecionados antes de gerar o PDF.
              {validPayments.length === 0 && (
                <span className="text-red-500 font-medium ml-1">
                  Atenção: Nenhum comprovante selecionado para o relatório.
                </span>
              )}
            </p>
            {/* AVISO extra caso algum não tenha "fraguismo" */}
            {anyMissingFraguismo && (
              <div className="text-xs text-red-500 font-semibold mt-2">
                Atenção: Um ou mais comprovantes selecionados NÃO possuem o nome "fraguismo" identificado. Verifique se o comprovante corresponde ao destino correto!
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground flex justify-between">
            <span>Total de comprovantes: {reviewedPayments.length}</span>
            <span>
              Selecionados: {validPayments.length} | 
              Ignorados: {reviewedPayments.filter(i => i.ignored).length}
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto border border-border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-right">Valor</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reviewedPayments.map((item, index) => (
                  <tr 
                    key={item.payment.id} 
                    className={`border-t border-border ${item.ignored ? 'bg-muted/40 text-muted-foreground' : ''}`}
                  >
                    <td className="p-2">
                      <div className="flex items-center">
                        {item.ignored ? (
                          <XCircle className="h-4 w-4 text-destructive mr-2 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                        )}
                        
                        {editingItemId === item.payment.id ? (
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={saveEditing}
                            className="w-full p-1 border border-input dark:bg-background dark:text-foreground rounded-md"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className={
                              [
                                item.ignored ? 'line-through' : '',
                                // NOVO: vermelho se não tem "fraguismo" e não está ignorado
                                !item.ignored && !item.name?.toLowerCase().includes('fraguismo') ? 'text-red-500 font-semibold' : '',
                                'cursor-pointer hover:underline'
                              ].join(' ')
                            }
                            onClick={() => !item.ignored && startEditing(item)}
                            title="Clique para editar"
                          >
                            {item.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(item.payment.amount || 0)}
                    </td>
                    <td className="p-2 text-center flex justify-center space-x-2">
                      <Button
                        variant={item.ignored ? "outline" : "danger"}
                        size="sm"
                        onClick={() => {
                          const updated = [...reviewedPayments];
                          updated[index].ignored = !updated[index].ignored;
                          setReviewedPayments(updated);
                        }}
                      >
                        {item.ignored ? "Incluir" : "Ignorar"}
                      </Button>
                      
                      {!item.ignored && editingItemId !== item.payment.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(item)}
                            leftIcon={<Edit className="h-4 w-4" />}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewImage(item.payment.receipt || null)}
                            leftIcon={<Eye className="h-4 w-4" />}
                          >
                            Ver
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(Step.REVIEW);
                setCurrentIndex(0);
              }}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Voltar à Revisão
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleGeneratePdf}
                isLoading={isGeneratingPdf}
                disabled={validPayments.length === 0}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Gerar PDF ({validPayments.length})
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Visualizador de imagem para a tela de resumo */}
      {previewImage && (
        <ImageViewer
          src={previewImage.startsWith('data:') 
            ? previewImage 
            : `data:image/jpeg;base64,${previewImage}`}
          alt="Comprovante de Pagamento"
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
}

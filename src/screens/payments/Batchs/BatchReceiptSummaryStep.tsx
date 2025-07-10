import { useState } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import { ArrowLeft, Download, Edit, Eye, XCircle, CheckCircle, Copy, FileDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import ImageViewer from '../../../components/ImageViewer';
import { ReviewedPayment, Step } from './BatchReceiptDownloadModal';
import { toast } from 'sonner';

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
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [isCopyingList, setIsCopyingList] = useState(false);
  
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

  // CORRIGIDO: verificar usando a propriedade hasbbc em vez da presença da string no nome
  const anyMissingbbc = validPayments.some(item => item.hasbbc === false);
  
  // CORRIGIDO: lista de ids dos comprovantes sem "bbc"
  const missingbbcIds = validPayments
    .filter(item => item.hasbbc === false)
    .map(item => item.payment.id);

  // NOVO: Função para copiar lista para a área de transferência
  const handleCopyList = async () => {
    if (validPayments.length === 0) {
      toast.error('Nenhum comprovante selecionado para copiar');
      return;
    }

    try {
      setIsCopyingList(true);
      
      // Ordenar pagamentos do maior para o menor valor
      const sortedPayments = [...validPayments].sort((a, b) => 
        (b.payment.amount || 0) - (a.payment.amount || 0)
      );
      
      // Criar texto formatado com a lista de comprovantes
      let listText = "Comprovantes de Doação\n\n";
      
      sortedPayments.forEach(({ payment, name }) => {
        listText += `R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${name}\n`;
      });
      
      // Copiar para a área de transferência
      await navigator.clipboard.writeText(listText);
      toast.success('Lista copiada para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar lista:', error);
      toast.error('Falha ao copiar lista');
    } finally {
      setIsCopyingList(false);
    }
  };

  // NOVO: Função para baixar todas as imagens
  const handleDownloadImages = async () => {
    if (validPayments.length === 0) {
      toast.error('Nenhum comprovante selecionado para download');
      return;
    }

    try {
      setIsDownloadingImages(true);
      
      // Ordenar pagamentos do maior para o menor valor
      const sortedPayments = [...validPayments].sort((a, b) => 
        (b.payment.amount || 0) - (a.payment.amount || 0)
      );
      
      // Processar o download de cada imagem
      for (let i = 0; i < sortedPayments.length; i++) {
        const { payment, name } = sortedPayments[i];
        
        if (payment.receipt) {
          // Preparar a imagem (remover prefixo data: se existir)
          const imgData = payment.receipt.startsWith('data:') 
            ? payment.receipt 
            : `data:image/jpeg;base64,${payment.receipt}`;
          
          // Criar um nome de arquivo baseado no valor e nome
          const valor = payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace('.', '-').replace(',', '-');
          const cleanName = name.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 30); // Limitar tamanho e remover caracteres inválidos
          const fileName = `R$${valor}_${cleanName}.jpg`;
          
          // Criar um link temporário para download
          const a = document.createElement('a');
          a.href = imgData;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Pequena pausa para não sobrecarregar o navegador
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      toast.success(`${sortedPayments.length} imagens baixadas com sucesso!`);
    } catch (error) {
      console.error('Erro ao baixar imagens:', error);
      toast.error('Falha ao baixar imagens');
    } finally {
      setIsDownloadingImages(false);
    }
  };

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
            {/* AVISO extra caso algum não tenha "bbc" */}
            {anyMissingbbc && (
              <div className="text-xs text-red-500 font-semibold mt-2">
                Atenção: Um ou mais comprovantes selecionados NÃO possuem o nome "bbc" identificado. Verifique se o comprovante corresponde ao destino correto!
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
                                // CORRIGIDO: vermelho apenas se hasbbc é explicitamente false
                                !item.ignored && item.hasbbc === false ? 'text-red-500 font-semibold' : '',
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

          {/* NOVO: Painel de ações adicionais */}
          <div className="border border-border rounded-md p-3">
            <h3 className="text-sm font-medium mb-2">Ações adicionais</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleCopyList}
                isLoading={isCopyingList}
                disabled={validPayments.length === 0}
                leftIcon={<Copy className="h-4 w-4" />}
                size="sm"
              >
                Copiar Lista
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadImages}
                isLoading={isDownloadingImages}
                disabled={validPayments.length === 0}
                leftIcon={<FileDown className="h-4 w-4" />}
                size="sm"
              >
                Baixar Imagens ({validPayments.length})
              </Button>
            </div>
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

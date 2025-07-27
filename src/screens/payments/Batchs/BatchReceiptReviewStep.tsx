import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import { ArrowLeft, ArrowRight, Edit, Check, Eye, ZoomIn, XCircle, CheckCircle } from 'lucide-react';
import { Payment } from '../../../data/models/types';
import { formatCurrency } from '../../../utils/format';
import OcrNameSuggestion from '../../../components/OcrNameSuggestion';
import ImageViewer from '../../../components/ImageViewer';
import { ReviewedPayment, Step } from './BatchReceiptDownloadModal';

interface ReviewStepProps {
  isOpen: boolean;
  onClose: () => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  reviewedPayments: ReviewedPayment[];
  setReviewedPayments: (payments: ReviewedPayment[]) => void;
  payments: Payment[];
  setCurrentStep: (step: Step) => void;
}

export default function ReviewStep({ 
  isOpen, 
  onClose, 
  currentIndex,
  setCurrentIndex,
  reviewedPayments,
  setReviewedPayments,
  payments,
  setCurrentStep
}: ReviewStepProps) {
  const [currentName, setCurrentName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isIgnored, setIsIgnored] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [hasfraguismo, setHasfraguismo] = useState<boolean | null>(null);

  const currentPayment = payments[currentIndex];
  const isLastPayment = currentIndex === payments.length - 1;
  const isFirstPayment = currentIndex === 0;

  // Atualizar nome e status de ignorado quando mudar o comprovante atual
  useEffect(() => {
    if (currentPayment) {
      const existingReview = reviewedPayments.find(item => item.payment.id === currentPayment.id);
      if (existingReview) {
        setCurrentName(existingReview.name);
        setIsIgnored(existingReview.ignored);
      } else {
        setCurrentName('');
        setIsIgnored(false);
      }
    }
  }, [currentPayment, reviewedPayments]);

  // NOVO: controlar se o nome foi editado manualmente
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);

  // Resetar flag de edição manual ao trocar de comprovante
  useEffect(() => {
    setNameManuallyEdited(false);
  }, [currentPayment]);

  // Salvar o comprovante atual no estado
  const saveCurrentReview = () => {
    if (!currentPayment) return;
    
    // Verificar se já existe este pagamento na lista de revisados
    const existingIndex = reviewedPayments.findIndex(item => item.payment.id === currentPayment.id);
    
    if (existingIndex >= 0) {
      // Atualizar nome e status se já existir
      const updated = [...reviewedPayments];
      updated[existingIndex] = {
        ...updated[existingIndex],
        name: currentName || 'Nome não identificado',
        ignored: isIgnored,
        hasfraguismo: hasfraguismo // Salvar o status de fraguismo
      };
      setReviewedPayments(updated);
    } else {
      // Adicionar novo se não existir
      setReviewedPayments([
        ...reviewedPayments,
        { 
          payment: currentPayment,
          name: currentName || 'Nome não identificado',
          ignored: isIgnored,
          hasfraguismo: hasfraguismo // Salvar o status de fraguismo
        }
      ]);
    }
  };

  // Avançar para o próximo comprovante ou para a tela de resumo
  const handleNext = () => {
    if (currentPayment) {
      saveCurrentReview();
      
      if (isLastPayment) {
        // Se é o último comprovante, avançar para o resumo
        setCurrentStep(Step.SUMMARY);
      } else {
        // Se não, avançar para o próximo comprovante
        setCurrentIndex(currentIndex + 1);
        setIsEditing(false);
      }
    }
  };

  // Voltar para o comprovante anterior
  const handlePrevious = () => {
    if (currentPayment) {
      saveCurrentReview();
      if (!isFirstPayment) {
        setCurrentIndex(currentIndex - 1);
        setIsEditing(false);
      }
    }
  };

  // Alternar o status de ignorado do comprovante atual
  const toggleIgnore = () => {
    setIsIgnored(!isIgnored);
  };

  return (
    <>
      <Modal
        title="Download em Lote de Comprovantes"
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              Revise os comprovantes e os nomes identificados pelo OCR. 
              Você pode editar os nomes se necessário. Ao final, será gerado um PDF com a lista de doações e as imagens dos comprovantes.
            </p>
          
          </div>

          {/* Progresso */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Progresso: {Math.min(reviewedPayments.length, currentIndex + 1)}/{payments.length} comprovantes
            </span>
            <span className="text-muted-foreground">
              Comprovante {currentIndex + 1} de {payments.length}
            </span>
          </div>

          {currentPayment && (
            <div className={`border ${isIgnored ? 'border-destructive bg-destructive/5' : 'border-border'} rounded-lg p-4`}>
              {isIgnored && (
                <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm flex items-center">
                  <XCircle className="h-4 w-4 text-destructive mr-2" />
                  <span>Este comprovante será ignorado no relatório final</span>
                </div>
              )}
            
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Valor</label>
                    <p className="font-medium">{formatCurrency(currentPayment.amount || 0)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="font-medium truncate">
                      {(currentPayment as any).User?.email || currentPayment.email || 'Não informado'}
                    </p>
                  </div>
                </div>

                {/* Nome com opção de edição */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-muted-foreground">Nome Identificado</label>
                    {isEditing ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setIsEditing(false);
                          setNameManuallyEdited(true); // Marcar como editado manualmente
                        }}
                        leftIcon={<Check className="h-4 w-4" />}
                      >
                        Confirmar
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
                        leftIcon={<Edit className="h-4 w-4" />}
                        disabled={isIgnored}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) => {
                        setCurrentName(e.target.value);
                        setNameManuallyEdited(true); // Marcar como editado manualmente ao digitar
                      }}
                      className="w-full p-2 border border-input rounded-md mt-1 dark:bg-background dark:text-foreground"
                      placeholder="Digite o nome correto"
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <div className="w-full">
                        {/* Só roda o OCR se o nome não foi editado manualmente */}
                        {!nameManuallyEdited && (
                          <OcrNameSuggestion 
                            receipt={currentPayment.receipt} 
                            onNameDetected={setCurrentName}
                            onfraguismoCheck={setHasfraguismo}
                          />
                        )}
                        {/* Se já editou manualmente, mostra apenas o nome */}
                        {nameManuallyEdited && (
                          <span className="font-medium">{currentName}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                  {/* AVISO global para o comprovante atual */}
            {hasfraguismo === false && (
              <div className="text-xs text-red-500 font-semibold mt-2">
                Atenção: o nome "fraguismo" NÃO foi encontrado no comprovante!
              </div>
            )}

                {/* Comprovante */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-muted-foreground">Comprovante</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImageViewerOpen(true)}
                      leftIcon={<ZoomIn className="h-4 w-4" />}
                    >
                      Ampliar
                    </Button>
                  </div>
                  <div 
                    className={`border border-border rounded-lg overflow-hidden cursor-pointer relative group ${isIgnored ? 'opacity-50' : ''}`}
                    onClick={() => setIsImageViewerOpen(true)}
                  >
                    <img
                      src={currentPayment.receipt?.startsWith('data:') 
                        ? currentPayment.receipt 
                        : `data:image/jpeg;base64,${currentPayment.receipt}`}
                      alt="Comprovante de Pagamento"
                      className="w-full object-contain h-[300px]"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all duration-200">
                      <div className="bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Eye className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between mt-4 gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstPayment}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Anterior
              </Button>
              <Button
                variant={isIgnored ? "danger" : "outline"}
                onClick={toggleIgnore}
                leftIcon={isIgnored ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              >
                {isIgnored ? "Incluir" : "Ignorar"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {isLastPayment ? "Finalizar Revisão" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Visualizador de imagem ampliada */}
      {currentPayment?.receipt && (
        <ImageViewer
          src={currentPayment.receipt.startsWith('data:') 
            ? currentPayment.receipt 
            : `data:image/jpeg;base64,${currentPayment.receipt}`}
          alt="Comprovante de Pagamento"
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
        />
      )}
    </>
  );
}

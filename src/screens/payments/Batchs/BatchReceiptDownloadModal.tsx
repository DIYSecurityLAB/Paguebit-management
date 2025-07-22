import { useState } from 'react';
import { useQuery } from 'react-query';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import paymentRepository from '../../../repository/payment-repository';
import { Payment, PaymentStatus } from '../../../models/types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import ReviewStep from './BatchReceiptReviewStep';
import SummaryStep from './BatchReceiptSummaryStep';

export interface BatchReceiptDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Tipo para os comprovantes revisados (exportando para uso nos outros arquivos)
export type ReviewedPayment = {
  payment: Payment;
  name: string;
  ignored: boolean;
  hasfraguismo?: boolean | null; // Nova propriedade para rastrear se o comprovante tem "fraguismo"
};

// Etapas do processo (exportando para uso nos outros arquivos)
export enum Step {
  REVIEW = 'review',
  SUMMARY = 'summary'
}

// Componente principal
export default function BatchReceiptDownloadModal({ isOpen, onClose }: BatchReceiptDownloadModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedPayments, setReviewedPayments] = useState<ReviewedPayment[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>(Step.REVIEW);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Buscar pagamentos com status "comprovante enviado"
  const { data: paymentsData, isLoading } = useQuery(
    'payments-with-receipts',
    async () => {
      const response = await paymentRepository.getPayments({
        status: PaymentStatus.RECEIPT_SENT,
        limit: 100 // Limite razoável para processar em lote
      });
      return response.data.filter(payment => payment.receipt);
    },
    { enabled: isOpen }
  );

  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  
  // Função para gerar o PDF final
  const handleGeneratePdf = async () => {
    const validPayments = reviewedPayments.filter(item => !item.ignored);

    if (validPayments.length === 0) {
      toast.error('Nenhum comprovante selecionado para o relatório');
      return;
    }

    try {
      setIsGeneratingPdf(true);

      // Criar PDF com jsPDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text('Comprovantes de Doação', 14, 20);
      
      // Sumário dos comprovantes
      doc.setFontSize(12);
      let y = 30;
      
      // Ordenar pagamentos do maior para o menor valor
      const sortedPayments = [...validPayments].sort((a, b) => 
        (b.payment.amount || 0) - (a.payment.amount || 0)
      );
      
      sortedPayments.forEach(({ payment, name }) => {
        const line = `R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${name}`;
        doc.text(line, 14, y);
        y += 7;
      });
      
      // Adicionar imagens dos comprovantes - CORRIGIDO
      for (let i = 0; i < sortedPayments.length; i++) {
        const { payment, name } = sortedPayments[i];
        
        // Sempre começar um novo comprovante em uma nova página
        doc.addPage();
        
        // Adicionar informações do comprovante (valor e nome)
        const valor = `R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        doc.setFontSize(14);
        doc.text(valor, 14, 20);
        doc.setFontSize(12);
        doc.text(name, 14, 28);
        
        if (payment.receipt) {
          try {
            // Preparar a imagem (remover prefixo data: se existir)
            const imgData = payment.receipt.startsWith('data:') 
              ? payment.receipt 
              : `data:image/jpeg;base64,${payment.receipt}`;
            
            // Definir dimensões fixas adequadas para o PDF (mais simples e confiável)
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Usar 80% da largura e altura disponíveis
            const imgWidth = pageWidth * 0.8;
            const imgHeight = pageHeight * 0.6;
            
            // Centralizar a imagem na página
            const x = (pageWidth - imgWidth) / 2;
            
            // Adicionar a imagem com tamanho adequado
            doc.addImage(imgData, 'JPEG', x, 35, imgWidth, imgHeight);
          } catch (err) {
            console.error('Erro ao adicionar imagem ao PDF:', err);
          }
        }
      }
      
      // Salvar o PDF
      doc.save('comprovantes_doacao.pdf');
      toast.success('PDF gerado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Falha ao gerar PDF dos comprovantes');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Renderizar estados de carregamento ou sem comprovantes
  if (isLoading) {
    return (
      <Modal
        title="Download em Lote de Comprovantes"
        isOpen={isOpen}
        onClose={onClose}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Modal>
    );
  }

  if (payments.length === 0) {
    return (
      <Modal
        title="Download em Lote de Comprovantes"
        isOpen={isOpen}
        onClose={onClose}
      >
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground text-center mb-4">
            Não há comprovantes com status "Comprovante Enviado" disponíveis para revisão.
          </p>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </Modal>
    );
  }

  // Renderização condicional baseada na etapa atual
  return currentStep === Step.REVIEW ? (
    <ReviewStep 
      isOpen={isOpen} 
      onClose={onClose}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      reviewedPayments={reviewedPayments}
      setReviewedPayments={setReviewedPayments}
      payments={payments}
      setCurrentStep={setCurrentStep}
    />
  ) : (
    <SummaryStep 
      isOpen={isOpen} 
      onClose={onClose}
      reviewedPayments={reviewedPayments}
      setReviewedPayments={setReviewedPayments}
      setCurrentStep={setCurrentStep}
      setCurrentIndex={setCurrentIndex}
      handleGeneratePdf={handleGeneratePdf}
      isGeneratingPdf={isGeneratingPdf}
    />
  );
}

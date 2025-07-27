import { useState } from 'react';
import { useQuery } from 'react-query';
import paymentRepository from '../../data/repository/payment-repository';
import { Payment, PaymentStatus } from '../../data/models/types';
import ImageViewer from '../../components/ImageViewer';
import { toast } from 'sonner';
import Button from '../../components/Button'; // Adicionando importação do Button
import { List, Square } from 'lucide-react'; // Adicionando importação dos ícones
import DoacoesReviewStep from './components/DoacoesReviewStep';
import DoacoesListStep from './components/DoacoesListStep';
import DoacoesSummaryStep from './components/DoacoesSummaryStep';
import PaymentCard from './components/PaymentCard';

// Número do WhatsApp para envio do resumo
const WHATSAPP_NUMBER = '5511993288916';

// Função para gerar a mensagem do WhatsApp
const getWhatsappMessage = (payments: Payment[], decisions: Record<string, { status: 'approved' | 'not_approved', notes?: string }>) => {
  const aprovados = payments.filter(p => decisions[p.id]?.status === 'approved');
  const rejeitados = payments.filter(p => decisions[p.id]?.status === 'not_approved');
  let msg = `Resumo da conferência de doações:\n\n`;

  if (aprovados.length) {
    msg += `✅ APROVADOS:\n`;
    aprovados.forEach(p => {
      msg += `• Valor: R$ ${p.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Nome: ${p.payerName || '-'}\n`;
    });
    msg += '\n';
  }
  
  if (rejeitados.length) {
    msg += `❌ NÃO APROVADOS:\n`;
    rejeitados.forEach(p => {
      msg += `• Valor: R$ ${p.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Nome: ${p.payerName || '-'}\n  Motivo: ${decisions[p.id]?.notes || '-'}\n`;
    });
    msg += '\n';
  }
  
  msg += `Total aprovados: ${aprovados.length}\nTotal não aprovados: ${rejeitados.length}`;
  return encodeURIComponent(msg);
};

export default function Doacoes() {
  // Estado para controle da interface
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<{ [id: string]: { status: 'approved' | 'not_approved', notes?: string } }>({});
  const [observation, setObservation] = useState('');
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [viewMode, setViewMode] = useState<'modal' | 'list'>('modal');

  // Buscar pagamentos em análise
  const { data, isLoading } = useQuery(
    ['doacoes-under-review'],
    () => paymentRepository.getPayments({ status: PaymentStatus.UNDER_REVIEW, limit: 100 }),
    { refetchOnWindowFocus: false }
  );

  const payments: Payment[] = data?.data || [];

  // Funções de manipulação
  const handleDownload = (payment: Payment) => {
    if (!payment?.receipt) return;
    
    const fileName = `comprovante_${payment.payerName}_${payment.amount}-PagueBit.jpg`;
    const dataUrl = payment.receipt.startsWith('data:') ? payment.receipt : `data:image/jpeg;base64,${payment.receipt}`;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Comprovante baixado');
  };

  // Aprovar (apenas local)
  const handleApprove = (payment: Payment) => {
    if (!payment) return;
    setDecisions(prev => ({ ...prev, [payment.id]: { status: 'approved' } }));
    setObservation('');
    if (viewMode === 'modal') goNext();
  };

  // Rejeitar (apenas local)
  const handleReject = (payment: Payment, obs: string) => {
    if (!payment) return;
    if (!obs.trim()) {
      toast.error('Informe uma observação para rejeitar');
      return;
    }
    setDecisions(prev => ({ ...prev, [payment.id]: { status: 'not_approved', notes: obs } }));
    setObservation('');
    if (viewMode === 'modal') goNext();
  };

  // Navegação entre pagamentos
  const goNext = () => {
    if (currentIndex < payments.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setObservation('');
    } else {
      setShowSummary(true);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setObservation('');
    }
  };

  // Link do WhatsApp atualizado para usar a função
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${getWhatsappMessage(payments, decisions)}`;

  // Reiniciar revisão
  const resetReview = () => {
    setShowSummary(false);
    setCurrentIndex(0);
    setDecisions({});
    setObservation('');
  };

  // Renderização condicional baseada no estado
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Carregando pagamentos em revisão...</div>;
  }

  if (!payments.length) {
    return <div className="flex items-center justify-center h-64">Nenhum pagamento aguardando conferência bancária.</div>;
  }

  // Tela de resumo
  if (showSummary) {
    return (
      <DoacoesSummaryStep
        payments={payments}
        decisions={decisions}
        whatsappLink={whatsappLink}
        onReviewAgain={resetReview}
      />
    );
  }

  // Visualizador de imagem (comum para ambos os modos)
  const imageViewer = imageToView && (
    <ImageViewer
      src={imageToView}
      alt="Comprovante"
      isOpen={!!imageToView}
      onClose={() => setImageToView(null)}
    />
  );

  // Exibição em modo modal (um por vez)
  if (viewMode === 'modal') {
    const payment = payments[currentIndex];
    if (!payment) return null;
    const receiptSrc = payment.receipt?.startsWith('data:') ? payment.receipt : `data:image/jpeg;base64,${payment.receipt}`;
    return (
      <div className="max-w-5xl mx-auto mt-4 p-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Conferência Bancária de Doações</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Pagamento {currentIndex + 1} de {payments.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode('list')}
              leftIcon={<List className="h-4 w-4" />}
            >
              Lista
            </Button>
          </div>
        </div>
        
        <PaymentCard
          payment={payment}
          decision={decisions[payment.id]}
          onApprove={() => handleApprove(payment)}
          onReject={() => handleReject(payment, observation)}
          observation={observation}
          setObservation={setObservation}
          onShowImage={() => setImageToView(receiptSrc)}
          showActions={!decisions[payment.id]}
          onDownload={() => handleDownload(payment)}
        />
        
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
          >
            Anterior
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowSummary(true)}
          >
            Resumo
          </Button>
          
          <Button
            variant="primary"
            onClick={goNext}
            disabled={currentIndex === payments.length - 1}
          >
            Próximo
          </Button>
        </div>
        {imageViewer}
      </div>
    );
  }

  // Modo de visualização em lista
  return (
    <>
      <DoacoesListStep
        payments={payments}
        currentIndex={currentIndex}
        decisions={decisions}
        observation={observation}
        setObservation={setObservation}
        onApprove={handleApprove}
        onReject={handleReject}
        onShowImage={setImageToView}
        onDownload={handleDownload}
        onViewSummary={() => setShowSummary(true)}
        onSwitchToModal={() => setViewMode('modal')}
      />
      {imageViewer}
    </>
  );
}

import PaymentsTable from './PaymentsTable';
import PaymentsCard from './PaymentsCard';
import ViewToggle from '../../components/ViewToggle';
import ExcelExport from '../../components/ExcelExport';
import { PaymentRepository } from '../../data/repository/payment-repository';
import { Payment } from '../../domain/entities/Payment.entity';
 import { toast } from 'sonner';
import { format } from 'date-fns';
import { useState } from 'react';
import Button from '../../components/Button';
import { Download } from 'lucide-react';
import BatchReceiptDownloadModal from './Batchs/BatchReceiptDownloadModal';

export default function Payments() {
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const paymentRepository = new PaymentRepository();

  // Função para exportar todos os pagamentos
  const exportPayments = async () => {
    try {
      const response = await paymentRepository.listPayments({
        limit: '1000',
        orderBy: 'createdAt',
        order: 'desc'
      });
      // Retorna PaymentModel[], converter para Payment entity
      return (response.data || []).map((model: any) => Payment.fromModel(model));
    } catch (error) {
      console.error('Erro ao exportar pagamentos:', error);
      toast.error('Erro ao exportar relatório de pagamentos');
      throw error;
    }
  };

  // Função para transformar os dados de pagamentos para o formato Excel
  const transformPaymentData = (payments: Payment[]) => {
    return payments.map(payment => {
      // Tradução dos status para o relatório
      const statusTranslation: Record<string, string> = {
        'pending': 'Pendente',
        'receipt_sent': 'Comprovante Enviado',
        'review': 'Em Análise',
        'approved': 'Aprovado',
        'not_approved': 'Não Aprovado',
        'paid': 'Pago',
        'withdrawal_processing': 'Processamento de Saque',
        'completed': 'Concluído',
        'rejected': 'Rejeitado'
      };

      return {
        'ID': payment.id || '-',
        'ID da Loja': payment.storeId || '-',
        'Valor': payment.amount || 0,
        'Status': statusTranslation[payment.status] || payment.status || 'Não informado',
        'Tipo de Transação': payment.transactionType === 'static' ? 'QR Estático' : 'QR Dinâmico',
        'Data de Criação': payment.createdAt ? format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm:ss') : 'Não informado',
        'Última Atualização': payment.updatedAt ? format(new Date(payment.updatedAt), 'dd/MM/yyyy HH:mm:ss') : 'Não informado',
        'Observação': payment.observation || '-'
      };
    });
  };

  const columnWidths = {
    'ID': 38,
    'ID da Loja': 38,
    'Valor': 15,
    'Status': 20,
    'Tipo de Transação': 15,
    'Data de Criação': 20,
    'Última Atualização': 20,
    'Observação': 50,
  };

  const headerStyle = {
    backgroundColor: '4B5563',
    fontColor: 'FFFFFF',
    fontSize: 12,
    bold: true
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setIsBatchModalOpen(true)}
          >
            Download Comprovantes
          </Button>
          <ExcelExport
            onExport={exportPayments}
            filename="relatorio_pagamentos"
            sheetName="Pagamentos"
            buttonText="Exportar para Excel"
            transformData={transformPaymentData}
            columnWidths={columnWidths}
            headerStyle={headerStyle}
          />
        </div>
      </div>

      <ViewToggle
        storageKey="paymentsViewMode"
        tableView={<PaymentsTable />}
        cardView={<PaymentsCard />}
      />

      {isBatchModalOpen && (
        <BatchReceiptDownloadModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
        />
      )}
    </div>
  );
}
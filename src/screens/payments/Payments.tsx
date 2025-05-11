import PaymentsTable from './PaymentsTable';
import PaymentsCard from './PaymentsCard';
import ViewToggle from '../../components/ViewToggle';
import ExcelExport from '../../components/ExcelExport';
import paymentRepository from '../../repository/payment-repository';
import { Payment, PaymentStatus } from '../../models/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useState } from 'react';
import Button from '../../components/Button';
import { Download } from 'lucide-react';
import BatchReceiptDownloadModal from './BatchReceiptDownloadModal';

export default function Payments() {
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Função para exportar todos os pagamentos
  const exportPayments = async () => {
    try {
      // Buscar todos os pagamentos para exportação
      const response = await paymentRepository.getPayments({
        limit: 1000, // Limite alto para exportar o máximo possível
        orderBy: 'createdAt',
        order: 'desc'
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Erro ao exportar pagamentos:', error);
      toast.error('Erro ao exportar relatório de pagamentos');
      throw error;
    }
  };

  // Função para transformar os dados de pagamentos para o formato Excel
  const transformPaymentData = (payments: Payment[]) => {
    return payments.map(payment => {
      // Extrair informações do usuário
      const user = (payment as any).User;
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
      const userEmail = user?.email || payment.email || '';
      
      // Tradução dos status para o relatório
      const statusTranslation: Record<string, string> = {
        'pending': 'Pendente',
        'receipt_sent': 'Comprovante Enviado',
        'under_review': 'Em Análise',
        'approved': 'Aprovado',
        'not_approved': 'Não Aprovado',
        'paid': 'Pago',
        'withdrawal_processing': 'Processamento de Saque',
        'completed': 'Concluído',
        'rejected': 'Rejeitado'
      };

      // Formatar os dados para o Excel
      return {
        'ID': payment.id || '-',
        'Usuário': userName || 'Não informado',
        'Email': userEmail || 'Não informado',
        'Valor': payment.amount || 0,
        'Status': statusTranslation[payment.status] || payment.status || 'Não informado',
        'Tipo de Transação': payment.transactionType === 'static' ? 'QR Estático' : 'QR Dinâmico',
        'Modo de Recebimento': payment.receivingMode === 'now' ? 'Imediato' : 'Armazenado',
        'Data de Criação': payment.createdAt ? format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm:ss') : 'Não informado',
        'Última Atualização': payment.updatedAt ? format(new Date(payment.updatedAt), 'dd/MM/yyyy HH:mm:ss') : 'Não informado',
        'Observação': payment.observation || '-'
      };
    });
  };

  // Definir larguras de colunas personalizadas (em caracteres)
  const columnWidths = {
    'ID': 38,
    'Usuário': 30,
    'Email': 35,
    'Valor': 15,
    'Status': 20,
    'Tipo de Transação': 15,
    'Modo de Recebimento': 15,
    'Data de Criação': 20,
    'Última Atualização': 20,
    'Observação': 50,
  };

  // Definir estilo do cabeçalho
  const headerStyle = {
    backgroundColor: '4B5563', // Cinza escuro sem #
    fontColor: 'FFFFFF',       // Branco sem #
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
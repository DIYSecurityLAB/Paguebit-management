import React from 'react';
import { TrendingUp, PlusSquare, PiggyBank, AlertTriangle } from 'lucide-react';
import Card from '../../../../components/Card';
import { formatCurrency } from '../../../../utils/format';

interface UserFinancialSummaryProps {
  totalTransacted: number;
  totalPaid: number;
  totalPending: number;
  biggestTransaction: number;
}

export default function UserFinancialSummary({ 
  totalTransacted, 
  totalPaid, 
  totalPending, 
  biggestTransaction 
}: UserFinancialSummaryProps) {
  return (
    <div className="bg-card rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-md">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Movimentado</p>
              <h3 className="text-xl font-bold">{formatCurrency(totalTransacted)}</h3>
              <p className="text-xs text-muted-foreground">Valor total de todas as transações</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-md">
              <PlusSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pago</p>
              <h3 className="text-xl font-bold">{formatCurrency(totalPaid)}</h3>
              <p className="text-xs text-muted-foreground">Transações com status "pago"</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-md">
              <PiggyBank className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Retido</p>
              <h3 className="text-xl font-bold">{formatCurrency(totalPending)}</h3>
              <p className="text-xs text-muted-foreground">Transações em processamento</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-md">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maior Transação</p>
              <h3 className="text-xl font-bold">{formatCurrency(biggestTransaction)}</h3>
              <p className="text-xs text-muted-foreground">Valor da maior transação</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

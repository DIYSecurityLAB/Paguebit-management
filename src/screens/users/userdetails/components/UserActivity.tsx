import React from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Payment } from '../../../../models/types';

interface ActivityDataItem {
  date: string;
  count: number;
}

interface UserActivityProps {
  user: User;
  payments: Payment[];
  userActivityData: ActivityDataItem[];
}

export default function UserActivity({ user, payments, userActivityData }: UserActivityProps) {
  return (
    <div className="bg-card rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Atividade do Usuário</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md">
            <span className="text-sm text-muted-foreground">Cliente desde</span>
            <p className="text-lg font-semibold">
              {user.createdAt ? 
                format(new Date(user.createdAt), 'dd/MM/yyyy') : 
                'Não disponível'}
            </p>
          </div>
          <div className="p-4 border rounded-md">
            <span className="text-sm text-muted-foreground">Última transação</span>
            <p className="text-lg font-semibold">
              {payments.length > 0 && payments[0].createdAt ? 
                format(new Date(payments[0].createdAt), 'dd/MM/yyyy HH:mm') : 
                'Não disponível'}
            </p>
          </div>
          <div className="p-4 border rounded-md">
            <span className="text-sm text-muted-foreground">Total de transações</span>
            <p className="text-lg font-semibold">{payments.length}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-2">Frequência de transações</h3>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

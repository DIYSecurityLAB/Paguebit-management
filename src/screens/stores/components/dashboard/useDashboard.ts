import { useState, useEffect } from "react";
import { Payment } from "../../../../domain/entities/Payment.entity";
import { Withdrawal } from "../../../../domain/entities/Withdrawal.entity";
import { PaymentRepository } from "../../../../data/repository/payment-repository";
import { WithdrawalRepository } from "../../../../data/repository/withdrawal-repository";

export interface DashboardFilters {
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  limit?: string;
  [key: string]: any;
}

export function useDashboard(filters: DashboardFilters) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const paymentRepository = new PaymentRepository();
        const withdrawalRepository = new WithdrawalRepository();

        const paymentsResponse = await paymentRepository.listPayments({
          ...filters,
        });
        const withdrawalsResponse = await withdrawalRepository.listWithdrawals({
          ...filters,
        });

        const paymentEntities: Payment[] = [];
        for (const p of paymentsResponse.data) {
          try {
            if (typeof p.email !== "string") p.email = "";
            paymentEntities.push(Payment.fromModel(p));
          } catch {
            // Ignora pagamentos inválidos
          }
        }
        const withdrawalEntities = withdrawalsResponse.data.map(w => Withdrawal.fromModel(w));

        if (isMounted) {
          setPayments(paymentEntities);
          setWithdrawals(withdrawalEntities);
        }
      } catch (e) {
        if (isMounted) {
          setPayments([]);
          setWithdrawals([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [JSON.stringify(filters)]);

  return {
    payments,
    withdrawals,
    loading,
  };
}

import { useState } from 'react';
import { Plus } from 'lucide-react';
import CouponsTable from './CouponsTable';
import CouponsCard from './CouponsCard';
import ViewToggle from '../../components/ViewToggle';
import Button from '../../components/Button';
import CouponsModal from './CouponsModal';
import { Coupon } from '../../domain/entities/Coupon.entity';
import ExcelExport from '../../components/ExcelExport';
import { CouponRepository } from '../../data/repository/coupon-repository';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Coupons() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const couponRepository = new CouponRepository();

  // Função para exportar cupons para Excel
  const exportCoupons = async () => {
    try {
      const response = await couponRepository.listCoupons({
        limit: 1000,
        orderBy: 'createdAt',
        order: 'desc'
      });
      
      // Converter para entidades Coupon
      return (response.items || []).map((model) => Coupon.fromModel(model));
    } catch (error) {
      console.error('Erro ao exportar cupons:', error);
      toast.error('Erro ao exportar relatório de cupons');
      throw error;
    }
  };

  // Transformar dados para Excel
  const transformCouponData = (coupons: Coupon[]) => {
    return coupons.map(coupon => ({
      'ID': coupon.id || '-',
      'Código': coupon.code || '-',
      'Desconto (%)': coupon.discountPercentage || 0,
      'Ativo': coupon.isActive ? 'Sim' : 'Não',
      'Valor Mínimo': coupon.minPurchaseValue ? `R$ ${coupon.minPurchaseValue.toFixed(2)}` : 'Não definido',
      'Desconto Máximo': coupon.maxDiscountValue ? `R$ ${coupon.maxDiscountValue.toFixed(2)}` : 'Não definido',
      'Válido a partir de': coupon.validFrom ? format(new Date(coupon.validFrom), 'dd/MM/yyyy') : '-',
      'Válido até': coupon.validUntil ? format(new Date(coupon.validUntil), 'dd/MM/yyyy') : 'Sem expiração',
      'Data de Criação': coupon.createdAt ? format(new Date(coupon.createdAt), 'dd/MM/yyyy HH:mm') : '-',
    }));
  };

  const columnWidths = {
    'ID': 38,
    'Código': 20,
    'Desconto (%)': 15,
    'Ativo': 10,
    'Valor Mínimo': 15,
    'Desconto Máximo': 15,
    'Válido a partir de': 20,
    'Válido até': 20,
    'Data de Criação': 20,
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
        <h1 className="text-2xl font-bold text-foreground">Cupons</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Novo Cupom
          </Button>
          
          <ExcelExport
            onExport={exportCoupons}
            filename="relatorio_cupons"
            sheetName="Cupons"
            buttonText="Exportar para Excel"
            transformData={transformCouponData}
            columnWidths={columnWidths}
            headerStyle={headerStyle}
          />
        </div>
      </div>

      <ViewToggle
        storageKey="couponsViewMode"
        tableView={<CouponsTable />}
        cardView={<CouponsCard />}
      />

      {isCreateModalOpen && (
        <CouponsModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
 
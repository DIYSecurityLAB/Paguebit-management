import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, ChevronUp, ChevronDown, ArrowUpDown, Calendar, Tag, Edit, CheckCircle, XCircle } from 'lucide-react';
import CardItem from '../../components/CardItem';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import CouponsModal from './CouponsModal';
import Select from '../../components/Select';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import { Coupon } from '../../domain/entities/Coupon.entity';
import { CouponRepository } from '../../data/repository/coupon-repository';
import { toast } from 'sonner';

export default function CouponsCard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [filters, setFilters] = useState({
    code: '',
    isActive: '',
    validFrom: '',
    validUntil: '',
  });
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const queryClient = useQueryClient();
  const couponRepository = useMemo(() => new CouponRepository(), []);

  const { data, isLoading, error } = useQuery(
    ['coupons', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    async () => {
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const res = await couponRepository.listCoupons({
        page: currentPage,
        limit: itemsPerPage,
        ...cleanFilters,
        orderBy,
        order: orderDirection,
      });
      
      return res;
    },
    {
      keepPreviousData: true,
      onError: (err) => {
        console.error('Erro ao carregar cupons:', err);
        toast.error('Não foi possível carregar os cupons. Tente novamente.');
      },
      onSettled: () => {
        setIsFiltering(false);
      }
    }
  );

  useEffect(() => {
    if (!isLoading) setIsFiltering(false);
  }, [isLoading]);

  const filterOptions = useMemo(() => [
    {
      key: 'code',
      label: 'Código',
      type: 'text' as const,
      placeholder: 'Buscar por código',
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' },
      ],
    },
    {
      key: 'dateRange',
      label: 'Período de Validade',
      type: 'daterange' as const,
    },
  ], []);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setIsFiltering(true);
    const updatedFilters = {
      code: '',
      isActive: '',
      validFrom: '',
      validUntil: '',
    };
    if (newFilters.code) updatedFilters.code = newFilters.code;
    if (newFilters.isActive) updatedFilters.isActive = newFilters.isActive;
    if (newFilters.dateRangeFrom) updatedFilters.validFrom = newFilters.dateRangeFrom;
    if (newFilters.dateRangeTo) updatedFilters.validUntil = newFilters.dateRangeTo;
    setFilters(updatedFilters);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setOrderBy(field);
    setOrderDirection(direction);
    setCurrentPage(1);
  }, []);

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      await couponRepository.updateCoupon(couponToDelete.id, { isActive: !couponToDelete.isActive });
      queryClient.invalidateQueries('coupons');
      toast.success(
        couponToDelete.isActive
          ? 'Cupom desativado com sucesso'
          : 'Cupom ativado com sucesso'
      );
      setCouponToDelete(null);
    } catch (error) {
      console.error('Erro ao atualizar status do cupom:', error);
      toast.error('Erro ao atualizar status do cupom. Tente novamente.');
    }
  };

  const sortOptions = [
    { 
      value: 'createdAt-desc', 
      label: 'Mais recentes', 
      icon: <Calendar className="h-4 w-4 text-purple-500" /> 
    },
    { 
      value: 'createdAt-asc', 
      label: 'Mais antigos', 
      icon: <Calendar className="h-4 w-4 text-blue-500" /> 
    },
    { 
      value: 'code-asc', 
      label: 'Código (A-Z)', 
      icon: <Tag className="h-4 w-4 text-cyan-500" /> 
    },
    { 
      value: 'code-desc', 
      label: 'Código (Z-A)', 
      icon: <Tag className="h-4 w-4 text-orange-500" /> 
    },
    { 
      value: 'discountPercentage-desc', 
      label: 'Maior desconto', 
      icon: <Tag className="h-4 w-4 text-green-500" /> 
    },
    { 
      value: 'discountPercentage-asc', 
      label: 'Menor desconto', 
      icon: <Tag className="h-4 w-4 text-red-500" /> 
    },
  ];

  // Converter para entidades Coupon
  const coupons: Coupon[] = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((model) => Coupon.fromModel(model));
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="sm:hidden">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-md text-sm font-medium flex justify-between items-center"
          >
            <span>{filtersExpanded ? "Ocultar filtros" : "Exibir filtros"}</span>
            {filtersExpanded ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>
        </div>
        
        <div className={`${filtersExpanded ? 'block' : 'hidden'} sm:block w-full`}>
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
            isLoading={isFiltering && isLoading}
          />
        </div>
        
        <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm font-medium flex items-center whitespace-nowrap">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              Ordenar por:
            </label>
            <div className="w-full sm:w-64">
              <Select
                options={sortOptions}
                value={`${orderBy}-${orderDirection}`}
                onChange={(value) => {
                  const [field, direction] = value.split('-');
                  handleSortChange(field, direction as 'asc' | 'desc');
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading || isFiltering ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-48 bg-card rounded-lg"></div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-full text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-status-rejected">Erro ao carregar os cupons. Tente novamente.</p>
            <button 
              onClick={() => {
                setIsFiltering(true);
                queryClient.invalidateQueries(['coupons']);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : !coupons.length ? (
          <div className="col-span-full text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">Nenhum cupom encontrado</p>
            <button 
              onClick={() => {
                setIsFiltering(true);
                queryClient.invalidateQueries(['coupons']);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          coupons.map((coupon) => (
            <CardItem
              key={coupon.id}
              title={coupon.code}
              onClick={() => setSelectedCoupon(coupon)}
              badge={
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  coupon.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {coupon.isActive ? 'Ativo' : 'Inativo'}
                </span>
              }
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto:</span>
                  <span className="font-medium">{coupon.discountPercentage}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Mínimo:</span>
                  <span>
                    {coupon.minPurchaseValue 
                      ? `R$ ${coupon.minPurchaseValue.toFixed(2)}` 
                      : <span className="text-muted-foreground">Não definido</span>}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto Máximo:</span>
                  <span>
                    {coupon.maxDiscountValue 
                      ? `R$ ${coupon.maxDiscountValue.toFixed(2)}` 
                      : <span className="text-muted-foreground">Não definido</span>}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validade:</span>
                  <span className="text-right text-sm">
                    {format(new Date(coupon.validFrom), 'dd/MM/yyyy')}
                    {coupon.validUntil ? (
                      <> até {format(new Date(coupon.validUntil), 'dd/MM/yyyy')}</>
                    ) : (
                      <div className="text-xs text-muted-foreground">Sem data de expiração</div>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  leftIcon={<Eye className="h-4 w-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCoupon(coupon);
                  }}
                >
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  leftIcon={<Edit className="h-4 w-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCoupon(coupon);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex-1 ${
                    coupon.isActive
                      ? 'border-red-300 text-red-600 hover:bg-red-50'
                      : 'border-green-300 text-green-600 hover:bg-green-50'
                  }`}
                  leftIcon={
                    coupon.isActive
                      ? <XCircle className="h-4 w-4 text-red-500" />
                      : <CheckCircle className="h-4 w-4 text-green-500" />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setCouponToDelete(coupon);
                  }}
                >
                  {coupon.isActive ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </CardItem>
          ))
        )}
      </div>

      {data && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.total}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {selectedCoupon && (
        <CouponsModal
          coupon={selectedCoupon}
          isOpen={!!selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
        />
      )}

      {couponToDelete && (
        <DeleteConfirmModal
          isOpen={!!couponToDelete}
          onClose={() => setCouponToDelete(null)}
          onConfirm={handleDeleteCoupon}
          title={couponToDelete.isActive ? "Desativar Cupom" : "Ativar Cupom"}
          message={
            couponToDelete.isActive
              ? `Tem certeza que deseja desativar o cupom "${couponToDelete.code}"?`
              : `Tem certeza que deseja ativar o cupom "${couponToDelete.code}"?`
          }
        />
      )}
    </div>
  );
}

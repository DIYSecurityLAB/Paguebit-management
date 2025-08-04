import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Tag, Save, CheckCircle, Calendar, Percent, DollarSign, Clock, Info } from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Coupon } from '../../domain/entities/Coupon.entity';
import { CouponRepository } from '../../data/repository/coupon-repository';
import { toast } from 'sonner';

interface CouponsModalProps {
  coupon?: Coupon;
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  code: string;
  discountPercentage: string;
  validFrom: string;
  validUntil: string;
  minPurchaseValue: string;
  maxDiscountValue: string;
  isActive: boolean;
}

export default function CouponsModal({ coupon, isOpen, onClose }: CouponsModalProps) {
  const isEditing = !!coupon;
  const queryClient = useQueryClient();
  const couponRepository = new CouponRepository();
  
  const [formState, setFormState] = useState<FormState>({
    code: '',
    discountPercentage: '',
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    validUntil: '',
    minPurchaseValue: '',
    maxDiscountValue: '',
    isActive: true,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasNoExpiration, setHasNoExpiration] = useState(false);

  useEffect(() => {
    if (coupon) {
      setFormState({
        code: coupon.code,
        discountPercentage: coupon.discountPercentage.toString(),
        validFrom: format(new Date(coupon.validFrom), 'yyyy-MM-dd'),
        validUntil: coupon.validUntil ? format(new Date(coupon.validUntil), 'yyyy-MM-dd') : '',
        minPurchaseValue: coupon.minPurchaseValue?.toString() || '',
        maxDiscountValue: coupon.maxDiscountValue?.toString() || '',
        isActive: coupon.isActive,
      });
      setHasNoExpiration(!coupon.validUntil);
    }
  }, [coupon]);

  const createCouponMutation = useMutation(
    (data: any) => couponRepository.createCoupon(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coupons');
        toast.success('Cupom criado com sucesso!');
        onClose();
      },
      onError: (error) => {
        console.error('Erro ao criar cupom:', error);
        toast.error('Ocorreu um erro ao criar o cupom.');
      },
    }
  );

  const updateCouponMutation = useMutation(
    (data: { id: string; payload: any }) => 
      couponRepository.updateCoupon(data.id, data.payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('coupons');
        toast.success('Cupom atualizado com sucesso!');
        onClose();
      },
      onError: (error) => {
        console.error('Erro ao atualizar cupom:', error);
        toast.error('Ocorreu um erro ao atualizar o cupom.');
      },
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setFormState(prev => ({ ...prev, [name]: isChecked }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }

    // Limpar erro quando o usuário começa a digitar no campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formState.code.trim()) {
      errors.code = 'Código é obrigatório';
    }
    
    if (!formState.discountPercentage.trim()) {
      errors.discountPercentage = 'Percentual de desconto é obrigatório';
    } else {
      const discount = parseFloat(formState.discountPercentage);
      if (isNaN(discount) || discount <= 0 || discount > 100) {
        errors.discountPercentage = 'Percentual de desconto deve ser entre 0 e 100';
      }
    }
    
    if (!formState.validFrom.trim()) {
      errors.validFrom = 'Data de início é obrigatória';
    }
    
    if (!hasNoExpiration && !formState.validUntil.trim()) {
      errors.validUntil = 'Data de expiração é obrigatória ou marque "Sem expiração"';
    }
    
    if (formState.minPurchaseValue.trim() && isNaN(parseFloat(formState.minPurchaseValue))) {
      errors.minPurchaseValue = 'Valor mínimo deve ser um número';
    }
    
    if (formState.maxDiscountValue.trim() && isNaN(parseFloat(formState.maxDiscountValue))) {
      errors.maxDiscountValue = 'Valor máximo de desconto deve ser um número';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const payload = {
      code: formState.code,
      discountPercentage: parseFloat(formState.discountPercentage),
      validFrom: formState.validFrom,
      validUntil: hasNoExpiration ? null : formState.validUntil,
      minPurchaseValue: formState.minPurchaseValue ? parseFloat(formState.minPurchaseValue) : null,
      maxDiscountValue: formState.maxDiscountValue ? parseFloat(formState.maxDiscountValue) : null,
      isActive: formState.isActive,
    };
    
    if (isEditing && coupon) {
      updateCouponMutation.mutate({ 
        id: coupon.id, 
        payload: {
          code: formState.code,
          discountPercentage: parseFloat(formState.discountPercentage),
          validFrom: formState.validFrom,
          validUntil: hasNoExpiration ? null : formState.validUntil,
          minPurchaseValue: formState.minPurchaseValue ? parseFloat(formState.minPurchaseValue) : null,
          maxDiscountValue: formState.maxDiscountValue ? parseFloat(formState.maxDiscountValue) : null,
          isActive: formState.isActive,
        }
      });
    } else {
      createCouponMutation.mutate(payload);
    }
  };

  return (
    <Modal
      title={isEditing ? "Editar Cupom" : "Criar Novo Cupom"}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {isEditing ? 'Editando cupom de desconto' : 'Novo cupom de desconto'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEditing 
                  ? 'Atualize as informações do cupom abaixo. Todas as alterações serão aplicadas imediatamente.'
                  : 'Preencha as informações para criar um novo cupom de desconto para seus clientes.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Info className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-foreground">Informações Básicas</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Código do Cupom *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="code"
                    value={formState.code}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="ex: PROMO20"
                  />
                </div>
                {formErrors.code && <p className="text-red-500 text-sm">{formErrors.code}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Percentual de Desconto (%) *
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formState.discountPercentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="ex: 10"
                  />
                </div>
                {formErrors.discountPercentage && (
                  <p className="text-red-500 text-sm">{formErrors.discountPercentage}</p>
                )}
              </div>
            </div>
          </div>

          {/* Período de Validade */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Clock className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-foreground">Período de Validade</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Data de Início *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    name="validFrom"
                    value={formState.validFrom}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                {formErrors.validFrom && (
                  <p className="text-red-500 text-sm">{formErrors.validFrom}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Data de Expiração {!hasNoExpiration && '*'}
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      name="validUntil"
                      value={formState.validUntil}
                      onChange={handleInputChange}
                      disabled={hasNoExpiration}
                      className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  {/* Toggle Sem Expiração */}
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="no-expiration"
                        checked={hasNoExpiration}
                        onChange={(e) => setHasNoExpiration(e.target.checked)}
                        className="sr-only"
                      />
                      <label
                        htmlFor="no-expiration"
                        className={`flex items-center cursor-pointer select-none ${
                          hasNoExpiration ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        <div className={`relative w-11 h-6 rounded-full transition-colors ${
                          hasNoExpiration ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            hasNoExpiration ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </div>
                        <span className="ml-3 text-sm font-medium">Sem data de expiração</span>
                      </label>
                    </div>
                  </div>
                </div>
                {formErrors.validUntil && (
                  <p className="text-red-500 text-sm">{formErrors.validUntil}</p>
                )}
              </div>
            </div>
          </div>

          {/* Limites de Valor */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <DollarSign className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-foreground">Limites de Valor (Opcional)</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Valor Mínimo de Compra (R$)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    name="minPurchaseValue"
                    value={formState.minPurchaseValue}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="ex: 50.00"
                  />
                </div>
                {formErrors.minPurchaseValue && (
                  <p className="text-red-500 text-sm">{formErrors.minPurchaseValue}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Valor Máximo de Desconto (R$)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    name="maxDiscountValue"
                    value={formState.maxDiscountValue}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="ex: 100.00"
                  />
                </div>
                {formErrors.maxDiscountValue && (
                  <p className="text-red-500 text-sm">{formErrors.maxDiscountValue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status do Cupom */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <CheckCircle className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-foreground">Status do Cupom</h4>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formState.isActive}
                  onChange={(e) => setFormState(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only"
                />
                <label
                  htmlFor="isActive"
                  className={`flex items-center cursor-pointer select-none ${
                    formState.isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    formState.isActive ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      formState.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                  <span className="ml-3 text-sm font-medium">
                    Cupom {formState.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preview do Cupom */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
          <h3 className="font-semibold mb-4 flex items-center text-emerald-800 dark:text-emerald-200">
            <CheckCircle className="h-5 w-5 mr-2" />
            Preview do Cupom
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-black/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Código</span>
              </div>
              <p className="font-bold text-foreground text-lg">{formState.code || 'N/A'}</p>
            </div>
            
            <div className="bg-white dark:bg-black/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Desconto</span>
              </div>
              <p className="font-bold text-foreground text-lg">
                {formState.discountPercentage ? `${formState.discountPercentage}%` : 'N/A'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-black/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Status</span>
              </div>
              <p className={`font-bold text-lg ${
                formState.isActive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formState.isActive ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-black/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Validade</span>
              </div>
              <p className="font-bold text-foreground text-sm">
                {hasNoExpiration ? 'Sem expiração' : (formState.validUntil || 'N/A')}
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createCouponMutation.isLoading || updateCouponMutation.isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="h-4 w-4" />}
            isLoading={createCouponMutation.isLoading || updateCouponMutation.isLoading}
            className="px-6"
          >
            {isEditing ? 'Atualizar' : 'Criar'} Cupom
          </Button>
        </div>
      </form>
    </Modal>
  );
}

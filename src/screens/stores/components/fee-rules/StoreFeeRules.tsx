import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { StoreRepository } from '../../../../data/repository/store-repository';
import { FeeRuleModel, FeeType, CreateFeeRuleRequest } from '../../../../data/model/store.model';
import Button from '../../../../components/Button';
import Loading from '../../../../components/Loading';
import Table from '../../../../components/Table';
import { z } from 'zod';
import { toast } from 'sonner';
import Modal from '../../../../components/Modal';

interface StoreFeeRulesProps {
  storeId: string;
}

type FeeRuleFormState = {
  minAmount: string;
  maxAmount: string;
  feeType: FeeType;
  feeValue: string;
  spreadPercent: string;
};

const initialFormState: FeeRuleFormState = {
  minAmount: '',
  maxAmount: '',
  feeType: FeeType.PERCENT,
  feeValue: '',
  spreadPercent: '0.5',
};

const feeRuleSchema = z.object({
  minAmount: z.number().nonnegative("Valor mínimo não pode ser negativo"),
  maxAmount: z.number().nonnegative("Valor máximo não pode ser negativo"),
  feeType: z.nativeEnum(FeeType),
  feeValue: z.number().nonnegative("Valor da taxa não pode ser negativo"),
  spreadPercent: z.number().min(0.5, "Spread não pode ser menor que 0,5%").optional(),
}).refine(data => data.maxAmount > data.minAmount, {
  message: "Valor máximo deve ser maior que o valor mínimo",
  path: ["maxAmount"],
});

const StoreFeeRules: React.FC<StoreFeeRulesProps> = ({ storeId }) => {
  const [feeRules, setFeeRules] = useState<FeeRuleModel[]>([]);
  const [feeRulesLoading, setFeeRulesLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FeeRuleModel | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<FeeRuleModel | null>(null);
  const [formState, setFormState] = useState<FeeRuleFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FeeRuleFormState, string>>>({});

  const storeRepository = new StoreRepository();

  const loadFeeRules = async () => {
    try {
      setFeeRulesLoading(true);
      console.log('[StoreFeeRules] Buscando regras de taxas para storeId:', storeId);
      const response = await storeRepository.listStoreFeeRules(storeId);
      console.log('[StoreFeeRules] Resposta da API:', response);

      // Corrigir: a resposta é um array, não um objeto { success, data }
      // Se vier array direto, setar feeRules corretamente
      let rules: any[] = [];
      if (Array.isArray(response)) {
        rules = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        rules = response.data;
      } else if (response && Array.isArray(response.data)) {
        rules = response.data;
      } else {
        rules = [];
      }

      // Corrigir tipos: garantir que minAmount, maxAmount, feeValue, spreadPercent são números
      const normalizedRules = rules.map((rule) => ({
        ...rule,
        minAmount: typeof rule.minAmount === 'string' ? Number(rule.minAmount) : rule.minAmount,
        maxAmount: typeof rule.maxAmount === 'string' ? Number(rule.maxAmount) : rule.maxAmount,
        feeValue: typeof rule.feeValue === 'string' ? Number(rule.feeValue) : rule.feeValue,
        spreadPercent:
          rule.spreadPercent === undefined || rule.spreadPercent === null
            ? undefined
            : typeof rule.spreadPercent === 'string'
              ? Number(rule.spreadPercent)
              : rule.spreadPercent,
      }));

      const sortedRules = normalizedRules.sort((a, b) => a.minAmount - b.minAmount);
      console.log('[StoreFeeRules] Regras ordenadas (normalizadas):', sortedRules);
      setFeeRules(sortedRules);
    } catch (error) {
      console.error('[StoreFeeRules] Erro ao carregar regras de taxas:', error);
      toast.error('Erro ao carregar regras de taxas');
    } finally {
      setFeeRulesLoading(false);
    }
  };

  useEffect(() => {
    loadFeeRules();
    // eslint-disable-next-line
  }, [storeId]);

  useEffect(() => {
    if (editingRule) {
      setFormState({
        minAmount: editingRule.minAmount.toString(),
        maxAmount: editingRule.maxAmount === Number.MAX_SAFE_INTEGER ? '999999999' : editingRule.maxAmount.toString(),
        feeType: editingRule.feeType,
        feeValue: editingRule.feeValue.toString(),
        spreadPercent: editingRule.spreadPercent?.toString() || '0.5',
      });
    } else {
      setFormState(initialFormState);
    }
    setFormErrors({});
  }, [editingRule, isFormOpen]);

  const hasOverlappingRanges = (minAmount: number, maxAmount: number): boolean => {
    return feeRules
      .filter(rule => rule.id !== editingRule?.id)
      .some(existingRule => (
        (minAmount >= existingRule.minAmount && minAmount < existingRule.maxAmount) ||
        (maxAmount > existingRule.minAmount && maxAmount <= existingRule.maxAmount) ||
        (minAmount <= existingRule.minAmount && maxAmount >= existingRule.maxAmount)
      ));
  };

  const validateForm = (): boolean => {
    const minAmount = parseFloat(formState.minAmount);
    const maxAmount = parseFloat(formState.maxAmount);
    const feeValue = parseFloat(formState.feeValue);
    const spreadPercent = formState.spreadPercent ? parseFloat(formState.spreadPercent) : undefined;

    const result = feeRuleSchema.safeParse({
      minAmount,
      maxAmount,
      feeType: formState.feeType,
      feeValue,
      spreadPercent,
    });

    const errors: Partial<Record<keyof FeeRuleFormState, string>> = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FeeRuleFormState;
        errors[key] = issue.message;
      }
    }

    if (!errors.minAmount && !errors.maxAmount && hasOverlappingRanges(minAmount, maxAmount)) {
      errors.maxAmount = "Existe sobreposição com outra regra.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setIsFormOpen(true);
  };

  const handleEditRule = (rule: FeeRuleModel) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (rule: FeeRuleModel) => {
    setRuleToDelete(rule);
    setIsDeleteDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const minAmount = parseFloat(formState.minAmount);
    const maxAmount = parseFloat(formState.maxAmount);
    const feeValue = parseFloat(formState.feeValue);
    const spreadPercent = formState.spreadPercent ? parseFloat(formState.spreadPercent) : 0.5;

    try {
      const data: CreateFeeRuleRequest = {
        minAmount,
        maxAmount,
        feeType: formState.feeType,
        feeValue,
        spreadPercent,
      };
      if (editingRule) {
        await storeRepository.updateFeeRule(editingRule.id, data);
        toast.success('Regra de taxa atualizada com sucesso');
      } else {
        await storeRepository.createStoreFeeRule(storeId, data);
        toast.success('Regra de taxa criada com sucesso');
      }
      setIsFormOpen(false);
      loadFeeRules();
    } catch {
      toast.error('Erro ao salvar regra de taxa');
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleteDialogOpen(false);
    setRuleToDelete(null);
    // Função de exclusão ainda não implementada no repositório.
    // Para "excluir" uma regra, basta zerar os campos minAmount e maxAmount.
    toast.success('Função de exclusão em implementação. Para excluir, basta zerar os campos de valor mínimo e máximo.');
    loadFeeRules();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  const formatPercentage = (value: number) => `${Number(value).toFixed(2)}%`;

  if (feeRulesLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Regras de Taxas</h2>
        <Button onClick={handleAddRule} leftIcon={<PlusCircle size={16} />}>
          Adicionar Regra
        </Button>
      </div>
      {feeRulesLoading ? (
        <Loading />
      ) : feeRules.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-6 text-center">
          <p className="text-muted-foreground">Nenhuma regra de taxa configurada para esta loja.</p>
          <Button className="mt-4" onClick={handleAddRule} leftIcon={<PlusCircle size={16} />}>
            Adicionar primeira regra
          </Button>
        </div>
      ) : (
        <Table
          data={feeRules}
          columns={[
            {
              header: 'Valor Mínimo',
              accessor: (rule) => formatCurrency(rule.minAmount),
            },
            {
              header: 'Valor Máximo',
              accessor: (rule) =>
                rule.maxAmount === Number.MAX_SAFE_INTEGER
                  ? "∞"
                  : formatCurrency(rule.maxAmount),
            },
            {
              header: 'Tipo de Taxa',
              accessor: (rule) =>
                rule.feeType === FeeType.PERCENT ? 'Percentual' : 'Fixo',
            },
            {
              header: 'Valor da Taxa',
              accessor: (rule) =>
                rule.feeType === FeeType.PERCENT
                  ? formatPercentage(rule.feeValue)
                  : formatCurrency(rule.feeValue),
            },
            {
              header: 'Spread (%)',
              accessor: (rule) =>
                rule.spreadPercent ? formatPercentage(rule.spreadPercent) : '-',
            },
            {
              header: 'Ações',
              accessor: (rule) => (
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(rule)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ),
              // Adiciona alinhamento à direita se desejar:
              className: "text-right",
            },
          ]}
        />
      )}

      {/* Modal para adicionar/editar regra */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRule ? 'Editar Regra de Taxa' : 'Adicionar Regra de Taxa'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Header com ícone e descrição */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                {editingRule ? <Edit2 className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <PlusCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {editingRule ? 'Editar Regra de Taxa' : 'Nova Regra de Taxa'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {editingRule ? 'Modifique os parâmetros da regra de taxa existente' : 'Configure uma nova regra de taxa para esta loja'}
                </p>
              </div>
            </div>
          </div>

          <form id="fee-rule-form" onSubmit={handleFormSubmit} className="space-y-6">
            {/* Seção de Faixa de Valores */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-md font-medium text-foreground mb-4 flex items-center">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs text-green-600 dark:text-green-400">💰</span>
                </div>
                Faixa de Valores
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Valor Mínimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="minAmount"
                      value={formState.minAmount}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="0,00"
                    />
                  </div>
                  {formErrors.minAmount && (
                    <p className="text-xs text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {formErrors.minAmount}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Valor Máximo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="maxAmount"
                      placeholder="999999999 para infinito"
                      value={formState.maxAmount}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  {formErrors.maxAmount && (
                    <p className="text-xs text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {formErrors.maxAmount}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    💡 Use 999999999 para valor máximo ilimitado
                  </p>
                </div>
              </div>
            </div>

            {/* Seção de Configuração da Taxa */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-md font-medium text-foreground mb-4 flex items-center">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs text-purple-600 dark:text-purple-400">%</span>
                </div>
                Configuração da Taxa
              </h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Tipo de Taxa
                  </label>
                  <div className="relative">
                    <select
                      name="feeType"
                      value={formState.feeType}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 appearance-none"
                    >
                      <option value={FeeType.PERCENT}>📊 Percentual</option>
                      <option value={FeeType.FIXED}>💵 Valor Fixo</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {formErrors.feeType && (
                    <p className="text-xs text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {formErrors.feeType}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      {formState.feeType === FeeType.PERCENT ? 'Percentual da Taxa' : 'Valor Fixo da Taxa'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {formState.feeType === FeeType.PERCENT ? '%' : 'R$'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="feeValue"
                        value={formState.feeValue}
                        onChange={handleFormChange}
                        className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        placeholder={formState.feeType === FeeType.PERCENT ? "Ex: 3.99" : "Ex: 5.00"}
                      />
                    </div>
                    {formErrors.feeValue && (
                      <p className="text-xs text-red-500 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {formErrors.feeValue}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Spread (%)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.5"
                        name="spreadPercent"
                        value={formState.spreadPercent}
                        onChange={handleFormChange}
                        className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        placeholder="Ex: 2.5"
                      />
                    </div>
                    {formErrors.spreadPercent && (
                      <p className="text-xs text-red-500 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {formErrors.spreadPercent}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="mr-1">ℹ️</span>
                      O spread não pode ser menor que 0,5%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview da Regra */}
            {formState.minAmount && formState.maxAmount && formState.feeValue && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6">
                <h4 className="text-md font-medium text-foreground mb-3 flex items-center">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs text-green-600 dark:text-green-400">👁️</span>
                  </div>
                  Preview da Regra
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Faixa</p>
                    <p className="font-medium">
                      {formatCurrency(parseFloat(formState.minAmount) || 0)} - {
                        parseFloat(formState.maxAmount) >= 999999999 
                          ? "∞" 
                          : formatCurrency(parseFloat(formState.maxAmount) || 0)
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Taxa</p>
                    <p className="font-medium">
                      {formState.feeType === FeeType.PERCENT 
                        ? `${parseFloat(formState.feeValue) || 0}%`
                        : formatCurrency(parseFloat(formState.feeValue) || 0)
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Spread</p>
                    <p className="font-medium">{parseFloat(formState.spreadPercent) || 0}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {formState.feeType === FeeType.PERCENT ? 'Percentual' : 'Fixo'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Footer com botões */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="fee-rule-form"
              className="order-1 sm:order-2"
              leftIcon={editingRule ? <Edit2 className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            >
              {editingRule ? 'Atualizar' : 'Adicionar'} Regra
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação de exclusão melhorado */}
      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Confirmar Exclusão"
        size="md"
      >
        <div className="space-y-6">
          {/* Header de aviso */}
          <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-xl p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir Regra de Taxa</h3>
                <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>
          </div>

          {/* Detalhes da regra a ser excluída */}
          {ruleToDelete && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">Regra que será excluída:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Faixa:</span>
                  <p className="font-medium">
                    {formatCurrency(ruleToDelete.minAmount)} - {
                      ruleToDelete.maxAmount === Number.MAX_SAFE_INTEGER 
                        ? "∞" 
                        : formatCurrency(ruleToDelete.maxAmount)
                    }
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Taxa:</span>
                  <p className="font-medium">
                    {ruleToDelete.feeType === FeeType.PERCENT 
                      ? formatPercentage(ruleToDelete.feeValue)
                      : formatCurrency(ruleToDelete.feeValue)
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            ⚠️ Tem certeza que deseja excluir esta regra de taxa? Os saques futuros não utilizarão mais esta configuração.
          </p>

          {/* Footer com botões */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="order-1 sm:order-2"
            >
              Excluir Regra
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StoreFeeRules;


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
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" form="fee-rule-form">
              {editingRule ? 'Atualizar' : 'Adicionar'} Regra
            </Button>
          </div>
        }
      >
        <form id="fee-rule-form" onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Valor Mínimo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="minAmount"
                value={formState.minAmount}
                onChange={handleFormChange}
                className="input input-bordered w-full bg-background text-foreground"
              />
              {formErrors.minAmount && <span className="text-xs text-red-500">{formErrors.minAmount}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Valor Máximo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="maxAmount"
                placeholder="Deixe 999999999 para infinito"
                value={formState.maxAmount}
                onChange={handleFormChange}
                className="input input-bordered w-full bg-background text-foreground"
              />
              {formErrors.maxAmount && <span className="text-xs text-red-500">{formErrors.maxAmount}</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Tipo de Taxa</label>
            <select
              name="feeType"
              value={formState.feeType}
              onChange={handleFormChange}
              className="input input-bordered w-full bg-background text-foreground"
            >
              <option value={FeeType.PERCENT}>Percentual</option>
              <option value={FeeType.FIXED}>Fixo</option>
            </select>
            {formErrors.feeType && <span className="text-xs text-red-500">{formErrors.feeType}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              {formState.feeType === FeeType.PERCENT
                ? 'Valor da Taxa (%)'
                : 'Valor Fixo (R$)'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="feeValue"
              value={formState.feeValue}
              onChange={handleFormChange}
              className="input input-bordered w-full bg-background text-foreground"
            />
            {formErrors.feeValue && <span className="text-xs text-red-500">{formErrors.feeValue}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Spread (%)</label>
            <input
              type="number"
              step="0.01"
              min="0.5"
              name="spreadPercent"
              value={formState.spreadPercent}
              onChange={handleFormChange}
              className="input input-bordered w-full bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O spread não pode ser menor que 0,5%
            </p>
            {formErrors.spreadPercent && <span className="text-xs text-red-500">{formErrors.spreadPercent}</span>}
          </div>
        </form>
      </Modal>
      {/* Dialog de confirmação para excluir */}
      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Confirmar exclusão"
        size="sm"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Excluir
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Tem certeza que deseja excluir esta regra de taxa? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
};

export default StoreFeeRules;


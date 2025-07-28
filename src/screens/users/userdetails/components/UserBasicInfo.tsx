import React, { useState } from 'react';
import { format } from 'date-fns';
import { Edit, Save, X } from 'lucide-react';
import { User } from '../../../../domain/entities/User.entity';
import { UpdateUser } from '../../../../domain/entities/User.entity';
import Button from '../../../../components/Button';
import { toast } from 'sonner';
import { UserRepository } from '../../../../data/repository/user-repository';
import ConfirmationModal from '../../../../components/ConfirmationModal';

interface UserBasicInfoProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export default function UserBasicInfo({ user, onUserUpdate }: UserBasicInfoProps) {
  const [isEditingReferral, setIsEditingReferral] = useState(false);
  const [referralValue, setReferralValue] = useState(user.referral || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(user.phoneNumber || '');
  const [isActiveValue, setIsActiveValue] = useState(user.active);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para controle dos modais
  const [showReferralConfirmation, setShowReferralConfirmation] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [showPhoneConfirmation, setShowPhoneConfirmation] = useState(false);
  const [pendingActiveValue, setPendingActiveValue] = useState(user.active);

  const userRepository = new UserRepository();

  // Função para iniciar processo de salvamento do referral (mostra o modal)
  const handleSaveReferral = () => setShowReferralConfirmation(true);

  // Função para salvar alterações de referral após confirmação
  const handleSaveReferralConfirmed = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const update: Partial<UpdateUser> = { referral: referralValue };
      const updatedUserModel = await userRepository.updateUser(user.id, update);
      const updatedUser = User.fromModel(updatedUserModel);
      onUserUpdate(updatedUser);
      setIsEditingReferral(false);
      setShowReferralConfirmation(false);
      toast.success('Indicação atualizada com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar indicação');
      console.error('Erro ao atualizar referral:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Função para cancelar edição de referral
  const handleCancelReferral = () => {
    setReferralValue(user?.referral || '');
    setIsEditingReferral(false);
  };

  // Função para iniciar processo de alteração de status (mostra o modal)
  const handleToggleActiveInit = () => {
    setPendingActiveValue(!isActiveValue);
    setShowStatusConfirmation(true);
  };

  // Função para alternar status ativo/inativo após confirmação
  const handleToggleActiveConfirmed = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const update: Partial<UpdateUser> = { active: pendingActiveValue ? 'true' : 'false' };
      const updatedUserModel = await userRepository.updateUser(user.id, update);
      const updatedUser = User.fromModel(updatedUserModel);
      onUserUpdate(updatedUser);
      setIsActiveValue(pendingActiveValue);
      setShowStatusConfirmation(false);
      toast.success(`Usuário ${pendingActiveValue ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (err) {
      toast.error(`Erro ao ${isActiveValue ? 'desativar' : 'ativar'} usuário`);
      console.error('Erro ao atualizar status ativo:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Função para iniciar edição do telefone
  const handleEditPhone = () => setIsEditingPhone(true);

  // Função para cancelar edição do telefone
  const handleCancelPhone = () => {
    setPhoneValue(user.phoneNumber || '');
    setIsEditingPhone(false);
  };

  // Função para salvar telefone (mostra modal)
  const handleSavePhone = () => setShowPhoneConfirmation(true);

  // Função para confirmar alteração do telefone
  const handleSavePhoneConfirmed = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const update: Partial<UpdateUser> = { phoneNumber: phoneValue };
      const updatedUserModel = await userRepository.updateUser(user.id, update);
      const updatedUser = User.fromModel(updatedUserModel);
      onUserUpdate(updatedUser);
      setIsEditingPhone(false);
      setShowPhoneConfirmation(false);
      toast.success('Telefone atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar telefone');
      console.error('Erro ao atualizar telefone:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
      <div className="space-y-4">
        {/* Foto do usuário */}
        {user.pictureUrl && (
          <div>
            <label className="text-sm text-muted-foreground">Foto</label>
            <div className="mt-1">
              <img
                src={user.pictureUrl}
                alt="Foto do usuário"
                className="w-24 h-24 rounded-full object-cover border"
              />
            </div>
          </div>
        )}
        <div>
          <label className="text-sm text-muted-foreground">Nome</label>
          <p className="text-foreground">{`${user.firstName} ${user.lastName}`}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <p className="text-foreground">{user.email}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Documento</label>
          <p className="text-foreground">{`${user.documentType}: ${user.documentId}`}</p>
        </div>
        {/* Telefone editável */}
        <div>
          <label className="text-sm text-muted-foreground">Telefone</label>
          {isEditingPhone ? (
            <div className="flex items-center mt-1 space-x-2">
              <input
                type="text"
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Telefone"
                disabled={isSaving}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSavePhone}
                disabled={isSaving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelPhone}
                disabled={isSaving}
                leftIcon={<X className="h-4 w-4" />}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center">
              <p className="text-foreground mr-2">
                {user.phoneNumber || <span className="text-muted-foreground">Não informado</span>}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEditPhone}
                className="h-8 px-2"
                leftIcon={<Edit className="h-4 w-4" />}
              >
                Editar
              </Button>
            </div>
          )}
        </div>
        {/* Indicação editável */}
        <div>
          <label className="text-sm text-muted-foreground">Indicação</label>
          {isEditingReferral ? (
            <div className="flex items-center mt-1 space-x-2">
              <input
                type="text"
                value={referralValue}
                onChange={(e) => setReferralValue(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Código de indicação"
                disabled={isSaving}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveReferral}
                disabled={isSaving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelReferral}
                disabled={isSaving}
                leftIcon={<X className="h-4 w-4" />}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center">
              <p className="text-foreground mr-2">
                {user.referral || <span className="text-muted-foreground">Não informado</span>}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingReferral(true)}
                className="h-8 px-2"
                leftIcon={<Edit className="h-4 w-4" />}
              >
                Editar
              </Button>
            </div>
          )}
        </div>
        {/* Status Ativo/Inativo */}
        <div>
          <label className="text-sm text-muted-foreground">Status</label>
          <div className="flex items-center mt-1">
            <div 
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActiveValue ? 'bg-green-500' : 'bg-gray-300'
              } cursor-pointer`}
              onClick={handleToggleActiveInit}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActiveValue ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="ml-2 text-sm font-medium">
              {isActiveValue ? 'Ativo' : 'Inativo'}
            </span>
            {isSaving && <span className="ml-2 text-xs text-muted-foreground">Salvando...</span>}
          </div>
        </div>
        {/* Data de criação */}
        <div>
          <label className="text-sm text-muted-foreground">Criado em</label>
          <p className="text-foreground">
            {user.createdAt
              ? format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm')
              : <span className="text-muted-foreground">Não informado</span>
            }
          </p>
        </div>
        {/* Role */}
        <div>
          <label className="text-sm text-muted-foreground">Tipo de Usuário</label>
          <p className="text-foreground">{user.role}</p>
        </div>
      </div>

      {/* Modal de confirmação para alteração de indicação */}
      <ConfirmationModal
        isOpen={showReferralConfirmation}
        onClose={() => setShowReferralConfirmation(false)}
        onConfirm={handleSaveReferralConfirmed}
        title="Confirmar alteração de indicação"
        message={`Você está prestes a alterar o código de indicação para "${referralValue}". Deseja continuar?`}
        confirmButtonText="Salvar alteração"
        isLoading={isSaving}
      />

      {/* Modal de confirmação para alteração de status */}
      <ConfirmationModal
        isOpen={showStatusConfirmation}
        onClose={() => setShowStatusConfirmation(false)}
        onConfirm={handleToggleActiveConfirmed}
        title={`Confirmar ${pendingActiveValue ? 'ativação' : 'desativação'} de usuário`}
        message={`Você está prestes a ${pendingActiveValue ? 'ativar' : 'desativar'} este usuário. ${
          !pendingActiveValue ? 'Usuários inativos não podem realizar operações na plataforma.' : ''
        } Deseja continuar?`}
        confirmButtonText={pendingActiveValue ? 'Ativar usuário' : 'Desativar usuário'}
        isLoading={isSaving}
      />

      {/* Modal de confirmação para alteração de telefone */}
      <ConfirmationModal
        isOpen={showPhoneConfirmation}
        onClose={() => setShowPhoneConfirmation(false)}
        onConfirm={handleSavePhoneConfirmed}
        title="Confirmar alteração de telefone"
        message={`Você está prestes a alterar o telefone para "${phoneValue}". Deseja continuar?`}
        confirmButtonText="Salvar telefone"
        isLoading={isSaving}
      />
    </div>
  );
}
 

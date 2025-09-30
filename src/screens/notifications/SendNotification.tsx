import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "react-query";
import { 
  ArrowLeft, 
  Bell, 
  Store as StoreIcon, 
  AlignLeft,
  Search,
  X,
  Send,
  Loader,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/Button";
import notificationRepository from "../../data/repository/notification-repository";
import { StoreRepository } from "../../data/repository/store-repository";
import { StoreModel } from "../../data/model/store.model";
import { CreateNotificationReq } from "../../data/model/notification.model";

 

export default function SendNotification() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchField, setSearchField] = useState<'name' | 'id' | 'ownerId' | 'ownerEmail'>('name');

  // Busca de lojas - com debounce
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        setDebouncedSearchQuery(searchQuery);
      } else {
        setDebouncedSearchQuery("");
      }
    }, 300); // 300ms de delay para evitar muitas requisições
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Consulta para buscar lojas usando o novo StoreRepository
  const { data: storesData, isLoading: searchLoading } = useQuery(
    ['stores', debouncedSearchQuery, searchField],
    () => {
      const query = debouncedSearchQuery.trim();
      // Monta o objeto de busca apenas com o campo selecionado
      const params: any = { limit: String(5) };
      if (query) params[searchField] = query;
      return new StoreRepository().listStores(params);
    },
    {
      enabled: debouncedSearchQuery.length >= 2,
      staleTime: 30000,
      keepPreviousData: true,
    }
  );

  // Extrair os resultados da busca do formato paginado
  const searchResults = Array.isArray(storesData?.data) ? storesData.data : [];

  // Mutation para enviar notificação
  const createNotificationMutation = useMutation(
    () => {
      if (!selectedStore) throw new Error("Loja não selecionada");
      const data: CreateNotificationReq = {
        title,
        content,
        type: "info",
      };
      return notificationRepository.createNotification(selectedStore.id, data);
    },
    {
      onSuccess: () => {
        setShowSuccess(true);
        setTitle("");
        setContent("");
        setSelectedStore(null);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      },
      onError: (error: any) => {
        console.error("Erro ao enviar notificação:", error);
        toast.error(`Erro ao enviar notificação: ${error?.message || "Tente novamente"}`);
      },
    }
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Limpar a loja selecionada quando a pesquisa muda
    if (selectedStore) {
      setSelectedStore(null);
    }
  };

  // Função com tipagem corrigida
  const handleStoreSelect = (store: StoreModel) => {
    setSelectedStore(store);
    setSearchQuery(""); // Limpar a busca após seleção
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("O título da notificação é obrigatório");
      return;
    }
    
    if (!content.trim()) {
      toast.error("O conteúdo da notificação é obrigatório");
      return;
    }
    
    if (!selectedStore) {
      toast.error("Selecione uma loja para enviar a notificação");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createNotificationMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alterando o UserIcon para evitar conflito de nomes
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/notifications")}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enviar Notificação</h1>
          <p className="text-muted-foreground">Envie notificações para uma loja específica.</p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de notificação */}
        <div className="lg:col-span-2">
          <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de busca de loja */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-card-foreground mb-2">
                  Selecionar Loja
                </label>
                <div className="relative">
                  {selectedStore ? (
                    <div className="flex items-center justify-between p-3 border-2 border-primary rounded-lg bg-primary/5 dark:bg-primary/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-medium">
                          {selectedStore.name?.[0]?.toUpperCase() || "L"}
                        </div>
                        <div>
                          <p className="font-medium">{selectedStore.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedStore.id}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSelectedStore(null)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
                          <input
                            type="text"
                            placeholder={
                              searchField === 'name'
                                ? "Buscar por nome da loja..."
                                : searchField === 'id'
                                ? "Buscar por ID da loja..."
                                : searchField === 'ownerId'
                                ? "Buscar por ID do dono..."
                                : "Buscar por email do dono..."
                            }
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-lg focus:ring-primary focus:border-primary bg-background dark:bg-card text-foreground dark:text-card-foreground"
                          />
                        </div>
                        <select
                          value={searchField}
                          onChange={e => setSearchField(e.target.value as any)}
                          className="py-3 px-2 border-2 border-border rounded-lg bg-background dark:bg-card text-foreground dark:text-card-foreground min-w-[120px]"
                        >
                          <option value="name">Nome da Loja</option>
                          <option value="id">ID da Loja</option>
                          <option value="ownerId">ID do Dono</option>
                          <option value="ownerEmail">Email do Dono</option>
                        </select>
                      </div>
                      
                      {/* Resultado da busca com novo estilo */}
                      {debouncedSearchQuery.length >= 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchLoading ? (
                            <div className="p-4 text-center">
                              <Loader className="animate-spin h-5 w-5 text-primary mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Buscando lojas...</p>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="divide-y divide-border">
                              {searchResults.map((store: StoreModel) => (
                                <button
                                  key={store.id}
                                  type="button"
                                  className="w-full px-4 py-3 hover:bg-muted text-left flex items-center gap-3"
                                  onClick={() => handleStoreSelect(store)}
                                >
                                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                                    {typeof store.name === "string" && store.name.length > 0
                                      ? store.name[0].toUpperCase()
                                      : "L"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {typeof store.name === "string" && store.name.length > 0
                                        ? store.name
                                        : store.id}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{store.id}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Nenhuma loja encontrada com este nome</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Título da notificação */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground dark:text-card-foreground mb-2">
                  Título da Notificação <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Bell className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                  </div>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite o título da notificação"
                    className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-lg focus:ring-primary focus:border-primary bg-background dark:bg-card text-foreground dark:text-card-foreground"
                    required
                  />
                </div>
              </div>

              {/* Conteúdo da notificação */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-foreground dark:text-card-foreground mb-2">
                  Conteúdo da Notificação <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-4 pointer-events-none">
                    <AlignLeft className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                  </div>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Digite o conteúdo da notificação"
                    rows={5}
                    className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-lg focus:ring-primary focus:border-primary bg-background dark:bg-card text-foreground dark:text-card-foreground"
                    required
                  ></textarea>
                </div>
              </div>

              {/* Botão de envio */}
              <Button
                type="submit"
                className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
                leftIcon={isSubmitting ? <Loader className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
              >
                {isSubmitting 
                  ? "Enviando..."
                  : "Enviar Notificação"
                }
              </Button>
            </form>
          </div>
        </div>

        {/* Painel lateral */}
        <div>
          {/* Dicas */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Dicas de Uso</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="p-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm text-muted-foreground">
                  Notificações <strong>gerais</strong> são enviadas para todos os usuários e podem ser usadas para anúncios importantes.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="p-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm text-muted-foreground">
                  Notificações <strong>específicas</strong> são enviadas para um único usuário, ideal para comunicações personalizadas.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="p-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm text-muted-foreground">
                  Use títulos claros e concisos para melhorar a taxa de leitura das notificações.
                </p>
              </li>
            </ul>
          </div>

          {/* Modelo rápido de notificação */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Modelos Rápidos</h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setTitle("Atualização do Sistema");
                  setContent("Informamos que o sistema passará por uma manutenção programada no próximo domingo. O serviço estará indisponível das 02h às 04h da manhã.");
                }}
                className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <p className="font-medium text-foreground">Manutenção do Sistema</p>
                <p className="text-xs text-muted-foreground mt-1">Notificação sobre manutenção programada</p>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setTitle("Novo Recurso Disponível");
                  setContent("Temos o prazer de informar que um novo recurso foi adicionado à plataforma. Agora você pode realizar operações de forma mais eficiente através das novas ferramentas disponíveis.");
                }}
                className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <p className="font-medium text-foreground">Novidade</p>
                <p className="text-xs text-muted-foreground mt-1">Anúncio de novo recurso</p>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setTitle("Confirmação de Processamento");
                  setContent("Seu processo foi concluído com sucesso. Você pode visualizar os detalhes acessando a seção de histórico em seu painel.");
                }}
                className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <p className="font-medium text-foreground">Confirmação</p>
                <p className="text-xs text-muted-foreground mt-1">Confirmação de processamento</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de sucesso */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card rounded-2xl p-7 max-w-md w-full border-t-4 border-green-500 shadow-xl transform animate-slideUpEnter">
            <div className="flex items-center justify-center mb-4 text-green-500">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-3 text-center">
              Notificação Enviada!
            </h3>
            <p className="text-foreground mb-6 text-center">
              A notificação foi enviada com sucesso para {selectedStore?.name || 'a loja'}.
            </p>
            <Button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

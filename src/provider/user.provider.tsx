import { AuthUser } from "../domain/entities/auth.entity";
import { User } from "../domain/entities/User.entity";
import { AuthRepository } from "../data/repository/auth-repository";
import { UserRepository } from "../data/repository/user-repository";
import { UserContext } from "../context/user.context";
import { ReactNode, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { mapAuthUserToUser } from "../utils/authusertouserMapping";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = (user: User) => {
    localStorage.setItem("USER", JSON.stringify(user));
  };

  // Função clara de logout
  const logout = useCallback(() => {
    // Remova apenas tokens do backend
    localStorage.removeItem("USER");
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");
    localStorage.removeItem("TOKEN_EXPIRES_AT");
    setUser(null);
    // window.location.href = "/login";
  }, []);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const authRepo = new AuthRepository();
      const accessToken = localStorage.getItem("ACCESS_TOKEN");
      if (!accessToken) throw new Error("Access token não encontrado.");

      const authRes = await authRepo.getMe();
      if (!authRes?.user) return logout();

      const authUser = AuthUser.fromModel(authRes.user);
      const userEntity = mapAuthUserToUser(authUser);
      setUser(userEntity);
      persistUser(userEntity);
    } catch {
      toast.error("Erro ao buscar usuário autenticado.");
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem("REFRESH_TOKEN");
      if (!refreshTokenValue) throw new Error("Refresh token não encontrado.");
      const authRepo = new AuthRepository();

      // Log para debug
      console.log("[UserProvider] Chamando refreshToken do AuthRepository");

      // Passa explicitamente o refreshTokenValue para o método
      const res = await authRepo.refreshToken(refreshTokenValue);

      // Log para debug
      console.log("[UserProvider] Resposta do refreshToken:", res);

      localStorage.setItem("ACCESS_TOKEN", res.accessToken);
      localStorage.setItem("REFRESH_TOKEN", res.refreshToken);
      localStorage.setItem("TOKEN_EXPIRES_AT", res.tokenExpiresAt);

      if (res.user) {
        const authUser = AuthUser.fromModel(res.user);
        const userEntity = mapAuthUserToUser(authUser);
        setUser(userEntity);
        persistUser(userEntity);
      }
    } catch (err) {
      // Log seguro, sem headers
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[UserProvider] Erro ao renovar sessão:", msg);
      toast.error("Erro ao renovar sessão. Faça login novamente.");
      logout();
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("ACCESS_TOKEN");
    if (accessToken) fetchUser();
    else setIsLoading(false);
  }, [fetchUser]);

  const readUser = async (userId: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userRepo = new UserRepository();
      const userModel = await userRepo.read({ id: userId });
      const userEntity = User.fromModel(userModel);
      setUser(userEntity);
      persistUser(userEntity);
      return userEntity;
    } catch {
      toast.error("Erro ao buscar dados do usuário");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedFields: Parameters<UserRepository["update"]>[0]): Promise<void> => {
    setIsLoading(true);
    try {
      const userRepo = new UserRepository();
      const userModel = await userRepo.update(updatedFields);
      const userEntity = User.fromModel(userModel);
      setUser(userEntity);
      persistUser(userEntity);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar perfil: " + (error instanceof Error ? error.message : "Tente novamente"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        readUser,
        updateUser,
        isLoading,
        refreshToken,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
import { UpdateUser, User as UserEntity } from "../domain/entities/User.entity";
import { createContext, useContext } from "react";

export type UserContextProps = {
  user: UserEntity | null;
  setUser: (user: UserEntity | null) => void;
  readUser: (userId: string) => Promise<UserEntity | null>;
  updateUser: (updatedFields: UpdateUser) => Promise<void>;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
  logout: () => void;
};

export const UserContext = createContext<UserContextProps | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext deve ser utilizado dentro do UserProvider");
  }
  return context;
};
 
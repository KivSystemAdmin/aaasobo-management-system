import { createContext } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({ isAuthenticated: false });

export { AuthContext };

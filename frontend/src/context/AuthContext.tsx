import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { User } from "../types";
import { useAppDispatch, useAppSelector } from "../store/store";
import { getCurrentUser, logoutUser } from "../store/slices/authSlice";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { user, loading, token } = useAppSelector((state) => state.auth);

  // Check for existing token on mount and fetch user data
  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, user]);

  const logout = () => {
    dispatch(logoutUser());
    window.location.href = "/";
  };

  const refreshUser = async () => {
    await dispatch(getCurrentUser());
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

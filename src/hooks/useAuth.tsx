import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider component.
 *
 * @throws Error if used outside of AuthProvider
 * @returns Authentication context with user and loading state
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
      "Wrap your component tree with <AuthProvider> to use this hook."
    );
  }

  return { user: context.user, isLoading: context.isLoading };
};

import { createContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          const isMissingSession =
            error.status === 400 && error.message.includes("Auth session missing");

          if (isMissingSession) {
            logger.debug("No active auth session found");
          } else {
            logger.warn("Failed to get authenticated user", {
              error: error.message,
              code: error.status,
            });
          }
          setUser(null);
        } else {
          setUser(data.user || null);
        }
      } catch (error) {
        // Handle unexpected errors (network issues, etc.)
        logger.error("Unexpected error during user authentication check", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        setUser(null);
      } finally {
        // Always set loading to false, even on error
        setIsLoading(false);
      }
    };

    getUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
};

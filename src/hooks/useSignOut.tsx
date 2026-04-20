import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatErrorMessage } from "@/lib/errorUtils";
import { logger } from "@/lib/logger";
import { queryClient } from "@/lib/queryClient";

export const useSignOut = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error("Failed to sign out user", {
          error: error.message,
          userId: user.id,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      toast.error("Couldn't sign out", {
        description: formatErrorMessage(error),
      });
    },
  });
};

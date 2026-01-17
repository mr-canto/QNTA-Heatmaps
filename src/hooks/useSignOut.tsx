import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useMutation } from "@tanstack/react-query";

export const useSignOut = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      navigate("/login", { replace: true });
    },
  });
};

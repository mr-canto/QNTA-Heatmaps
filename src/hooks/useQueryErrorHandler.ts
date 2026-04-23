import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatErrorMessage, isAuthError } from "@/lib/errorUtils";
import { useNavigate } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";

interface UseQueryErrorHandlerOptions {
  error: Error | null;
  isError: boolean;
  refetch?: () => void;
  context?: string;
}

/**
 * Hook that shows toast notifications for query errors with retry functionality.
 * Automatically redirects to login on authentication errors.
 */
export function useQueryErrorHandler({
  error,
  isError,
  refetch,
  context = "data",
}: UseQueryErrorHandlerOptions) {
  const navigate = useNavigate();
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (isError && error) {
      // Check for auth errors and redirect to login
      if (isAuthError(error)) {
        queryClient.clear();
        toast.error("Session expired", {
          description: "Please sign in again to continue.",
        });
        navigate("/login");
        return;
      }

      // Dismiss any existing toast for this context to avoid duplicates
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      const message = formatErrorMessage(error);

      // Show toast with or without retry button
      if (refetch) {
        toastIdRef.current = toast.error(`Failed to load ${context}`, {
          description: message,
          action: {
            label: "Retry",
            onClick: () => refetch(),
          },
          duration: 10000, // Keep error visible longer
        });
      } else {
        toastIdRef.current = toast.error(`Failed to load ${context}`, {
          description: message,
          duration: 6000,
        });
      }
    }

    // Cleanup toast on unmount or when error is resolved
    return () => {
      if (toastIdRef.current && !isError) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [isError, error, refetch, context, navigate]);
}

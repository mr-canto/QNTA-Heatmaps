import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="border-primary mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/" replace />;
};

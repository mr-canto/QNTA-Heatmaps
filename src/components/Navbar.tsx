import { useAuth } from "@/hooks/useAuth";
import { useSignOut } from "@/hooks/useSignOut";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const { user } = useAuth();
  const signOutMutation = useSignOut();

  const handleSignOut = () => {
    signOutMutation.mutate();
  };

  return (
    <nav className="border-border bg-background flex items-center justify-between border-b px-6 py-4">
      <div className="text-lg font-bold">My App</div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        {user?.email && <span className="text-muted-foreground text-sm">{user.email}</span>}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={signOutMutation.isPending}
        >
          {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </nav>
  );
}

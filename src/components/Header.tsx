import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSignOut } from "@/hooks/useSignOut";
import { UserAvatar } from "@/components/UserAvatar";
import { useHeaderExtras } from "@/context/HeaderExtrasContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/heatmap", label: "Heatmap" },
  { path: "/import", label: "Import" },
];

export function Header() {
  const { user } = useAuth();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const location = useLocation();
  const { extras } = useHeaderExtras();
  const headerRef = useRef<HTMLElement | null>(null);

  const userName = user?.user_metadata?.full_name || user?.email || "User";

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeaderHeight = () => {
      const height = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--header-height",
        `${height}px`
      );
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, [extras]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center"
      style={{
        backgroundColor: "#0f5d5e",
        backgroundImage:
          "radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)",
      }}
    >
      <div className="flex items-center justify-between w-full gap-4 px-6">
        <div className="flex items-center gap-8 min-w-0">
          <Link
            to="/dashboard"
            className="shrink-0 text-white text-xl font-semibold tracking-tight"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            QNTA Heatmaps
          </Link>

          <nav className="flex items-center gap-1 shrink-0">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center justify-end gap-3 shrink-0">
          {extras && (
            <div className="hidden min-[880px]:flex items-center justify-end">
              {extras}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-[#0f5d5e]"
                aria-label="User menu"
              >
                <UserAvatar
                  name={user?.user_metadata?.full_name}
                  email={user?.email}
                  size="md"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[1100]">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  {user?.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                disabled={isSigningOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

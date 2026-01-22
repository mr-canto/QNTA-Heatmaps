import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeaderExtrasProvider } from "@/context/HeaderExtrasContext";

export function AppLayout() {
  return (
    <HeaderExtrasProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main style={{ paddingTop: "var(--header-height, 72px)" }}>
          <Outlet />
        </main>
      </div>
    </HeaderExtrasProvider>
  );
}

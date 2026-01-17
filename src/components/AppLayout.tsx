import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[72px]">
        <Outlet />
      </main>
    </div>
  );
}

import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center">
        <h1 className="text-foreground text-4xl font-bold">Welcome to Your App</h1>
      </main>
    </div>
  );
}

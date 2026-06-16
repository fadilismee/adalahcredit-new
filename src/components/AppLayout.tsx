import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

function ThemeToggleButton() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable) return null;

  return (
    <button
      onClick={toggleTheme}
      className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center justify-between px-4 border-b border-border">
          <SidebarTrigger />
          <ThemeToggleButton />
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

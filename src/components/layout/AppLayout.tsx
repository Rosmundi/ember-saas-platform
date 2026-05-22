import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full cosmic-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Neon arcs decorativi */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
            <div className="neon-arc neon-arc-magenta animate-float" style={{ width: 1100, height: 1100, top: -600, left: -400 }} />
            <div className="neon-arc neon-arc-cyan animate-float" style={{ width: 1300, height: 1300, bottom: -700, right: -500, animationDelay: '2s' }} />
          </div>
          <header className="h-14 flex items-center border-b border-border/40 px-4 bg-background/60 backdrop-blur-xl sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
          </header>
          <main className="flex-1 overflow-auto p-6 animate-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

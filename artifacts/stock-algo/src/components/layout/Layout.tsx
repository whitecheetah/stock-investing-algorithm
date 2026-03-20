import { Link, useLocation } from "wouter";
import { 
  LineChart, 
  LayoutDashboard, 
  Activity, 
  Briefcase, 
  Eye, 
  Crosshair,
  Settings,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Algorithm", icon: Activity },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/recommendations", label: "Signals", icon: Crosshair },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Background Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-screen">
        <img 
          src={`${import.meta.env.BASE_URL}images/fin-bg.png`} 
          alt="Atmospheric background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 w-64 border-r border-border/50 bg-card/40 backdrop-blur-xl flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
            <LineChart className="w-6 h-6" />
            <span>QuantCore</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary glow-primary" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 cursor-not-allowed opacity-50">
            <Settings className="w-5 h-5" />
            Settings
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            {NAV_ITEMS.find(i => i.href === location)?.label || "Dashboard"}
          </h1>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent border border-primary/20 flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">
              QC
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

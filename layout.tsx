import { Link, useLocation } from "wouter";
import { Calendar, CheckCircle2, Home, List, Timer, BookOpen, Sun, Moon } from "lucide-react";
import { FloatingAssistant } from "./floating-assistant";
import { FloatingTimer } from "./floating-timer";
import { useTheme } from "@/hooks/use-theme";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  const navItems = [
    { href: "/", label: "Today", icon: Home },
    { href: "/planner", label: "Planner", icon: Calendar },
    { href: "/all", label: "All Tasks", icon: List },
    { href: "/timer", label: "Timer", icon: Timer },
    { href: "/resources", label: "Resources", icon: BookOpen },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      <aside className="w-full md:w-64 border-r border-border bg-card p-6 flex flex-col gap-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="font-serif text-xl font-medium tracking-tight text-foreground">Daily</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </aside>
      
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      <FloatingTimer />
      <FloatingAssistant />
    </div>
  );
}

import { Link, useLocation } from "react-router-dom";
import { Home, ActivitySquare, Wrench, BarChart2, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useLanguage } from "../../context/LanguageContext";

const navItems = [
  { translationKey: "nav.home", href: "/", icon: Home },
  { translationKey: "nav.live", href: "/live", icon: ActivitySquare },
  { translationKey: "nav.maintenance", href: "/maintenance", icon: Wrench },
  { translationKey: "nav.reports", href: "/reports", icon: BarChart2 },
  { translationKey: "nav.ai_insights", href: "/ai-insights", icon: BrainCircuit },
];

export function BottomNav() {
  const location = useLocation();
  const { lightTap } = useHaptics();
  const { t } = useLanguage();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe bottom-nav-container">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={lightTap}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[44px]",
                isActive ? "text-[#F0C070]" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate max-w-[60px]">{t(item.translationKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

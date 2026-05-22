// src/components/layout/AppSidebar.tsx — v3.8.10.2: sidebar pulita + account menu footer
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useProfile } from "@/hooks/useProfile";
import {
  LayoutDashboard, Radar, Settings, Sparkles, UserCheck,
  ChevronDown, ChevronUp, Target, Search, History as HistoryIcon,
  Activity, User as UserIcon, Palette, ListChecks, ImageIcon, FileText,
  PenTool, Zap, Wand2, Layers,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AccountMenuContent } from "@/components/account/AccountMenuContent";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Watchlist", url: "/watchlist", icon: Radar },
];

const profiloSubNav = [
  { title: "Stato", hash: "#stato", icon: Activity },
  { title: "Chi sei", hash: "#chi-sei", icon: UserIcon },
  { title: "Brand voice", hash: "#brand-voice", icon: Palette },
  { title: "Audit sezioni", hash: "#audit", icon: ListChecks },
  { title: "Banner", hash: "#banner", icon: ImageIcon },
  { title: "Dati LinkedIn", hash: "#dati-linkedin", icon: FileText },
];

const prospectSubNav = [
  { title: "Target (ICP)", hash: "#target", icon: Target },
  { title: "Cerca prospect", hash: "#cerca", icon: Search },
  { title: "Ricerche", hash: "#ricerche", icon: HistoryIcon },
];

const contentSubNav = [
  { title: "Tutti", hash: "#all", icon: Sparkles },
  { title: "Post", hash: "#post", icon: PenTool },
  { title: "Hook", hash: "#hook", icon: Zap },
  { title: "Migliorati", hash: "#improvement", icon: Wand2 },
  { title: "Visual", hash: "#visual_brief", icon: ImageIcon },
  { title: "Carousel", hash: "#carousel_brief", icon: Layers },
];

function NestedGroup({
  basePath,
  title,
  icon: Icon,
  subNav,
  collapsed,
}: {
  basePath: string;
  title: string;
  icon: any;
  subNav: { title: string; hash: string; icon: any }[];
  collapsed: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const onPage = location.pathname === basePath;
  const isExpanded = onPage;

  const handleSubClick = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    const id = hash.slice(1);
    if (onPage) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      navigate(`${basePath}${hash}`, { replace: true });
    } else {
      navigate(`${basePath}${hash}`);
    }
  };

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink
            to={basePath}
            end
            className="hover:bg-accent/80 transition-all duration-200 rounded-lg"
            activeClassName="bg-accent text-primary font-medium shadow-[inset_3px_0_0_hsl(38_92%_44%)]"
          >
            <Icon className="mr-2 h-4 w-4" />
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible defaultOpen={isExpanded} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "hover:bg-accent/80 transition-all duration-200 rounded-lg w-full",
              onPage && "bg-accent text-primary font-medium shadow-[inset_3px_0_0_hsl(38_92%_44%)]",
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span className="flex-1 text-left">{title}</span>
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="ml-6 mt-1 space-y-0.5 border-l border-border/40 pl-2">
            {subNav.map((sub) => {
              const active = onPage && location.hash === sub.hash;
              return (
                <li key={sub.hash}>
                  <a
                    href={`${basePath}${sub.hash}`}
                    onClick={(e) => handleSubClick(e, sub.hash)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                      active
                        ? "bg-accent text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <sub.icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{sub.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile } = useProfile();
  const plan = profile?.plan || 'trial';
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const nome = (profile?.business_profile as any)?.nome || 'Utente';

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-surface">
      <SidebarContent className="bg-card">
        <div className="p-4 pb-2">
          <NavLink to="/dashboard" className="text-primary font-bold text-xl tracking-tight flex items-center gap-2 group">
            <span className="inline-flex w-8 h-8 rounded-lg bg-primary/10 items-center justify-center text-primary font-extrabold text-sm group-hover:bg-primary/20 transition-colors">
              E
            </span>
            {!collapsed && <span className="group-hover:tracking-wider transition-all duration-300">MBER</span>}
          </NavLink>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/dashboard"
                end
                className="hover:bg-accent/80 transition-all duration-200 rounded-lg"
                activeClassName="bg-accent text-primary font-medium shadow-[inset_3px_0_0_hsl(38_92%_44%)]"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {!collapsed && <span>Dashboard</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <NestedGroup
            basePath="/profilo"
            title="Il mio profilo"
            icon={UserCheck}
            subNav={profiloSubNav}
            collapsed={collapsed}
          />

          <NestedGroup
            basePath="/content"
            title="I miei contenuti"
            icon={Sparkles}
            subNav={contentSubNav}
            collapsed={collapsed}
          />

          <NestedGroup
            basePath="/prospect"
            title="Prospect"
            icon={Radar}
            subNav={prospectSubNav}
            collapsed={collapsed}
          />

          {mainNav.slice(1).map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="hover:bg-accent/80 transition-all duration-200 rounded-lg"
                  activeClassName="bg-accent text-primary font-medium shadow-[inset_3px_0_0_hsl(38_92%_44%)]"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-card border-t border-border/30 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/60 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg">
                {nome.charAt(0)}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{nome}</p>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/50 text-primary mt-0.5">
                      {planLabel}
                    </Badge>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-72 p-0 bg-card border-border/50"
          >
            <AccountMenuContent />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

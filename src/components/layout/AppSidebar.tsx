import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { SkillIcon } from "@/components/SkillIcon";
import { SKILLS } from "@/lib/ember-types";
import { useProfile } from "@/hooks/useProfile";
import {
  LayoutDashboard, Clock, Radar, Settings, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Cronologia", url: "/history", icon: Clock },
  { title: "Watchlist", url: "/watchlist", icon: Radar },
  { title: "Impostazioni", url: "/settings", icon: Settings },
];

const layers = [
  { label: "PROFILO", skills: SKILLS.filter(s => s.layer === 'profilo'), color: "text-layer-profilo" },
  { label: "CONTENT", skills: SKILLS.filter(s => s.layer === 'content'), color: "text-layer-content" },
  { label: "PROSPECT", skills: SKILLS.filter(s => s.layer === 'prospect'), color: "text-layer-prospect" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile } = useProfile();
  const plan = profile?.plan || 'trial';
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const nome = (profile?.business_profile as any)?.nome || 'Utente';

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-surface">
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className="p-4 pb-2">
          <NavLink to="/dashboard" className="text-primary font-bold text-xl tracking-tight flex items-center gap-2 group">
            <span className="inline-flex w-8 h-8 rounded-lg bg-primary/10 items-center justify-center text-primary font-extrabold text-sm group-hover:bg-primary/20 transition-colors">
              E
            </span>
            {!collapsed && <span className="group-hover:tracking-wider transition-all duration-300">MBER</span>}
          </NavLink>
        </div>

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
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
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-4 border-t border-border/30" />

        {/* Skills by layer */}
        {layers.map((layer) => (
          <SidebarGroup key={layer.label}>
            {!collapsed && (
              <SidebarGroupLabel className={`text-[11px] uppercase tracking-wider font-semibold ${layer.color} opacity-70`}>
                {layer.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {layer.skills.map((skill) => {
                  const available = skill.plans.includes(plan);
                  return (
                    <SidebarMenuItem key={skill.id}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/skill/${skill.id}`}
                          className={`hover:bg-accent/80 transition-all duration-200 rounded-lg ${!available ? 'opacity-40' : ''}`}
                          activeClassName="bg-accent text-primary font-medium shadow-[inset_3px_0_0_hsl(38_92%_44%)]"
                        >
                          <SkillIcon name={skill.icon} className="mr-2 h-4 w-4" />
                          {!collapsed && (
                            <span className="flex items-center gap-2 flex-1">
                              <span className="truncate">{skill.name}</span>
                              {!available && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/50 text-primary">
                                  Pro
                                </Badge>
                              )}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="bg-card border-t border-border/30 p-4">
        <div className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg group-hover:shadow-primary/20 transition-shadow">
            {nome.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{nome}</p>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/50 text-primary mt-0.5">
                {planLabel}
              </Badge>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
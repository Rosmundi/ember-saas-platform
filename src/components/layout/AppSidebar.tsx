import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { SkillIcon } from "@/components/SkillIcon";
import { SKILLS } from "@/lib/ember-types";
import { mockProfile } from "@/lib/mock-data";
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
  { label: "PROFILO", skills: SKILLS.filter(s => s.layer === 'profilo') },
  { label: "CONTENT", skills: SKILLS.filter(s => s.layer === 'content') },
  { label: "PROSPECT", skills: SKILLS.filter(s => s.layer === 'prospect') },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const profile = mockProfile;
  const planLabel = profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1);

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-surface">
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className="p-4">
          <NavLink to="/dashboard" className="text-primary font-bold text-xl tracking-tight">
            {collapsed ? "E" : "EMBER"}
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
                      className="hover:bg-accent"
                      activeClassName="bg-accent text-primary font-medium"
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

        <div className="mx-4 border-t border-border" />

        {/* Skills by layer */}
        {layers.map((layer) => (
          <SidebarGroup key={layer.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-muted text-[11px] uppercase tracking-wider font-medium">
                {layer.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {layer.skills.map((skill) => {
                  const available = skill.plans.includes(profile.plan);
                  return (
                    <SidebarMenuItem key={skill.id}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/skill/${skill.id}`}
                          className={`hover:bg-accent ${!available ? 'opacity-50' : ''}`}
                          activeClassName="bg-accent text-primary font-medium"
                        >
                          <SkillIcon name={skill.icon} className="mr-2 h-4 w-4" />
                          {!collapsed && (
                            <span className="flex items-center gap-2 flex-1">
                              <span className="truncate">{skill.name}</span>
                              {!available && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">
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

      <SidebarFooter className="bg-card border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            {profile.business_profile?.nome?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.business_profile?.nome || 'Utente'}</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">
                {planLabel}
              </Badge>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

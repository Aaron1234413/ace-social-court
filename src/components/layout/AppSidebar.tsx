
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from '@/lib/utils';
import { mainNavItems, userNavItems } from "@/config/navigation";
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/components/notifications/useNotifications';

export function AppSidebar() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications();

  // Check if current path matches the item
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Get primary nav items
  const primaryNavItems = mainNavItems;

  // Map user links with proper profile URL
  const userNavItems2 = user ? userNavItems.map(item => {
    if (item.title === "Profile") {
      return {
        ...item,
        href: `/profile/${profile?.username || user.id}`,
      };
    }
    return item;
  }) : [];

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="hidden md:flex border-r">
      <SidebarTrigger className="absolute top-4 right-[-14px] z-30 h-7 w-7" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.href as string)}
                    asChild
                    tooltip={item.title}
                  >
                    <Link to={item.href as string} className={cn(
                      "flex items-center transition-all duration-200",
                      isActive(item.href as string) ? 
                        "font-medium text-tennis-green" :
                        "text-sidebar-foreground hover:text-tennis-green/80"
                    )}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userNavItems2.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive(typeof item.href === 'function' ? item.href(user.id) : item.href)}
                      asChild
                      tooltip={item.title}
                    >
                      <Link to={typeof item.href === 'function' ? item.href(user.id) : item.href} className={cn(
                        "flex items-center transition-all duration-200",
                        isActive(typeof item.href === 'function' ? item.href(user.id) : item.href) ? 
                          "font-medium text-tennis-green" :
                          "text-sidebar-foreground hover:text-tennis-green/80"
                      )}>
                        <div className="relative">
                          {item.icon}
                          
                          {/* Add notification badge for unread items */}
                          {item.title === "Notifications" && unreadCount > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-tennis-accent"
                            >
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </Badge>
                          )}
                        </div>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}


import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/components/notifications/useNotifications";

// Import only the needed navigation items
import { mainNavItems, userNavItems } from "@/config/navigation";

const BottomNav = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();

  if (!isMobile || !user) return null;

  // Select the most critical navigation items for the bottom bar with Dashboard first
  const criticalNavItems = [
    mainNavItems.find(item => item.title === "Dashboard"),
    mainNavItems.find(item => item.title === "Feed"),
    userNavItems.find(item => item.title === "Messages"),
    userNavItems.find(item => item.title === "Profile")
  ].filter(Boolean) as Array<{
    title: string;
    href: string | ((userId?: string) => string);
    icon: React.ReactNode;
  }>;

  const getUrl = (item: { title: string; href: string | ((userId?: string) => string) }) => {
    if (item.title === "Profile" && typeof item.href === 'function') {
      return item.href(profile?.username || user.id);
    }
    return typeof item.href === 'string' ? item.href : item.href(user.id);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t md:hidden">
      <div className="flex justify-around">
        {criticalNavItems.map((item) => {
          const url = getUrl(item);
          const active = isActive(url);

          return (
            <Link
              key={item.title}
              to={url}
              className={cn(
                "flex flex-1 flex-col items-center py-3 px-1 transition-all",
                active 
                  ? "text-tennis-green font-medium" 
                  : "text-muted-foreground hover:text-tennis-green/80"
              )}
            >
              <div className="relative">
                {item.icon}
                
                {/* Add notification badge for Messages */}
                {item.title === "Messages" && unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-tennis-accent"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-xs mt-1",
                active && "font-medium"
              )}>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

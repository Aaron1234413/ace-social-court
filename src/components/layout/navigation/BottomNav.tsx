
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/components/notifications/useNotifications";

// Import only the needed navigation items
import { navigationConfig } from "@/config/navigation";

const BottomNav = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();

  if (!isMobile || !user) return null;

  // Select only the most critical navigation items for the bottom bar
  const criticalNavItems = [
    navigationConfig.primaryNavItems.find(item => item.title === "Home"),
    navigationConfig.userNavItems.find(item => item.title === "Messages"),
    navigationConfig.userNavItems.find(item => item.title === "Notifications"),
    navigationConfig.userNavItems.find(item => item.title === "Profile")
  ].filter(Boolean) as Array<{
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;

  const getUrl = (item: { title: string; url: string }) => {
    if (item.title === "Profile") {
      return `/profile/${profile?.username || user.id}`;
    }
    return item.url;
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:hidden">
      <div className="flex justify-around">
        {criticalNavItems.map((item) => {
          const url = getUrl(item);
          const active = isActive(url);

          return (
            <Link
              key={item.title}
              to={url}
              className={cn(
                "flex flex-1 flex-col items-center py-2 px-1",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                
                {/* Add notification badge for Messages and Notifications */}
                {item.title === "Notifications" && unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

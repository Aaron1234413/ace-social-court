
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { navigationConfig } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/components/notifications/useNotifications";

interface QuickActionsProps {
  userId: string;
  username?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ userId, username }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  
  // Get only the necessary user actions for the quick actions toolbar
  const quickActionItems = navigationConfig.userNavItems.filter(
    item => ["Notifications", "Messages", "Profile"].includes(item.title)
  );

  return (
    <div className="hidden md:flex space-x-1">
      {quickActionItems.map((item) => (
        <Button 
          key={item.title}
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (item.title === "Profile") {
              navigate(`/profile/${username || userId}`);
            } else {
              navigate(item.url);
            }
          }}
          className="relative"
        >
          <item.icon className="h-5 w-5" />
          
          {/* Add notification badge for unread items */}
          {item.title === "Notifications" && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;


import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, User } from "lucide-react";

interface QuickActionsProps {
  userId: string;
  username?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ userId, username }) => {
  const navigate = useNavigate();

  return (
    <div className="hidden md:flex space-x-1">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate("/notifications")}
        className="relative"
      >
        <Bell className="h-5 w-5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => navigate("/messages")}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => navigate(`/profile/${username || userId}`)}
      >
        <User className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default QuickActions;

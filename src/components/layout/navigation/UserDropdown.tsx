
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, MessageSquare, User, Bell } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const UserDropdown = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/auth");
    toast.success("Signed out successfully");
  };

  if (!user) {
    return (
      location.pathname !== "/auth" && (
        <Link to="/auth">
          <Button>Sign In</Button>
        </Link>
      )
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {profile && (
              <>
                <AvatarImage 
                  src={profile.avatar_url || undefined} 
                  alt={profile.full_name || ''} 
                />
                <AvatarFallback>
                  {profile.full_name?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <span className="hidden sm:inline">Account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to={`/profile/${profile?.username || user.id}`} className="flex items-center cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile/edit" className="flex items-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            Edit Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/messages" className="flex items-center cursor-pointer">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/notifications" className="flex items-center cursor-pointer">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-500 hover:text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;

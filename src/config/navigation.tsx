
import { Bell, Home, Map, MessageSquare, Search, Settings, User, Video, HelpCircle } from "lucide-react";

// Shared navigation configuration to be used by both the top navigation bar and sidebar
export const navigationConfig = {
  // Primary navigation links shown in both components
  primaryNavItems: [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Feed",
      url: "/feed",
      icon: Home,
    },
    {
      title: "Map",
      url: "/map",
      icon: Map,
    },
    {
      title: "Video Analysis",
      url: "/analysis",
      icon: Video,
    },
    {
      title: "Tennis AI",
      url: "/tennis-ai",
      icon: HelpCircle,
    },
  ],
  
  // User-specific navigation items that require authentication
  userNavItems: [
    {
      title: "Profile",
      url: "/profile/", // Will be appended with username or ID
      icon: User,
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageSquare,
    },
    {
      title: "Notifications",
      url: "/notifications", 
      icon: Bell,
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
    {
      title: "Settings",
      url: "/profile/edit",
      icon: Settings,
    },
  ]
};

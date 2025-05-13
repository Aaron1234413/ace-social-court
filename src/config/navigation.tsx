
import { 
  Home, MessageSquare, Bell, User, Search, Map, Video, 
  Settings, HelpCircle, LogOut, Plus, BookOpen, Clipboard
} from "lucide-react";

export const navigationConfig = {
  primaryNavItems: [
    {
      title: "Home",
      url: "/feed",
      icon: Home,
    },
    {
      title: "Explore",
      url: "/search",
      icon: Search,
    },
    {
      title: "Map",
      url: "/map",
      icon: Map,
    },
    {
      title: "Analysis",
      url: "/analysis",
      icon: Video,
    },
    {
      title: "Tennis AI",
      url: "/tennis-ai",
      icon: BookOpen,
    },
    {
      title: "User Testing",
      url: "/tests",
      icon: Clipboard,
    },
  ],
  userNavItems: [
    {
      title: "Profile",
      url: "/profile",
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
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/help",
      icon: HelpCircle,
    },
  ],
  additionalActions: [
    {
      title: "New Post",
      url: "/create-post",
      icon: Plus,
    },
  ],
};

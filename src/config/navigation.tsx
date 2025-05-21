
import {
  Home,
  User,
  MessageCircle,
  Map,
  Settings,
  Search,
  Bell,
  Brain,
  PlusSquare
} from 'lucide-react';
import { ReactNode } from 'react';

export interface NavItem {
  title: string;
  href: string | ((userId?: string) => string);
  icon: ReactNode;
  mobileLabel?: string;
  isAction?: boolean;
}

// Primary navigation items
export const mainNavItems: NavItem[] = [
  {
    title: "Feed",
    href: "/feed",
    icon: <Home className="h-5 w-5" />,
    mobileLabel: "Feed"
  },
  {
    title: "Map",
    href: "/explore",
    icon: <Map className="h-5 w-5" />,
    mobileLabel: "Explore"
  },
  {
    title: "Messages",
    href: "/messages",
    icon: <MessageCircle className="h-5 w-5" />,
    mobileLabel: "Messages"
  },
  {
    title: "Search",
    href: "/search",
    icon: <Search className="h-5 w-5" />,
    mobileLabel: "Search"
  }
];

// User-related navigation items
export const userNavItems: NavItem[] = [
  {
    title: "Notifications",
    href: "/notifications",
    icon: <Bell className="h-5 w-5" />,
    mobileLabel: "Notifications"
  },
  {
    title: "Tennis AI",
    href: "/tennis-ai",
    icon: <Brain className="h-5 w-5" />,
    mobileLabel: "AI"
  },
  {
    title: "Profile",
    href: (userId?: string) => userId ? `/profile/${userId}` : '/profile',
    icon: <User className="h-5 w-5" />,
    mobileLabel: "Profile"
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    mobileLabel: "Settings"
  }
];

// Action items
export const actionItems: NavItem[] = [
  {
    title: "Log a Match",
    href: "/log/match",
    icon: <PlusSquare className="h-5 w-5" />,
    isAction: true
  }
];

// Add a navigationConfig export that combines all navigation items
export const navigationConfig = {
  primaryNavItems: mainNavItems,
  userNavItems: userNavItems,
  actionItems: actionItems
};

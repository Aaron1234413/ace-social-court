import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlignJustify,
  X,
  Home,
  MessagesSquare,
  Map,
  Bell,
  Search,
  MessageSquarePlus,
  Database
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import NotificationsPopover from '@/components/notifications/NotificationsPopover';
import { useMobile } from '@/hooks/use-mobile';

interface EnhancedNavigationProps {
  className?: string;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const EnhancedNavigation = ({ className, mobileOpen, setMobileOpen }: EnhancedNavigationProps) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isMobile = useMobile();

  const baseStyles =
    "group flex w-full items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium hover:bg-secondary focus:outline-none";
  const activeStyles =
    "bg-secondary text-primary";
  const inactiveStyles =
    "text-muted-foreground hover:text-primary";

  return (
    <nav className={cn("flex-1", className)}>
      <ul className="grid gap-1">
        <li>
          <NavLink
            to="/"
            className={({isActive}) => cn(
              baseStyles,
              isActive ? activeStyles : inactiveStyles
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Home className="w-4 h-4 mr-3" />
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/feed"
            className={({isActive}) => cn(
              baseStyles,
              isActive ? activeStyles : inactiveStyles
            )}
            onClick={() => setMobileOpen(false)}
          >
            <MessageSquarePlus className="w-4 h-4 mr-3" />
            Feed
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/map"
            className={({isActive}) => cn(
              baseStyles,
              isActive ? activeStyles : inactiveStyles
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Map className="w-4 h-4 mr-3" />
            Map
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/messages"
            className={({isActive}) => cn(
              baseStyles,
              isActive ? activeStyles : inactiveStyles
            )}
            onClick={() => setMobileOpen(false)}
          >
            <MessagesSquare className="w-4 h-4 mr-3" />
            Messages
          </NavLink>
        </li>
        {user && (
          <li>
            <NavLink
              to="/admin"
              className={({isActive}) => cn(
                baseStyles,
                isActive ? activeStyles : inactiveStyles
              )}
              onClick={() => setMobileOpen(false)}
            >
              <Database className="w-4 h-4 mr-3" />
              Admin Tools
            </NavLink>
          </li>
        )}
      </ul>
      <div className="mt-auto hidden flex-col pt-6 lg:flex">
        <div className="mb-4">
          <NotificationsPopover mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        </div>
        <Button variant="outline" asChild className="w-full justify-start rounded-md px-3 py-2">
          <NavLink to="/profile/edit" onClick={() => setMobileOpen(false)}>
            <AlignJustify className="mr-2 h-4 w-4" />
            Edit Profile
          </NavLink>
        </Button>
      </div>
    </nav>
  );
};

export default EnhancedNavigation;

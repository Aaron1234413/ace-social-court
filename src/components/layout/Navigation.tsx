import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, Home, User, LayoutGrid, Search, Bell, MessageSquare } from 'lucide-react';
import NotificationsPopover from '@/components/notifications/NotificationsPopover';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const navigationLinks = [
    {
      name: 'Home',
      path: '/',
      icon: <Home className="h-4 w-4 md:h-5 md:w-5" />,
      requiresAuth: false
    },
    {
      name: 'Feed',
      path: '/feed',
      icon: <LayoutGrid className="h-4 w-4 md:h-5 md:w-5" />,
      requiresAuth: true
    },
    {
      name: 'Search',
      path: '/search',
      icon: <Search className="h-4 w-4 md:h-5 md:w-5" />,
      requiresAuth: false
    },
    {
      name: 'Messages',
      path: '/messages',
      icon: <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />,
      requiresAuth: true
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <User className="h-4 w-4 md:h-5 md:w-5" />,
      requiresAuth: true
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: <Bell className="h-4 w-4 md:h-5 md:w-5" />,
      requiresAuth: true
    }
  ];

  const filteredLinks = navigationLinks.filter(
    link => !link.requiresAuth || (link.requiresAuth && user)
  );

  function NavLinks() {
    return (
      <>
        {filteredLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              location.pathname === link.path || (link.path === '/messages' && location.pathname.startsWith('/messages/'))
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => isMobile && setIsOpen(false)}
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        ))}
      </>
    );
  }

  function AuthButtons() {
    return (
      <>
        {user ? (
          <div className="flex items-center gap-3">
            <NotificationsPopover />
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Log In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Sign Up</Link>
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex w-full border-b bg-background">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-xl text-primary">
              AceSocial
            </Link>
            <div className="flex items-center gap-1">
              <NavLinks />
            </div>
          </div>
          <AuthButtons />
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-between p-4 border-b bg-background">
        <Link to="/" className="font-bold text-xl text-primary">
          AceSocial
        </Link>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col">
            <div className="flex flex-col space-y-1 mt-6">
              <NavLinks />
            </div>
            <div className="mt-auto py-4">
              <AuthButtons />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
};

export default Navigation;

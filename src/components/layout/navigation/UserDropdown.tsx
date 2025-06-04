
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/AuthProvider';
import { userNavItems } from '@/config/navigation';
import { RoleSwitcher } from '@/components/navigation/RoleSwitcher';

export function UserDropdown() {
  const { user, profile, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignInClick = () => {
    navigate('/auth');
  };

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  // Show sign in button ONLY if there's no user at all
  if (!user) {
    return (
      <Button onClick={handleSignInClick} variant="default" size="sm">
        Sign In
      </Button>
    );
  }

  // If we have a user but no profile, show loading state
  if (user && !profile) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  const getUserDisplayName = () => {
    return profile.full_name || profile.username || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Role Switcher - only show if user has multiple roles */}
      <RoleSwitcher />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.avatar_url || undefined} alt={getUserDisplayName()} />
              <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {profile.current_active_role && (
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {profile.current_active_role} Mode
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {userNavItems.map((item) => (
            <DropdownMenuItem key={item.title} asChild>
              <Link 
                to={typeof item.href === 'function' ? item.href(user.id) : item.href}
                className="flex items-center gap-2"
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

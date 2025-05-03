
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { Home, User, MessageSquare, Bell } from "lucide-react";
import UserDropdown from "./navigation/UserDropdown";
import MobileMenu from "./navigation/MobileMenu";
import SearchForm from "./navigation/SearchForm";
import QuickActions from "./navigation/QuickActions";

const Navigation = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    // The actual sign out logic is moved to UserDropdown component
  };

  const navLinks = [
    { to: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
    { to: "/feed", label: "Feed", icon: null },
    { to: "/map", label: "Map", icon: null },
    { to: "/analysis", label: "Video Analysis", icon: null },
  ];

  const userLinks = user ? [
    { to: `/profile/${profile?.username || user.id}`, label: "Profile", icon: <User className="h-5 w-5" /> },
    { to: "/messages", label: "Messages", icon: <MessageSquare className="h-5 w-5" /> },
    { to: "/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
  ] : [];

  return (
    <div className="border-b sticky top-0 bg-background z-50">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu */}
        <MobileMenu 
          navLinks={navLinks}
          userLinks={userLinks}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onSignOut={handleSignOut}
        />
        
        {/* Logo/brand */}
        <Link to="/" className="text-xl font-bold mr-4">
          rallypointx
        </Link>

        {/* Desktop navigation */}
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6 hidden md:flex">
          {navLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search and user actions */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Search form */}
          <SearchForm />

          {/* Quick action links (desktop only) */}
          {user && (
            <QuickActions 
              userId={user.id} 
              username={profile?.username}
            />
          )}

          {/* User dropdown */}
          <UserDropdown />
        </div>
      </div>
    </div>
  );
};

export default Navigation;

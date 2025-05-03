
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import UserDropdown from "./navigation/UserDropdown";
import MobileMenu from "./navigation/MobileMenu";
import SearchForm from "./navigation/SearchForm";
import QuickActions from "./navigation/QuickActions";
import { navigationConfig } from "@/config/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Get primary nav links from shared config
  const navLinks = navigationConfig.primaryNavItems;

  // Map user links with proper profile URL
  const userLinks = user ? navigationConfig.userNavItems.map(item => {
    if (item.title === "Profile") {
      return {
        ...item,
        url: `/profile/${profile?.username || user.id}`,
      };
    }
    return item;
  }) : [];

  // Only show main nav links on mobile, not on desktop (since desktop has sidebar)
  const displayedNavLinks = isMobile ? navLinks : [];

  return (
    <div className="border-b sticky top-0 bg-background z-50">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu */}
        <MobileMenu 
          navLinks={navLinks}
          userLinks={userLinks}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onSignOut={() => {}} // Actual sign-out is handled in UserDropdown
        />
        
        {/* Logo/brand */}
        <Link to="/" className="text-xl font-bold mr-4">
          rallypointx
        </Link>

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

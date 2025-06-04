
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { UserDropdown } from "./navigation/UserDropdown";
import MobileMenu from "./navigation/MobileMenu";
import SearchForm from "./navigation/SearchForm";
import { QuickActions } from "./navigation/QuickActions";
import { mainNavItems, userNavItems, NavItem } from "@/config/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Get primary nav links
  const navLinks = mainNavItems;

  // Map user links with proper profile URL
  const userLinks = user ? userNavItems.map(item => {
    if (item.title === "Profile") {
      return {
        ...item,
        href: `/profile/${profile?.username || user.id}`,
      };
    }
    return item;
  }) : [];

  // Only show main nav links on mobile, not on desktop (since desktop has sidebar)
  const displayedNavLinks = isMobile ? navLinks : [];

  console.log("Navigation component rendering, path:", location.pathname);
  console.log("Navigation auth state:", { user: !!user, profile: !!profile, isLoading });

  // Don't render anything while loading to prevent flash
  if (isLoading) {
    return (
      <div className="border-b sticky top-0 bg-background z-50 backdrop-blur-sm bg-background/90">
        <div className="flex h-16 items-center px-4">
          {/* Logo/brand with tennis styling */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tennis-green to-tennis-darkGreen flex items-center justify-center text-white font-bold text-sm animate-bounce-subtle">
              rpx
            </div>
            <span className="text-xl font-bold tennis-gradient-text">rallypointx</span>
          </Link>
          
          {/* Loading placeholder */}
          <div className="ml-auto flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b sticky top-0 bg-background z-50 backdrop-blur-sm bg-background/90">
      <div className="flex h-16 items-center px-4">
        {/* Tennis ball icon and menu */}
        <div className="flex items-center">
          {/* Mobile menu - only show when user is logged in */}
          {user && (
            <MobileMenu 
              navLinks={navLinks}
              userLinks={userLinks}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              onSignOut={() => {}} // Actual sign-out is handled in UserDropdown
            />
          )}
          
          {/* Logo/brand with tennis styling */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tennis-green to-tennis-darkGreen flex items-center justify-center text-white font-bold text-sm animate-bounce-subtle">
              rpx
            </div>
            <span className="text-xl font-bold tennis-gradient-text">rallypointx</span>
          </Link>
        </div>

        {/* Search and user actions */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Search form - only show when user is logged in */}
          {user && <SearchForm />}

          {/* Quick action links (desktop only) */}
          {user && <QuickActions />}

          {/* User dropdown */}
          <UserDropdown />
        </div>
      </div>
    </div>
  );
};

export default Navigation;

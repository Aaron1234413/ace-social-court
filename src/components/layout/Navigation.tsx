import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/components/AuthProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Home, Menu, MessageSquare, Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/search?q=${searchQuery}`);
    }
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
        {/* Mobile menu trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <div className="flex flex-col gap-4 py-4">
              <div className="px-2 mb-2">
                <h2 className="text-lg font-semibold mb-2">Navigation</h2>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
              
              {user && (
                <div className="border-t pt-2 px-2">
                  <h2 className="text-lg font-semibold mb-2">User</h2>
                  {userLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-2 py-2 h-auto"
                    onClick={() => {
                      signOut();
                      navigate("/auth");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span>Sign Out</span>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
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

        {/* Search form */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pr-10 rounded-full bg-gray-100 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 w-[200px] lg:w-[300px]"
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1">
              <Search className="h-5 w-5" />
            </Button>
          </form>

          {/* Quick action links (desktop only) */}
          {user && (
            <div className="hidden md:flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/notifications")}
                className="relative"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/messages")}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(`/profile/${profile?.username || user.id}`)}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* User dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
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
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to={`/profile/${profile?.username || user.id}`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile/edit">Edit Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/messages">Messages</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                    navigate("/auth");
                  }}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            location.pathname !== "/auth" && (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;

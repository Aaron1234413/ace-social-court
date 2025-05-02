
import React from "react"
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
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6 hidden md:block">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link to="/feed" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Feed
          </Link>
          <Link to="/map" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Map
          </Link>
          <Link to="/analysis" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Video Analysis
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pr-10 rounded-full bg-gray-100 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1">
              <Search className="h-5 w-5" />
            </Button>
          </form>
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

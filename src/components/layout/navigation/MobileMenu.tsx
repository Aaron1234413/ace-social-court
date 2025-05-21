
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { NavItem } from "@/config/navigation";

interface MobileMenuProps {
  navLinks: NavItem[];
  userLinks: NavItem[];
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSignOut: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  navLinks,
  userLinks,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onSignOut
}) => {
  const { user } = useAuth();

  return (
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
                key={link.href.toString()}
                to={typeof link.href === 'function' ? link.href() : link.href}
                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.icon}
                <span>{link.title}</span>
              </Link>
            ))}
          </div>
          
          {user && (
            <div className="border-t pt-2 px-2">
              <h2 className="text-lg font-semibold mb-2">User</h2>
              {userLinks.map((link) => (
                <Link
                  key={link.href.toString()}
                  to={typeof link.href === 'function' ? link.href(user.id) : link.href}
                  className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.icon}
                  <span>{link.title}</span>
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start px-2 py-2 h-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  onSignOut();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;

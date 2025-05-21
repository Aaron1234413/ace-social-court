
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { actionItems } from '@/config/navigation';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export function QuickActions() {
  const { user } = useAuth();
  
  const handleActionClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      toast.error("You must be logged in to access this feature");
      return;
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {actionItems.map((item, index) => (
        <Button 
          key={index}
          variant="default"
          size="sm"
          asChild
        >
          <Link 
            to={typeof item.href === 'function' ? item.href(user?.id) : item.href}
            onClick={(e) => handleActionClick(e, typeof item.href === 'function' ? item.href(user?.id) : item.href)}
            className="flex items-center gap-1"
          >
            {item.icon}
            <span className="hidden md:inline">{item.title}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}

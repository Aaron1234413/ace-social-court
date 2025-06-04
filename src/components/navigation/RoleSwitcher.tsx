
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Users, GraduationCap, Crown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function RoleSwitcher() {
  const { profile, refreshProfile } = useAuth();

  if (!profile || !profile.roles || profile.roles.length <= 1) {
    return null; // Don't show if user only has one role
  }

  const handleRoleSwitch = async (newRole: string) => {
    if (!profile || newRole === profile.current_active_role) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_active_role: newRole })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(`Switched to ${newRole} mode`, {
        description: `You're now viewing the ${newRole} dashboard and features.`
      });
    } catch (error) {
      console.error('Error switching role:', error);
      toast.error('Failed to switch role', {
        description: 'Please try again or refresh the page.'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'coach':
        return <GraduationCap className="h-4 w-4" />;
      case 'ambassador':
        return <Crown className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coach':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ambassador':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {getRoleIcon(profile.current_active_role)}
          <span className="capitalize">{profile.current_active_role}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="p-2">
          <p className="text-xs text-muted-foreground mb-2">Switch Role</p>
          {profile.roles.map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className="flex items-center gap-2 p-2"
            >
              <div className="flex items-center gap-2 flex-1">
                {getRoleIcon(role)}
                <span className="capitalize">{role}</span>
              </div>
              {role === profile.current_active_role && (
                <Badge variant="secondary" className={`text-xs ${getRoleColor(role)}`}>
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

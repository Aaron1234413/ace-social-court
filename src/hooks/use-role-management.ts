
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

export function useRoleManagement() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { profile, refreshProfile } = useAuth();

  const addRole = async (newRole: string) => {
    if (!profile || profile.roles?.includes(newRole)) {
      return { success: false, error: 'Role already exists or invalid profile' };
    }

    setIsUpdating(true);
    try {
      const updatedRoles = [...(profile.roles || []), newRole];
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          roles: updatedRoles,
          // If this is their first additional role, don't switch automatically
          // Let them choose when to switch
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(`${newRole} role added successfully`, {
        description: 'You can now switch between your roles using the role switcher.'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
      return { success: false, error };
    } finally {
      setIsUpdating(false);
    }
  };

  const removeRole = async (roleToRemove: string) => {
    if (!profile || !profile.roles?.includes(roleToRemove) || profile.roles.length <= 1) {
      return { success: false, error: 'Cannot remove role' };
    }

    setIsUpdating(true);
    try {
      const updatedRoles = profile.roles.filter(role => role !== roleToRemove);
      const newActiveRole = profile.current_active_role === roleToRemove 
        ? updatedRoles[0] 
        : profile.current_active_role;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          roles: updatedRoles,
          current_active_role: newActiveRole
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(`${roleToRemove} role removed successfully`);
      
      return { success: true };
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
      return { success: false, error };
    } finally {
      setIsUpdating(false);
    }
  };

  const switchRole = async (newRole: string) => {
    if (!profile || !profile.roles?.includes(newRole) || newRole === profile.current_active_role) {
      return { success: false, error: 'Invalid role switch' };
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_active_role: newRole })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      
      return { success: true };
    } catch (error) {
      console.error('Error switching role:', error);
      return { success: false, error };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    addRole,
    removeRole,
    switchRole,
    isUpdating,
    currentRoles: profile?.roles || [],
    activeRole: profile?.current_active_role || 'player'
  };
}


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Crown, Plus, X } from 'lucide-react';
import { useRoleManagement } from '@/hooks/use-role-management';
import { useAuth } from '@/components/AuthProvider';

const AVAILABLE_ROLES = [
  { id: 'player', label: 'Player', icon: Users, description: 'Access player features and training tools' },
  { id: 'coach', label: 'Coach', icon: GraduationCap, description: 'Access coaching tools and student management' },
  { id: 'ambassador', label: 'Ambassador', icon: Crown, description: 'Create content and represent the community' }
];

export function RoleManagementField() {
  const { profile } = useAuth();
  const { addRole, removeRole, isUpdating, currentRoles } = useRoleManagement();

  const handleAddRole = async (roleId: string) => {
    await addRole(roleId);
  };

  const handleRemoveRole = async (roleId: string) => {
    if (currentRoles.length <= 1) {
      return; // Don't allow removing the last role
    }
    await removeRole(roleId);
  };

  const getRoleIcon = (RoleIcon: any) => <RoleIcon className="h-4 w-4" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Role Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your roles to access different features. You can switch between roles anytime.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Roles */}
        <div>
          <h4 className="text-sm font-medium mb-2">Your Current Roles</h4>
          <div className="flex flex-wrap gap-2">
            {currentRoles.map((roleId) => {
              const role = AVAILABLE_ROLES.find(r => r.id === roleId);
              if (!role) return null;
              
              return (
                <Badge key={roleId} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                  {getRoleIcon(role.icon)}
                  <span className="capitalize">{role.label}</span>
                  {roleId === profile?.current_active_role && (
                    <span className="text-xs bg-primary text-primary-foreground px-1 rounded">Active</span>
                  )}
                  {currentRoles.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveRole(roleId)}
                      disabled={isUpdating}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Available Roles to Add */}
        {AVAILABLE_ROLES.some(role => !currentRoles.includes(role.id)) && (
          <div>
            <h4 className="text-sm font-medium mb-2">Add Additional Roles</h4>
            <div className="space-y-2">
              {AVAILABLE_ROLES
                .filter(role => !currentRoles.includes(role.id))
                .map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(role.icon)}
                      <div>
                        <p className="font-medium">{role.label}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddRole(role.id)}
                      disabled={isUpdating}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> After adding multiple roles, you can switch between them using the role switcher in the navigation.
        </div>
      </CardContent>
    </Card>
  );
}


import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Eye, 
  UserCheck, 
  UserX, 
  Activity,
  Calendar,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  user_type: 'player' | 'coach';
  experience_level: string | null;
  created_at: string;
  location_name: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Fetch users from profiles table
  const { data: profiles, isLoading: profilesLoading, refetch } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    }
  });

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user activity for selected user
  const { data: userActivity } = useQuery({
    queryKey: ['admin-user-activity', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null;
      
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', selectedUser)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser
  });

  const filteredProfiles = profiles?.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserRole = (userId: string) => {
    return userRoles?.find(role => role.user_id === userId)?.role || 'user';
  };

  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    try {
      // First check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userId,
            role: newRole
          }]);
        
        if (error) throw error;
      }

      // Log the activity
      await supabase.rpc('log_user_activity', {
        _user_id: userId,
        _action_type: 'role_updated',
        _action_details: { new_role: newRole, updated_by_admin: true }
      });

      toast.success(`User role updated to ${newRole}`);
      refetch();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  if (profilesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <div className="text-center py-8">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage user accounts, roles, and view activity
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Players</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles?.filter(p => p.user_type === 'player').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaches</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles?.filter(p => p.user_type === 'coach').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRoles?.filter(r => r.role === 'admin').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles?.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {profile.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{profile.username || 'no-username'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.user_type === 'coach' ? 'default' : 'secondary'}>
                      {profile.user_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        getUserRole(profile.id) === 'admin' ? 'destructive' :
                        getUserRole(profile.id) === 'moderator' ? 'default' : 'outline'
                      }
                    >
                      {getUserRole(profile.id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {profile.experience_level || 'Not set'}
                  </TableCell>
                  <TableCell>
                    {profile.location_name || 'Not set'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(profile.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(
                          selectedUser === profile.id ? null : profile.id
                        )}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <select
                        value={getUserRole(profile.id)}
                        onChange={(e) => handleRoleUpdate(profile.id, e.target.value as any)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Activity Panel */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userActivity && userActivity.length > 0 ? (
              <div className="space-y-3">
                {userActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{activity.action_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                      {activity.action_details && Object.keys(activity.action_details).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(activity.action_details)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found for this user
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

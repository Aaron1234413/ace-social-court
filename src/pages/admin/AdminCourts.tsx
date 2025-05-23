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
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X,
  MapPin,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface TennisCourt {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  surface_type: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  created_by: string | null;
  is_approved: boolean | null;
  is_public: boolean;
  profiles?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export default function AdminCourts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedCourt, setSelectedCourt] = useState<TennisCourt | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch tennis courts with user profiles using separate queries
  const { data: courts, isLoading, refetch } = useQuery({
    queryKey: ['admin-courts'],
    queryFn: async () => {
      // First get all tennis courts
      const { data: courtsData, error: courtsError } = await supabase
        .from('tennis_courts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (courtsError) throw courtsError;

      // Get unique created_by user IDs (filtering out null values)
      const userIds = [...new Set(courtsData
        .map(court => court.created_by)
        .filter(id => id !== null))] as string[];
      
      if (userIds.length === 0) {
        // No user profiles to fetch, return courts without profiles
        return courtsData.map(court => ({
          ...court,
          profiles: null
        })) as TennisCourt[];
      }

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      // Create a map of profiles by user ID
      const profilesMap = new Map(profilesData.map(profile => [profile.id, profile]));

      // Combine courts with profiles
      const courtsWithProfiles = courtsData.map(court => ({
        ...court,
        profiles: court.created_by ? profilesMap.get(court.created_by) || null : null
      }));

      return courtsWithProfiles as TennisCourt[];
    }
  });

  const filteredCourts = courts?.filter(court => {
    // First apply tab filter
    if (activeTab === 'pending' && court.is_approved !== null) return false;
    if (activeTab === 'approved' && court.is_approved !== true) return false;
    if (activeTab === 'rejected' && court.is_approved !== false) return false;
    
    // Then apply search term
    return !searchTerm || 
      court.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      court.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      court.state?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleApprove = async (courtId: string) => {
    try {
      const { error } = await supabase
        .from('tennis_courts')
        .update({ is_approved: true })
        .eq('id', courtId);

      if (error) throw error;

      toast.success('Tennis court approved successfully');
      refetch();
    } catch (error) {
      console.error('Error approving tennis court:', error);
      toast.error('Failed to approve tennis court');
    }
  };

  const handleReject = async (courtId: string) => {
    try {
      const { error } = await supabase
        .from('tennis_courts')
        .update({ is_approved: false })
        .eq('id', courtId);

      if (error) throw error;

      toast.success('Tennis court rejected');
      refetch();
    } catch (error) {
      console.error('Error rejecting tennis court:', error);
      toast.error('Failed to reject tennis court');
    }
  };

  const viewDetails = (court: TennisCourt) => {
    setSelectedCourt(court);
    setIsDetailsOpen(true);
  };

  const pendingCount = courts?.filter(court => court.is_approved === null).length || 0;
  const approvedCount = courts?.filter(court => court.is_approved === true).length || 0;
  const rejectedCount = courts?.filter(court => court.is_approved === false).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tennis Courts Management</h1>
        </div>
        <div className="text-center py-8">Loading courts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tennis Courts Management</h1>
          <p className="text-gray-600 mt-2">
            Review and moderate user-submitted tennis courts
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Courts</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Courts</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
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
                placeholder="Search courts by name or location..."
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

      {/* Courts Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tennis Courts Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="pending" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'pending' | 'approved' | 'rejected')}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-0">
              {renderCourtsTable(filteredCourts)}
            </TabsContent>
            
            <TabsContent value="approved" className="mt-0">
              {renderCourtsTable(filteredCourts)}
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-0">
              {renderCourtsTable(filteredCourts)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Court Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCourt?.name}</DialogTitle>
            <DialogDescription>
              Court details and information
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p>{[selectedCourt.city, selectedCourt.state, selectedCourt.country].filter(Boolean).join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Surface Type</p>
                  <p>{selectedCourt.surface_type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Public Access</p>
                  <p>{selectedCourt.is_public ? 'Public' : 'Private'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Coordinates</p>
                  <p>{selectedCourt.latitude.toFixed(6)}, {selectedCourt.longitude.toFixed(6)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p>{selectedCourt.description || 'No description provided'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Submitted By</p>
                  <p>{selectedCourt.profiles?.full_name || selectedCourt.profiles?.username || 'Unknown user'}</p>
                </div>
              </div>

              <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
                <MapPin className="h-6 w-6 text-gray-400" />
                <span className="ml-2 text-gray-500">Map Preview</span>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-between">
            {selectedCourt?.is_approved === null && (
              <>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    handleReject(selectedCourt.id);
                    setIsDetailsOpen(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleApprove(selectedCourt.id);
                    setIsDetailsOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            
            {selectedCourt?.is_approved !== null && (
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderCourtsTable(courts: TennisCourt[] | undefined) {
    if (!courts?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tennis courts found matching your filters</p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Court Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Surface</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courts.map((court) => (
            <TableRow key={court.id}>
              <TableCell>
                <div className="font-medium">{court.name}</div>
                {court.created_by && (
                  <div className="text-xs text-muted-foreground">
                    by {court.profiles?.username || 'unknown'}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {[court.city, court.state, court.country].filter(Boolean).join(', ')}
              </TableCell>
              <TableCell>
                {court.surface_type || 'Not specified'}
              </TableCell>
              <TableCell>
                {format(new Date(court.created_at), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                {court.is_approved === null && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Pending Review
                  </Badge>
                )}
                {court.is_approved === true && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Approved
                  </Badge>
                )}
                {court.is_approved === false && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Rejected
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => viewDetails(court)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {court.is_approved === null && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleApprove(court.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleReject(court.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}

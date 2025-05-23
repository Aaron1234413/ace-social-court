
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
  Trash2, 
  FileText,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Flag,
  FlagOff
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  updated_at: string;
  is_flagged: boolean;
  flag_reason: string | null;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export default function AdminContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'flagged'>('all');

  // Fetch posts with user profiles using the foreign key constraint
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          media_type,
          media_url,
          user_id,
          is_flagged,
          flag_reason,
          profiles!posts_user_fkey (
            full_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AdminPost[];
    }
  });

  const filteredPosts = posts?.filter(post => {
    // First apply tab filter
    if (activeTab === 'flagged' && !post.is_flagged) {
      return false;
    }
    
    // Then apply search filter
    return post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  });

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleToggleFlag = async (postId: string, currentFlagStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          is_flagged: !currentFlagStatus,
          // If we're setting to unflagged, clear the flag reason
          flag_reason: !currentFlagStatus ? null : undefined 
        })
        .eq('id', postId);

      if (error) throw error;

      toast.success(currentFlagStatus ? 'Post unflagged successfully' : 'Post flagged for review');
      refetch();
    } catch (error) {
      console.error('Error updating post flag status:', error);
      toast.error('Failed to update post flag status');
    }
  };

  const getMediaIcon = (mediaType: string | null) => {
    if (!mediaType) return <FileText className="h-4 w-4" />;
    if (mediaType.startsWith('image')) return <ImageIcon className="h-4 w-4" />;
    if (mediaType.startsWith('video')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const flaggedCount = posts?.filter(post => post.is_flagged)?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Content Management</h1>
        </div>
        <div className="text-center py-8">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and moderate user-generated content
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Media</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts?.filter(p => p.media_url).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts?.filter(p => 
                new Date(p.created_at).toDateString() === new Date().toDateString()
              ).length || 0}
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
                placeholder="Search posts by content or author..."
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

      {/* Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'all' | 'flagged')}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="all">All Content</TabsTrigger>
              <TabsTrigger value="flagged" className="relative">
                Flagged
                {flaggedCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{flaggedCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {renderPostsTable(filteredPosts)}
            </TabsContent>
            
            <TabsContent value="flagged" className="mt-0">
              {flaggedCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-10 w-10 mx-auto mb-4 opacity-20" />
                  <p>No flagged content to review</p>
                </div>
              ) : (
                renderPostsTable(filteredPosts)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  function renderPostsTable(posts: AdminPost[] | undefined) {
    if (!posts?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No posts found matching your filters</p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Author</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Media</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id} className={post.is_flagged ? 'bg-red-50/30' : ''}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.profiles?.full_name?.charAt(0) || 
                       post.profiles?.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {post.profiles?.full_name || 'No name'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{post.profiles?.username || 'no-username'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-md">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  {post.flag_reason && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-red-500 border-red-200">
                        Flag reason: {post.flag_reason}
                      </Badge>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getMediaIcon(post.media_type)}
                  <Badge variant="outline">
                    {post.media_type ? post.media_type.split('/')[0] : 'text'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={post.is_flagged ? "destructive" : "secondary"}>
                  {post.is_flagged ? 'Flagged' : 'Active'}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(post.created_at), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleFlag(post.id, post.is_flagged)}
                    className={post.is_flagged ? "text-green-600" : "text-amber-600"}
                  >
                    {post.is_flagged ? <FlagOff className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}

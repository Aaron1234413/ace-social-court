
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
  MessageSquare,
  Users,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminDirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  recipient_profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export default function AdminMessages() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch direct messages with sender and recipient profiles using correct join syntax
  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          content,
          created_at,
          read,
          recipient_id,
          sender_id,
          sender_profile:profiles!direct_messages_sender_id_fkey (
            full_name,
            username,
            avatar_url
          ),
          recipient_profile:profiles!direct_messages_recipient_id_fkey (
            full_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AdminDirectMessage[];
    }
  });

  // Get conversation stats
  const { data: conversationStats } = useQuery({
    queryKey: ['admin-conversation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, last_message_at')
        .order('last_message_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredMessages = messages?.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.recipient_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayMessages = messages?.filter(m => 
    new Date(m.created_at).toDateString() === new Date().toDateString()
  ).length || 0;

  const unreadMessages = messages?.filter(m => !m.read).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Message Management</h1>
        </div>
        <div className="text-center py-8">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Message Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor direct messages and conversations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversationStats?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Messages</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages}</div>
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
                placeholder="Search messages by content or participants..."
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

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages?.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {message.sender_profile?.full_name?.charAt(0) || 
                           message.sender_profile?.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {message.sender_profile?.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{message.sender_profile?.username || 'no-username'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.recipient_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {message.recipient_profile?.full_name?.charAt(0) || 
                           message.recipient_profile?.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {message.recipient_profile?.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{message.recipient_profile?.username || 'no-username'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm line-clamp-2">{message.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={message.read ? 'outline' : 'default'}>
                      {message.read ? 'Read' : 'Unread'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

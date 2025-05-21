
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCreateConversation } from '@/hooks/use-create-conversation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onError?: (error: string) => void;
}

const NewMessageDialog = ({ open, onOpenChange, onError }: NewMessageDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createConversation, isCreating } = useCreateConversation();
  
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .neq('id', user?.id)
        .limit(10);
        
      if (error) {
        console.error('Error searching users:', error);
        if (onError) onError(`Error searching users: ${error.message}`);
        return [];
      }
      
      return data;
    },
    enabled: searchQuery.length >= 2,
  });
  
  const handleStartConversation = (userId: string) => {
    if (!user) {
      toast.error("You need to be logged in");
      return;
    }

    try {
      createConversation(userId, {
        onSuccess: (conversationId) => {
          console.log("Successfully created conversation with ID:", conversationId);
          onOpenChange(false);
          navigate(`/messages/${conversationId}`);
        },
        onError: (error) => {
          console.error('Error creating conversation:', error);
          
          // Try to fetch the existing conversation
          if (error instanceof Error && error.message.includes('duplicate key')) {
            fetchExistingConversation(userId);
          } else {
            toast.error("Failed to create conversation");
            if (onError) onError(error instanceof Error ? error.message : String(error));
          }
        },
        onSettled: () => {
          // Regardless of success or failure, let's refresh the conversations list
          // This is important for showing newly created conversations
          setTimeout(() => {
            navigate('/messages');
            navigate(`/messages/${userId}`);
          }, 200);
        }
      });
    } catch (err) {
      console.error('Unexpected error in NewMessageDialog:', err);
      toast.error("Failed to create conversation");
    }
  };

  const fetchExistingConversation = async (otherUserId: string) => {
    if (!user) return;
    
    try {
      console.log("Looking for existing conversation between", user.id, "and", otherUserId);
      
      // Use lexicographical comparison for consistent ID ordering
      const user1 = user.id < otherUserId ? user.id : otherUserId;
      const user2 = user.id > otherUserId ? user.id : otherUserId;
      
      // Try to get the exact conversation
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .maybeSingle();
        
      if (error) {
        console.error('Error finding conversation (exact match):', error);
        
        // Fallback to OR condition
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
          .maybeSingle();
          
        if (fallbackError) {
          console.error('Error finding conversation (fallback):', fallbackError);
          toast.error("Could not find conversation");
          return;
        }
        
        if (fallbackData) {
          console.log('Found existing conversation (fallback):', fallbackData.id);
          onOpenChange(false);
          navigate(`/messages/${fallbackData.id}`);
          return;
        }
      }
      
      if (data) {
        console.log('Found existing conversation (exact match):', data.id);
        onOpenChange(false);
        navigate(`/messages/${data.id}`);
      } else {
        toast.error("No conversation found");
      }
    } catch (err) {
      console.error('Error finding existing conversation:', err);
      toast.error("Failed to find conversation");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Search for a user to start a conversation with.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-md">
                <p className="text-sm">Error searching users: {error instanceof Error ? error.message : String(error)}</p>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center text-muted-foreground py-8">
                Type at least 2 characters to search
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    disabled={isCreating}
                    onClick={() => handleStartConversation(user.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-10 w-10">
                        {user.avatar_url && (
                          <AvatarImage 
                            src={user.avatar_url} 
                            alt={user.username || 'User'} 
                          />
                        )}
                        <AvatarFallback>
                          {user.full_name?.charAt(0) || 
                           user.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="text-left flex-1">
                        <p className="font-medium text-foreground">
                          {user.full_name || user.username || 'Unknown User'}
                        </p>
                        {user.username && (
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        )}
                      </div>
                      
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No users found
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog;

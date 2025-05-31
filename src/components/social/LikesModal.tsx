
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

interface LikeWithUser {
  id: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const LikesModal = ({ isOpen, onClose, postId }: LikesModalProps) => {
  const { data: likes, isLoading, error } = useQuery({
    queryKey: ['post-likes', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          user_id,
          created_at,
          profiles!user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our expected structure
      return data?.map(like => ({
        id: like.id,
        user_id: like.user_id,
        created_at: like.created_at,
        user: like.profiles || {
          full_name: null,
          username: null,
          avatar_url: null
        }
      })) as LikeWithUser[];
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Likes
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load likes</p>
            </div>
          ) : !likes || likes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No likes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {likes.map((like) => (
                <div key={like.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {like.user?.avatar_url && (
                      <AvatarImage src={like.user.avatar_url} alt={like.user.full_name || 'User'} />
                    )}
                    <AvatarFallback>
                      {like.user?.full_name?.charAt(0) || 
                       like.user?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {like.user?.full_name || like.user?.username || 'Anonymous User'}
                    </p>
                    {like.user?.username && like.user?.full_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{like.user.username}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(like.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LikesModal;

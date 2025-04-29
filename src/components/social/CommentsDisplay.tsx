
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface CommentsDisplayProps {
  postId: string;
}

const CommentsDisplay = ({ postId }: CommentsDisplayProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(comment => comment.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        if (profilesError) {
          throw profilesError;
        }
        
        const profileMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            profileMap.set(profile.id, {
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            });
          });
        }
        
        const commentsWithAuthor = data.map(comment => ({
          ...comment,
          author: profileMap.get(comment.user_id) || null
        }));
        
        setComments(commentsWithAuthor);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Setup realtime subscription for new comments
    const channel = supabase
      .channel('public:comments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${postId}`
        }, 
        () => {
          fetchComments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {comments.map(comment => (
        <div key={comment.id} className="flex items-start space-x-3 pb-3 border-b">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {comment.author?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{comment.author?.full_name || 'Anonymous'}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentsDisplay;

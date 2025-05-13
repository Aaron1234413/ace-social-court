import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loading } from '@/components/ui/loading';
import { showErrorToast } from '@/components/ui/use-toast';
import CommentDisplay from '@/components/social/CommentDisplay';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: {
    id: string;
    full_name: string | null;
    username?: string | null;
    avatar_url: string | null;
  } | null;
};

interface CommentsDisplayProps {
  postId: string;
}

const CommentsDisplay = ({ postId }: CommentsDisplayProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedComments, setGroupedComments] = useState<{[key: string]: Comment[]}>({});

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);
        
        if (profilesError) {
          throw profilesError;
        }
        
        const profileMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            profileMap.set(profile.id, {
              id: profile.id,
              full_name: profile.full_name,
              username: profile.username,
              avatar_url: profile.avatar_url
            });
          });
        }
        
        const commentsWithAuthor = data.map(comment => ({
          ...comment,
          author: profileMap.get(comment.user_id) || null
        }));
        
        setComments(commentsWithAuthor);
        
        // Group comments by date for better organization
        const grouped: {[key: string]: Comment[]} = {};
        
        commentsWithAuthor.forEach(comment => {
          const date = new Date(comment.created_at).toLocaleDateString();
          if (!grouped[date]) {
            grouped[date] = [];
          }
          grouped[date].push(comment);
        });
        
        setGroupedComments(grouped);
      } else {
        setComments([]);
        setGroupedComments({});
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      setError(error.message || "Failed to load comments");
      showErrorToast("Error loading comments", "Please try again later");
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
    return <Loading variant="skeleton" count={2} text="Loading comments..." />;
  }

  if (error) {
    return (
      <Loading 
        variant="error" 
        error={{
          message: "Couldn't load comments",
          guidance: "There was a problem loading the comments. Please try again.",
          onRetry: fetchComments
        }}
      />
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  // If we have comments but no grouping (should not happen, but just in case)
  if (Object.keys(groupedComments).length === 0) {
    return (
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {comments.map(comment => (
          <CommentDisplay 
            key={comment.id} 
            comment={{
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              user: {
                id: comment.user_id,
                username: comment.author?.username || undefined,
                full_name: comment.author?.full_name || undefined,
                avatar_url: comment.author?.avatar_url || undefined
              }
            }} 
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      <Accordion type="multiple" className="w-full">
        {Object.entries(groupedComments).map(([date, dateComments], index) => (
          <AccordionItem key={date} value={date} className={index === 0 ? "border-t border-b" : "border-b"}>
            <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
              {date} ({dateComments.length})
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pb-2">
              {dateComments.map(comment => (
                <CommentDisplay 
                  key={comment.id} 
                  comment={{
                    id: comment.id,
                    content: comment.content,
                    created_at: comment.created_at,
                    user: {
                      id: comment.user_id,
                      username: comment.author?.username || undefined,
                      full_name: comment.author?.full_name || undefined,
                      avatar_url: comment.author?.avatar_url || undefined
                    }
                  }} 
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default CommentsDisplay;

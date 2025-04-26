
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import LikeButton from '@/components/social/LikeButton';
import CommentButton from '@/components/social/CommentButton';
import FollowButton from '@/components/social/FollowButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: {
    full_name: string | null;
    user_type: string | null;
  };
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles(full_name, user_type)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error("Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleShare = (postId: string) => {
    // For now, just log the share action
    console.log(`Shared post ${postId}`);
    toast.info("Share feature coming soon!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Home Feed</h1>
      
      {user ? (
        <>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <p className="text-lg">Welcome, {user.email}!</p>
            <p className="text-muted-foreground">
              This is your personalized feed. Connect with other players and coaches.
            </p>
          </div>
          
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">Loading posts...</div>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {post.author?.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold">{post.author?.full_name || 'Anonymous'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {post.author?.user_type === 'coach' ? 'Coach' : 'Player'} · {
                              new Date(post.created_at).toLocaleDateString()
                            }
                          </p>
                        </div>
                      </div>
                      {user.id !== post.user_id && (
                        <FollowButton userId={post.user_id} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="py-2">{post.content}</p>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <LikeButton postId={post.id} />
                    <CommentButton postId={post.id} />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-1"
                    >
                      <Share className="h-4 w-4" /> Share
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p>No feed items yet. Start connecting with other players!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-lg mb-4">Please log in to view your personalized feed</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default Feed;

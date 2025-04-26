
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
import CreatePostForm from '@/components/social/CreatePostForm';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  media_url?: string | null;
  media_type?: string | null; // Changed from 'image' | 'video' | null to string | null to match the database
  author?: {
    full_name: string | null;
    user_type: string | null;
  };
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      // First fetch just the posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      // Then fetch profile information for each post
      const postsWithAuthors = await Promise.all(
        postsData.map(async (post) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, user_type')
            .eq('id', post.user_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile for post:', profileError);
            return {
              ...post,
              author: {
                full_name: 'Unknown User',
                user_type: null
              }
            };
          }

          return {
            ...post,
            author: profileData
          };
        })
      );

      setPosts(postsWithAuthors);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleShare = (postId: string) => {
    // For now, just log the share action
    console.log(`Shared post ${postId}`);
    toast.info("Share feature coming soon!");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Home Feed</h1>
      
      {user ? (
        <>
          <div className="mb-6">
            <CreatePostForm onPostCreated={fetchPosts} />
          </div>
          
          <div className="space-y-4 md:space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2.5"></div>
                  <div className="h-10 bg-slate-200 rounded w-full mb-2.5"></div>
                  <div className="h-10 bg-slate-200 rounded w-full"></div>
                </div>
                <p className="mt-4 text-muted-foreground">Loading posts...</p>
              </div>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-2 p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {post.author?.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-sm md:text-base">{post.author?.full_name || 'Anonymous'}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">
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
                  <CardContent className="p-4 md:p-6">
                    {post.content && (
                      <p className="text-sm md:text-base break-words mb-4">{post.content}</p>
                    )}
                    
                    {post.media_url && (
                      <div className="rounded-lg overflow-hidden mt-2 border border-gray-100">
                        {post.media_type === 'image' ? (
                          <img 
                            src={post.media_url} 
                            alt="Post media" 
                            className="w-full object-contain max-h-80"
                          />
                        ) : post.media_type === 'video' ? (
                          <video 
                            src={post.media_url} 
                            controls 
                            className="w-full max-h-80"
                          />
                        ) : null}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t p-2 md:p-4 flex justify-between">
                    <LikeButton postId={post.id} />
                    <CommentButton postId={post.id} />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-1 text-xs md:text-sm"
                      aria-label="Share post"
                    >
                      <Share className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Share</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm md:text-base">No feed items yet. Start connecting with other players!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-100 rounded-lg p-6 md:p-8 text-center">
          <p className="text-base md:text-lg mb-4">Please log in to view your personalized feed</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default Feed;

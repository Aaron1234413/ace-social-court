
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Plus, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/profile/CreatePostModal";
import { PostActions } from "@/components/social/PostActions";
import { Post } from "@/types/post";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import LikeButton from "@/components/social/LikeButton";
import CommentButton from "@/components/social/CommentButton";

interface ProfileMediaGalleryProps {
  userId: string;
}

export const ProfileMediaGallery = ({ userId }: ProfileMediaGalleryProps) => {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const isOwnProfile = user?.id === userId;

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['profile-media', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Post[];
    }
  });

  const handlePostCreated = () => {
    refetch();
    setCreatePostModalOpen(false);
  };

  const handlePostUpdated = () => {
    refetch();
    setSelectedPost(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 md:gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    );
  }

  const mediaPosts = posts?.filter(post => post.media_url) || [];
  
  // For the carousel, show the first 5 media posts at most
  const featuredPosts = mediaPosts.slice(0, 5);
  // For the grid, show remaining posts
  const remainingPosts = mediaPosts.length > 5 ? mediaPosts.slice(5) : [];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Posts</h2>
        {isOwnProfile && (
          <Button 
            onClick={() => setCreatePostModalOpen(true)} 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        )}
      </div>

      {mediaPosts.length > 0 ? (
        <div className="space-y-6">
          {/* Featured carousel for the first few posts */}
          {featuredPosts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Featured</h3>
              <Carousel className="w-full">
                <CarouselContent>
                  {featuredPosts.map((post) => (
                    <CarouselItem key={post.id} className="md:basis-2/3 lg:basis-1/2">
                      <div 
                        className="relative aspect-video cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => setSelectedPost(post)}
                      >
                        {post.media_type === 'image' ? (
                          <img
                            src={post.media_url!}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : post.media_type === 'video' ? (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <Video className="w-8 h-8 text-muted-foreground" />
                          </div>
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          {post.content && (
                            <p className="text-white text-sm line-clamp-2">{post.content}</p>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4" />
                <CarouselNext className="hidden md:flex -right-4" />
              </Carousel>
            </div>
          )}

          {/* Grid layout for remaining posts */}
          {remainingPosts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">All Posts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 md:gap-2">
                {remainingPosts.map((post) => (
                  <button
                    key={post.id}
                    className="relative aspect-square group overflow-hidden rounded-md"
                    onClick={() => setSelectedPost(post)}
                  >
                    {post.media_type === 'image' ? (
                      <img
                        src={post.media_url!}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : post.media_type === 'video' ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Video className="w-6 h-6 text-muted-foreground" />
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
          {isOwnProfile ? (
            <>
              <div className="bg-muted rounded-full p-4 mb-3">
                <Image className="h-6 w-6 text-muted-foreground" />
              </div>
              <p>You haven't created any posts yet</p>
              <Button 
                onClick={() => setCreatePostModalOpen(true)} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                Create Your First Post
              </Button>
            </>
          ) : (
            <>
              <div className="bg-muted rounded-full p-4 mb-3">
                <Image className="h-6 w-6 text-muted-foreground" />
              </div>
              <p>No posts yet</p>
            </>
          )}
        </div>
      )}

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden w-[95vw] sm:w-auto">
          {selectedPost && (
            <div className="flex flex-col md:flex-row max-h-[90vh]">
              <div className="flex-1 bg-black flex items-center justify-center">
                {selectedPost?.media_type === 'image' ? (
                  <img
                    src={selectedPost.media_url!}
                    alt=""
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                ) : selectedPost?.media_type === 'video' ? (
                  <video
                    src={selectedPost.media_url!}
                    controls
                    className="max-w-full max-h-[80vh]"
                  />
                ) : null}
              </div>
              
              <div className="w-full md:w-96 flex flex-col bg-background">
                <div className="p-4 flex items-center justify-between border-b">
                  <h3 className="font-medium">Post Details</h3>
                  {isOwnProfile && (
                    <PostActions 
                      post={selectedPost} 
                      onEdit={handlePostUpdated}
                      onDelete={handlePostUpdated}
                    />
                  )}
                </div>
                
                {selectedPost?.content && (
                  <div className="p-4 flex-grow overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{selectedPost.content}</p>
                  </div>
                )}
                
                <div className="p-4 border-t flex items-center gap-2">
                  <LikeButton 
                    postId={selectedPost.id} 
                    postUserId={selectedPost.user_id}
                    postContent={selectedPost.content}
                  />
                  <CommentButton
                    postId={selectedPost.id}
                    postUserId={selectedPost.user_id}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreatePostModal 
        open={createPostModalOpen} 
        onOpenChange={setCreatePostModalOpen} 
        onPostCreated={handlePostCreated}
      />
    </>
  );
};

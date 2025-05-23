
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Plus, Image, ChevronLeft, ChevronRight, Play } from "lucide-react";
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
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface ProfileMediaGalleryProps {
  userId: string;
}

export const ProfileMediaGallery = ({ userId }: ProfileMediaGalleryProps) => {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const isOwnProfile = user?.id === userId;
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;

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
  
  // Pagination for the grid
  const totalPages = Math.ceil(mediaPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  // Skip the featuredPosts when they're displayed in the carousel
  const currentPosts = mediaPosts.slice(indexOfFirstPost, indexOfLastPost);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i} 
              onClick={() => paginate(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            isActive={currentPage === 1} 
            onClick={() => paginate(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Add ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Ensure we don't show first or last page (they're always shown)
      if (startPage === 1) startPage++;
      if (endPage === totalPages) endPage--;

      // Add pages in calculated range
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i} 
              onClick={() => paginate(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Add ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink 
              isActive={currentPage === totalPages} 
              onClick={() => paginate(totalPages)}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

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
        <div className="space-y-8">
          {/* Enhanced carousel for featured posts */}
          {featuredPosts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Featured</h3>
              <Carousel className="w-full">
                <CarouselContent>
                  {featuredPosts.map((post) => (
                    <CarouselItem key={post.id} className="md:basis-2/3 lg:basis-1/2">
                      <div 
                        className="relative aspect-video cursor-pointer overflow-hidden rounded-lg group"
                        onClick={() => setSelectedPost(post)}
                      >
                        {post.media_type === 'image' ? (
                          <img
                            src={post.media_url!}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-300"
                          />
                        ) : post.media_type === 'video' ? (
                          <>
                            <div className="h-full w-full bg-black/10 relative">
                              <video 
                                src={post.media_url!} 
                                className="h-full w-full object-cover"
                                muted
                              />
                              {/* Play button overlay that appears on hover */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  size="icon" 
                                  variant="secondary" 
                                  className="h-12 w-12 rounded-full bg-white/80 hover:bg-white shadow-lg"
                                >
                                  <Play className="h-6 w-6 text-gray-800 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          {post.content && (
                            <p className="text-white text-sm line-clamp-2 font-medium">{post.content}</p>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4 h-9 w-9 border-muted-foreground/20 bg-white/80 hover:bg-white" />
                <CarouselNext className="hidden md:flex -right-4 h-9 w-9 border-muted-foreground/20 bg-white/80 hover:bg-white" />
              </Carousel>
            </div>
          )}

          {/* Grid layout with improved pagination */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">All Posts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
              {currentPosts.map((post) => (
                <button
                  key={post.id}
                  className="relative aspect-square group overflow-hidden rounded-md"
                  onClick={() => setSelectedPost(post)}
                >
                  {post.media_type === 'image' ? (
                    <img
                      src={post.media_url!}
                      alt=""
                      className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                    />
                  ) : post.media_type === 'video' ? (
                    <div className="w-full h-full relative">
                      <video 
                        src={post.media_url!} 
                        className="w-full h-full object-cover"
                        muted
                      />
                      {/* Play button overlay that appears on hover */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    {post.content && (
                      <p className="text-white text-xs line-clamp-2">{post.content}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Improved pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                      className={cn(currentPage === 1 ? "opacity-50 pointer-events-none" : "")}
                    />
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                      className={cn(currentPage === totalPages ? "opacity-50 pointer-events-none" : "")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
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


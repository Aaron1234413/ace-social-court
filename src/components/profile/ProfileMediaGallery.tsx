
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Post {
  id: string;
  media_url: string | null;
  media_type: string | null;
  content: string;
  created_at: string;
}

interface ProfileMediaGalleryProps {
  userId: string;
}

export const ProfileMediaGallery = ({ userId }: ProfileMediaGalleryProps) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { data: posts, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No posts yet
      </div>
    );
  }

  const mediaPosts = posts.filter(post => post.media_url);

  return (
    <>
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {mediaPosts.map((post) => (
          <button
            key={post.id}
            className="relative aspect-square group"
            onClick={() => setSelectedPost(post)}
          >
            {post.media_type === 'image' ? (
              <img
                src={post.media_url!}
                alt=""
                className="w-full h-full object-cover"
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

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <div className="flex flex-col">
            {selectedPost?.media_type === 'image' ? (
              <img
                src={selectedPost.media_url!}
                alt=""
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            ) : selectedPost?.media_type === 'video' ? (
              <video
                src={selectedPost.media_url!}
                controls
                className="w-full h-auto max-h-[80vh]"
              />
            ) : null}
            {selectedPost?.content && (
              <div className="p-4 bg-background">
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

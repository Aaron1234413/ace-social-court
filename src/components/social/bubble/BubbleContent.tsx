
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Post } from '@/types/post';
import PostContent from '../PostContent';

interface BubbleContentProps {
  post: Post;
}

export function BubbleContent({ post }: BubbleContentProps) {
  return (
    <CardContent className="p-4 md:p-6">
      {post.content && (
        <PostContent 
          content={post.content}
          className="text-sm md:text-base break-words mb-4"
        />
      )}

      {post.media_url && (
      <div className="rounded-lg overflow-hidden mt-2 border border-muted/50 w-full shadow-sm hover:shadow-md transition-shadow">
        {post.media_type === 'image' ? (
          <img 
            src={post.media_url} 
            alt="Post media" 
            className="w-full object-contain max-h-[500px]"
            style={{ maxWidth: '100%' }}
          />
        ) : post.media_type === 'video' ? (
          <div className="w-full aspect-video">
            <video 
              src={post.media_url} 
              controls 
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
      </div>
    )}

    </CardContent>
  );
}

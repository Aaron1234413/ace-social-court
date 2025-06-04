
import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import LikeButton from '../LikeButton';
import CommentButton from '../CommentButton';
import ShareButton from '../ShareButton';

interface BubbleFooterProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
}

export function BubbleFooter({ post, currentUserId, contentType }: BubbleFooterProps) {
  // For ambassador posts, we might want to show different interactions
  const showFullInteractions = contentType !== 'ambassador' || post.privacy_level === 'public';

  return (
    <CardFooter className="border-t p-2 md:p-4 flex justify-between bg-muted/10">
      <LikeButton 
        postId={post.id} 
        postUserId={post.user_id} 
        postContent={post.content}
        disabled={!showFullInteractions && !currentUserId}
      />
      
      <CommentButton 
        postId={post.id} 
        postUserId={post.user_id}
        disabled={!showFullInteractions && !currentUserId}
      />
      
      <ShareButton 
        postId={post.id} 
        postContent={post.content}
        disabled={contentType === 'ambassador'}
      />
    </CardFooter>
  );
}


import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import LikeButton from '../LikeButton';
import CommentButton from '../CommentButton';
import ShareButton from '../ShareButton';
import { ReactionBar } from '../ReactionBar';

interface BubbleFooterProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
}

export function BubbleFooter({ post, currentUserId, contentType }: BubbleFooterProps) {
  const isAmbassadorContent = contentType === 'ambassador' || post.is_ambassador_content;

  return (
    <CardFooter className="border-t p-2 md:p-4 space-y-3">
      {/* New Reaction Bar */}
      <ReactionBar
        postId={post.id}
        postUserId={post.user_id}
        postContent={post.content}
        privacyLevel={post.privacy_level}
        isAmbassadorContent={isAmbassadorContent}
        authorUserType={post.author?.user_type || undefined}
        className="w-full"
      />
      
      {/* Traditional Engagement Actions */}
      <div className="flex justify-between w-full border-t pt-3">
        <LikeButton 
          postId={post.id} 
          postUserId={post.user_id} 
          postContent={post.content}
        />
        
        <CommentButton 
          postId={post.id} 
          postUserId={post.user_id}
        />
        
        <ShareButton 
          postId={post.id} 
          postContent={post.content}
        />
      </div>
    </CardFooter>
  );
}

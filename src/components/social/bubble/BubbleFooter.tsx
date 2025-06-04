
import React from 'react';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
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
    <div className="bubble-footer">
      {/* Reaction buttons */}
      <div className="flex items-center gap-2">
        <ReactionBar
          postId={post.id}
          postUserId={post.user_id}
          postContent={post.content}
          privacyLevel={post.privacy_level}
          isAmbassadorContent={isAmbassadorContent}
          authorUserType={post.author?.user_type || undefined}
          compact={true}
        />
      </div>
      
      {/* Comment and Share buttons */}
      <CommentButton 
        postId={post.id} 
        postUserId={post.user_id}
        size="sm"
        variant="ghost"
        className="comment-count"
      />
      
      <ShareButton 
        postId={post.id} 
        postContent={post.content}
        className="share-link"
      />
    </div>
  );
}

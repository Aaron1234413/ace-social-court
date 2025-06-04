
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import { ReactionBar } from '../ReactionBar';
import CommentButton from '../CommentButton';
import ShareButton from '../ShareButton';
import { PostPrompt } from '../PostPrompt';

interface BubbleFooterProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
  onCommentSubmit?: (comment: string) => void;
}

export function BubbleFooter({ post, currentUserId, contentType, onCommentSubmit }: BubbleFooterProps) {
  return (
    <CardContent className="pt-0 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <ReactionBar post={post} className="flex-1" />
        
        <div className="flex items-center gap-3 ml-4">
          <CommentButton 
            postId={post.id} 
            postUserId={post.user_id}
          />
          <ShareButton postId={post.id} />
        </div>
      </div>

      {/* Context-Aware Prompt */}
      <PostPrompt 
        post={post}
        onCommentSubmit={onCommentSubmit}
        className="mt-3"
      />
    </CardContent>
  );
}

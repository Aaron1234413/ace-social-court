
import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import LikeButton from '../LikeButton';
import CommentButton from '../CommentButton';
import ShareButton from '../ShareButton';
import { ReactionBar } from '../ReactionBar';
import { ContextPrompts } from '../ContextPrompts';

interface BubbleFooterProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
}

export function BubbleFooter({ post, currentUserId, contentType }: BubbleFooterProps) {
  const isAmbassadorContent = contentType === 'ambassador' || post.is_ambassador_content;

  return (
    <CardFooter className="p-3 space-y-3 bg-white border-t border-gray-100">
      {/* Unified Engagement Row - Reactions + Traditional Actions */}
      <div className="flex items-center justify-between w-full">
        {/* Reaction Bar - Compact inline version */}
        <div className="flex items-center gap-2">
          <ReactionBar
            postId={post.id}
            postUserId={post.user_id}
            postContent={post.content}
            privacyLevel={post.privacy_level}
            isAmbassadorContent={isAmbassadorContent}
            authorUserType={post.author?.user_type || undefined}
            className="border-0 bg-transparent p-0 gap-1"
            compact={true}
          />
        </div>
        
        {/* Traditional Actions - Right aligned */}
        <div className="flex items-center gap-1">
          <LikeButton 
            postId={post.id} 
            postUserId={post.user_id} 
            postContent={post.content}
            size="sm"
            variant="ghost"
          />
          
          <CommentButton 
            postId={post.id} 
            postUserId={post.user_id}
            size="sm"
            variant="ghost"
          />
          
          <ShareButton 
            postId={post.id} 
            postContent={post.content}
          />
        </div>
      </div>
      
      {/* Context-Aware Prompts - Cleaner, more compact */}
      <div className="w-full">
        <ContextPrompts
          context={{
            post,
            postContent: post.content,
            isAmbassadorContent,
          }}
          onPromptClick={(prompt) => {
            console.log('Engagement prompt clicked:', prompt);
          }}
          className="w-full"
          compact={true}
        />
      </div>
    </CardFooter>
  );
}

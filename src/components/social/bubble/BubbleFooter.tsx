
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
    <CardFooter className="border-t p-4 space-y-4 bg-white">
      {/* New Reaction Bar - Now with better styling */}
      <div className="w-full">
        <ReactionBar
          postId={post.id}
          postUserId={post.user_id}
          postContent={post.content}
          privacyLevel={post.privacy_level}
          isAmbassadorContent={isAmbassadorContent}
          authorUserType={post.author?.user_type || undefined}
          className="w-full"
        />
      </div>
      
      {/* Traditional Engagement Actions - Better spacing and layout */}
      <div className="flex items-center justify-between w-full pt-3 border-t border-gray-100">
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
      
      {/* Context-Aware Prompts - Now properly contained */}
      <div className="w-full pt-3 border-t border-gray-100">
        <ContextPrompts
          context={{
            post,
            postContent: post.content,
            isAmbassadorContent,
          }}
          onPromptClick={(prompt) => {
            // Could trigger comment modal or other engagement actions
            console.log('Engagement prompt clicked:', prompt);
          }}
          className="w-full"
        />
      </div>
    </CardFooter>
  );
}

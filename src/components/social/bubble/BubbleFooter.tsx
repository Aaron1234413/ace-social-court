
import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import CommentButton from '../CommentButton';
import ShareButton from '../ShareButton';
import { ReactionBar } from '../ReactionBar';
import { ContextPrompts } from '../ContextPrompts';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown } from 'lucide-react';

interface BubbleFooterProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
}

export function BubbleFooter({ post, currentUserId, contentType }: BubbleFooterProps) {
  const isAmbassadorContent = contentType === 'ambassador' || post.is_ambassador_content;

  return (
    <CardFooter className="p-2 space-y-2 bg-white border-t border-gray-100">
      {/* Ambassador Badge - Prominent placement */}
      {isAmbassadorContent && (
        <div className="w-full flex justify-center">
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200 text-xs px-2 py-1">
            <Crown className="h-3 w-3 mr-1" />
            Expert Content
          </Badge>
        </div>
      )}

      {/* Main Engagement Row - Properly spaced to prevent overlap */}
      <div className="flex items-center justify-between w-full min-h-[36px]">
        {/* Reaction Bar - Primary engagement */}
        <div className="flex items-center flex-1 min-w-0">
          <ReactionBar
            postId={post.id}
            postUserId={post.user_id}
            postContent={post.content}
            privacyLevel={post.privacy_level}
            isAmbassadorContent={isAmbassadorContent}
            authorUserType={post.author?.user_type || undefined}
            className="border-0 bg-transparent p-0"
            compact={true}
          />
        </div>
        
        {/* Secondary Actions - Fixed positioning to prevent overlap */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
      
      {/* Context-Aware Prompts - Compact but visible */}
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

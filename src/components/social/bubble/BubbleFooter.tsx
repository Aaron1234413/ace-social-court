
import React from 'react';
import { Post } from '@/types/post';
import { CardFooter } from '@/components/ui/card';
import LikeButton from '../LikeButton';
import CommentButton from '../CommentButton';
import ShareButton from '../ShareButton';

interface BubbleFooterProps {
  post: Post;
  currentUserId?: string;
}

export function BubbleFooter({ post, currentUserId }: BubbleFooterProps) {
  return (
    <CardFooter className="border-t p-2 md:p-4 flex justify-between bg-muted/10">
      <LikeButton postId={post.id} postUserId={post.user_id} postContent={post.content} />
      <CommentButton postId={post.id} postUserId={post.user_id} />
      <ShareButton postId={post.id} postContent={post.content} />
    </CardFooter>
  );
}

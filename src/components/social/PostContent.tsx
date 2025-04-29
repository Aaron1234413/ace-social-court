
import React from 'react';
import { formatTextWithMentions } from '@/utils/mentionUtils';

interface PostContentProps {
  content: string;
  className?: string;
}

const PostContent: React.FC<PostContentProps> = ({ content, className = '' }) => {
  const formattedContent = formatTextWithMentions(content);
  
  return (
    <div className={className}>
      {formattedContent}
    </div>
  );
};

export default PostContent;

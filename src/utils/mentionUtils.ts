
import { Link } from 'react-router-dom';
import React from 'react';

/**
 * Parses text for @mentions and converts them to clickable links
 * @param text The text content to parse for mentions
 * @returns React elements with mentions converted to links
 */
export const formatTextWithMentions = (text: string): React.ReactNode => {
  if (!text) return '';

  // Regular expression to match @username mentions
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  
  // Split the text by mentions
  const parts = text.split(mentionRegex);
  
  // Find all mentions
  const mentions = text.match(mentionRegex) || [];
  
  // If no mentions found, return the original text
  if (mentions.length === 0) {
    return text;
  }
  
  // Combine parts with mention links
  const result: React.ReactNode[] = [];
  
  parts.forEach((part, index) => {
    // Add the text part
    if (part) {
      result.push(part);
    }
    
    // Add the mention link (if any)
    if (index < mentions.length) {
      const username = mentions[index].substring(1); // Remove @ sign
      result.push(
        <Link 
          key={`mention-${index}`}
          to={`/profile/${username}`}
          className="font-medium text-primary hover:underline"
        >
          @{username}
        </Link>
      );
    }
  });
  
  return result;
};

/**
 * Function to extract usernames from mentions in a given text
 * @param text The text to extract mentions from
 * @returns Array of usernames mentioned
 */
export const extractMentions = (text: string): string[] => {
  if (!text) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = text.match(mentionRegex) || [];
  
  return mentions.map(mention => mention.substring(1));
};

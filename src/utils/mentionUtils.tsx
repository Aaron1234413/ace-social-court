
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Parses text for @mentions and converts them to clickable links
 * @param text The text content to parse for mentions
 * @returns React elements with mentions converted to links
 */
export const formatTextWithMentions = (text: string): React.ReactNode => {
  if (!text) return '';

  // Regular expression to match @username mentions
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  
  // Find all matches
  const matches = Array.from(text.matchAll(mentionRegex));
  
  // If no mentions found, return the original text
  if (matches.length === 0) {
    return text;
  }
  
  // Build the result with mentions as links
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  matches.forEach((match, index) => {
    const matchIndex = match.index!;
    const username = match[1]; // The captured group (without @)
    
    // Add text before the mention
    if (matchIndex > lastIndex) {
      result.push(text.substring(lastIndex, matchIndex));
    }
    
    // Add the mention link
    result.push(
      <Link 
        key={`mention-${index}`}
        to={`/profile/${username}`}
        className="font-medium text-primary hover:underline"
      >
        @{username}
      </Link>
    );
    
    // Update lastIndex to after this mention
    lastIndex = matchIndex + match[0].length;
  });
  
  // Add any text after the last mention
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }
  
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
  const matches = Array.from(text.matchAll(mentionRegex));
  
  return matches.map(match => match[1]); // Return the captured group (without @)
};

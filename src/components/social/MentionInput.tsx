
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  minRows?: number;
  maxRows?: number;
}

interface UserSuggestion {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write something...',
  autoFocus = false,
  minRows = 2,
  maxRows = 4
}) => {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [caretPosition, setCaretPosition] = useState<{ top: number, left: number, bottom: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // Query users for mention suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['mention-suggestions', mentionQuery],
    queryFn: async () => {
      if (!mentionQuery && mentionQuery !== '') return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${mentionQuery}%,full_name.ilike.%${mentionQuery}%`)
        .limit(5);
        
      if (error) {
        console.error('Error fetching user suggestions:', error);
        return [];
      }
      
      return data as UserSuggestion[];
    },
    enabled: mentionQuery !== null,
  });

  // Handle keydown events to detect @ character and navigate suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@') {
      updateCaretPosition();
      setMentionQuery('');
    } else if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Escape' && mentionQuery !== null) {
      setMentionQuery(null);
    } else if (
      mentionQuery !== null && 
      suggestions && 
      suggestions.length > 0
    ) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(suggestions[selectedSuggestionIndex]);
      }
    }
  };

  // Calculate caret position for mention popup
  const updateCaretPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const caretIndex = textarea.selectionStart;
    const textBeforeCaret = textarea.value.substring(0, caretIndex);
    
    // Create a temporary element to calculate position
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.top = '0';
    temp.style.left = '0';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'pre-wrap';
    temp.style.width = getComputedStyle(textarea).width;
    temp.style.font = getComputedStyle(textarea).font;
    temp.style.padding = getComputedStyle(textarea).padding;
    
    // Replace new lines with <br> to correctly calculate height
    temp.innerHTML = textBeforeCaret.replace(/\n/g, '<br>');
    
    document.body.appendChild(temp);
    
    const rect = textarea.getBoundingClientRect();
    const tempRect = temp.getBoundingClientRect();
    
    // Calculate position
    const top = rect.top + tempRect.height - textarea.scrollTop;
    const left = rect.left + temp.offsetWidth;
    
    document.body.removeChild(temp);
    
    setCaretPosition({ 
      top, 
      left,
      bottom: window.innerHeight - top
    });
  };

  // Handle text change and detect mentions
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    
    // Find the last @ symbol in the text before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if there's a space between the @ and the cursor
      const textBetweenAtAndCursor = textBeforeCursor.substring(lastAtIndex + 1);
      
      // If there's a space or newline, we're not in a mention
      if (textBetweenAtAndCursor.includes(' ') || textBetweenAtAndCursor.includes('\n')) {
        setMentionQuery(null);
      } else {
        // Extract the mention query (text after @)
        const query = textBetweenAtAndCursor;
        setMentionQuery(query);
        updateCaretPosition();
        setSelectedSuggestionIndex(0); // Reset selection when query changes
      }
    } else {
      setMentionQuery(null);
    }
  };

  // Insert a mention at the current cursor position
  const insertMention = (user: UserSuggestion) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the last @ symbol in the text before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Create new text with the mention
      const username = user.username || user.id;
      const textBeforeMention = value.substring(0, lastAtIndex);
      const newText = `${textBeforeMention}@${username} ${textAfterCursor}`;
      
      // Update the textarea
      onChange(newText);
      
      // Reset mention query
      setMentionQuery(null);
      
      // Set cursor position after the inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastAtIndex + username.length + 2; // +2 for @ and space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  // Close mention suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(event.target as Node)) {
        setMentionQuery(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Adjust textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;
      
      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [value, minRows, maxRows]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="resize-none overflow-hidden"
        autoFocus={autoFocus}
      />
      
      {/* Mention suggestions popup */}
      {mentionQuery !== null && caretPosition && (
        <div 
          ref={mentionMenuRef}
          className="absolute z-10 bg-popover border rounded-md shadow-md w-64 max-h-60 overflow-y-auto"
          style={{
            top: caretPosition.bottom > 300 ? 'auto' : caretPosition.top,
            bottom: caretPosition.bottom > 300 ? caretPosition.bottom : 'auto',
            left: caretPosition.left
          }}
        >
          {isLoading ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              Loading suggestions...
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((user, index) => (
                <button
                  key={user.id}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-left ${
                    index === selectedSuggestionIndex ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => insertMention(user)}
                >
                  <Avatar className="h-5 w-5">
                    {user.avatar_url && (
                      <img src={user.avatar_url} alt={user.username || 'User'} />
                    )}
                    <AvatarFallback className="text-xs">
                      {(user.username?.charAt(0) || 
                        user.full_name?.charAt(0) || 
                        'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {user.username || user.full_name || 'User'}
                  </span>
                  {user.username && user.full_name && (
                    <span className="text-xs text-muted-foreground ml-1">
                      {user.full_name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 text-center text-sm text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionInput;

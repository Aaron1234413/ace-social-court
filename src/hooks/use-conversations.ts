
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Conversation } from '@/components/messages/types';

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<{message: string} | null>(null);

  const { data: conversations, isLoading: isLoadingConversations, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];

      try {
        console.log("Fetching conversations for user:", user.id);
        
        // Get all conversations where current user is either user1 or user2
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          setError({ message: conversationsError.message });
          return [];
        }

        // For each conversation, get the other user's profile
        const conversationsWithProfiles = await Promise.all(
          conversationsData.map(async (conversation) => {
            const otherUserId = conversation.user1_id === user.id
              ? conversation.user2_id
              : conversation.user1_id;

            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', otherUserId)
              .single();

            if (profileError) {
              console.error('Error fetching profile for user:', otherUserId, profileError);
              return {
                ...conversation,
                other_user: { 
                  id: otherUserId,
                  username: 'Unknown User',
                  full_name: null,
                  avatar_url: null 
                },
                last_message: null
              };
            }

            // Also get the last message for this conversation
            const { data: lastMessageData, error: messageError } = await supabase
              .from('direct_messages')
              .select('*')
              .or(`and(sender_id.eq.${conversation.user1_id},recipient_id.eq.${conversation.user2_id}),and(sender_id.eq.${conversation.user2_id},recipient_id.eq.${conversation.user1_id})`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (messageError) {
              console.error('Error fetching last message:', messageError);
            }

            return {
              ...conversation,
              other_user: profileData,
              last_message: lastMessageData || null
            };
          })
        );

        console.log("Fetched conversations with profiles:", conversationsWithProfiles.length);
        return conversationsWithProfiles as Conversation[];
      } catch (error) {
        console.error('Unexpected error in useConversations:', error);
        setError({ message: error instanceof Error ? error.message : 'Failed to load conversations' });
        return [];
      }
    },
    enabled: !!user,
    meta: {
      onError: (error: Error) => {
        console.error('Error in useConversations query:', error);
        setError({ message: error.message });
      }
    },
    retry: 2,
    staleTime: 30000, // Increase stale time to 30 seconds to reduce network requests
    gcTime: 300000, // Cache for 5 minutes
  });

  return {
    conversations: conversations || [],
    isLoadingConversations,
    error,
    refetch
  };
};

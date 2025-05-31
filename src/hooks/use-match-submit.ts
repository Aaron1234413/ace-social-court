
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { MatchData } from '@/components/logging/match/MatchLogger';

export function useMatchSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile } = useAuth();

  const submitMatch = async (matchData: MatchData) => {
    if (!user) {
      throw new Error('User must be logged in to submit a match');
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting match data:', matchData);
      
      // Prepare match data for database
      const matchRecord = {
        user_id: user.id,
        match_date: matchData.match_date.toISOString().split('T')[0], // Convert to date string
        opponent_id: matchData.opponent_id || null,
        surface: matchData.surface,
        location: matchData.location,
        score: matchData.score,
        serve_rating: matchData.serve_rating,
        return_rating: matchData.return_rating,
        endurance_rating: matchData.endurance_rating,
        highlights: matchData.highlights || [],
        energy_emoji: matchData.energy_emoji,
        focus_emoji: matchData.focus_emoji,
        emotion_emoji: matchData.emotion_emoji,
        tags: matchData.tags || [],
        reflection_note: matchData.reflection_note,
        media_url: matchData.media_url,
        media_type: matchData.media_type,
        notify_coach: matchData.notify_coach || false,
        coach_id: matchData.coach_id || null
      };

      // Insert match record
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert([matchRecord])
        .select()
        .single();

      if (matchError) {
        console.error('Error inserting match:', matchError);
        throw matchError;
      }

      console.log('Match inserted successfully:', match);

      // If coach notification is enabled and we have a coach, create notification
      if (matchData.notify_coach && matchData.coach_id) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{
            user_id: matchData.coach_id,
            sender_id: user.id,
            type: 'match_logged',
            content: `${profile?.full_name || profile?.username || 'A student'} logged a new match`,
            entity_type: 'match',
            entity_id: match.id
          }]);

        if (notificationError) {
          console.error('Error creating coach notification:', notificationError);
          // Don't throw here - match was still created successfully
        } else {
          console.log('Coach notification created successfully');
        }
      }

      return match;
    } catch (error) {
      console.error('Error in submitMatch:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitMatch,
    isSubmitting
  };
}

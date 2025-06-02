
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { MatchFormValues } from '@/components/logging/match/matchSchema';
import { toast } from 'sonner';

// Match data interface that extends the schema for internal use
export interface MatchData extends Partial<MatchFormValues> {
  match_date: Date;
  serve_rating?: number;
  return_rating?: number;
  endurance_rating?: number;
}

export function useMatchSubmit() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const matchMutation = useMutation({
    mutationFn: async (matchData: MatchData) => {
      if (!user) {
        throw new Error('User must be logged in to submit a match');
      }

      console.log('🎾 Starting match submission:', matchData);
      
      const assignedCoachId = profile?.assigned_coach_id || null;
      console.log('📋 Assigned coach ID:', assignedCoachId);
      
      const matchRecord = {
        user_id: user.id,
        match_date: matchData.match_date.toISOString().split('T')[0],
        opponent_id: matchData.opponent_id || null,
        surface: matchData.surface,
        surface_type: matchData.surface,
        location: matchData.location,
        score: matchData.score,
        serve_rating: matchData.serve_rating,
        return_rating: matchData.return_rating,
        endurance_rating: matchData.endurance_rating,
        highlights: matchData.highlights || [],
        energy_emoji: matchData.energy_emoji,
        energy_emoji_type: matchData.energy_emoji,
        focus_emoji: matchData.focus_emoji,
        focus_emoji_type: matchData.focus_emoji,
        emotion_emoji: matchData.emotion_emoji,
        emotion_emoji_type: matchData.emotion_emoji,
        tags: matchData.tags || [],
        reflection_note: matchData.reflection_note,
        notify_coach: matchData.notify_coach || false,
        coach_id: matchData.coach_id || assignedCoachId
      };

      console.log('💾 Prepared match record for database:', matchRecord);

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert([matchRecord])
        .select()
        .single();

      if (matchError) {
        console.error('❌ Error inserting match:', matchError);
        throw matchError;
      }

      console.log('✅ Match inserted successfully:', match);

      const shouldNotifyCoach = matchData.notify_coach && (matchData.coach_id || assignedCoachId);
      console.log('🔔 Coach notification check:', {
        notify_coach: matchData.notify_coach,
        coach_id: matchData.coach_id,
        assignedCoachId,
        shouldNotifyCoach
      });

      if (shouldNotifyCoach) {
        const coachId = matchData.coach_id || assignedCoachId;
        console.log('📤 Creating coach notification for coach:', coachId);
        
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{
            user_id: coachId,
            sender_id: user.id,
            type: 'match_logged',
            content: `${profile?.full_name || profile?.username || 'A student'} logged a new match`,
            entity_type: 'match',
            entity_id: match.id
          }]);

        if (notificationError) {
          console.error('❌ Error creating coach notification:', notificationError);
        } else {
          console.log('✅ Coach notification created successfully');
        }
      } else {
        console.log('🔕 No coach notification needed');
      }

      console.log('🎉 Match submission completed successfully!');
      return match;
    },
    onSuccess: () => {
      console.log('🎉 Match mutation completed successfully');
      // Invalidate all relevant queries to trigger real-time updates
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-matches-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activity-ranking'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-current-streak'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-weekly-progress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-activities'] });
      toast.success("Match logged successfully!");
    },
    onError: (error) => {
      console.error('💥 Match submission error:', error);
      toast.error(`Failed to save match: ${error.message}`);
    }
  });

  const submitMatch = async (data: MatchData) => {
    setIsSubmitting(true);
    try {
      return await matchMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitMatch,
    isSubmitting
  };
}

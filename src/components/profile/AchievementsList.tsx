
import { useAuth } from '@/components/AuthProvider';
import { Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AchievementsListProps {
  userId: string;
}

export const AchievementsList = ({ userId }: AchievementsListProps) => {
  const { data: achievements } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('date_achieved', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (!achievements?.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Award className="h-5 w-5" />
        Achievements
      </h2>
      <div className="grid gap-3">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="border rounded-lg p-3">
            <h3 className="font-medium">{achievement.title}</h3>
            {achievement.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {achievement.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

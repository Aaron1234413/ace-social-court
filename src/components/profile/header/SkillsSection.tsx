
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SkillProgressBar } from './SkillProgressBar';

interface SkillsSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

export const SkillsSection = ({ userId, isOwnProfile }: SkillsSectionProps) => {
  // Query skill ratings from matches
  const { data: skillRatings } = useQuery({
    queryKey: ['skill-ratings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('serve_rating, return_rating, endurance_rating')
        .eq('user_id', userId)
        .order('match_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Calculate average ratings from recent matches
      const avgRatings = {
        serve: 0,
        return: 0,
        endurance: 0,
        forehand: Math.floor(Math.random() * 5) + 1, // Placeholder for demo
        backhand: Math.floor(Math.random() * 5) + 1, // Placeholder for demo
      };
      
      if (data && data.length > 0) {
        let serveSum = 0;
        let returnSum = 0;
        let enduranceSum = 0;
        let count = 0;
        
        data.forEach(match => {
          if (match.serve_rating) {
            serveSum += match.serve_rating;
            count++;
          }
          if (match.return_rating) {
            returnSum += match.return_rating;
          }
          if (match.endurance_rating) {
            enduranceSum += match.endurance_rating;
          }
        });
        
        if (count > 0) {
          avgRatings.serve = Math.round(serveSum / count);
          avgRatings.return = Math.round(returnSum / count);
          avgRatings.endurance = Math.round(enduranceSum / count);
        }
      }
      
      return avgRatings;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg mb-4">Skills Progress</h2>
        <div className="space-y-4">
          <SkillProgressBar 
            label="Serve" 
            value={skillRatings?.serve || 0} 
            maxValue={5}
            color="bg-green-500"
          />
          <SkillProgressBar 
            label="Return" 
            value={skillRatings?.return || 0} 
            maxValue={5}
            color="bg-blue-500"
          />
          <SkillProgressBar 
            label="Forehand" 
            value={skillRatings?.forehand || 0} 
            maxValue={5}
            color="bg-purple-500"
          />
          <SkillProgressBar 
            label="Backhand" 
            value={skillRatings?.backhand || 0} 
            maxValue={5}
            color="bg-red-500"
          />
          <SkillProgressBar 
            label="Endurance" 
            value={skillRatings?.endurance || 0} 
            maxValue={5}
            color="bg-yellow-500"
          />
        </div>
        
        {isOwnProfile && (
          <div className="mt-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Full Stats
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

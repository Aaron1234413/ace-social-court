
import { useAuth } from '@/components/AuthProvider';
import { Award, ChevronDown, ChevronUp, Star, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useState } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AchievementsListProps {
  userId: string;
}

export const AchievementsList = ({ userId }: AchievementsListProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const isOwnProfile = user?.id === userId;

  const { data: achievements, isLoading } = useQuery({
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

  if (isLoading) {
    return null;
  }

  if (!achievements?.length) return null;

  // Show a limited number when collapsed
  const displayedAchievements = isExpanded ? achievements : achievements.slice(0, 3);
  const hasMoreAchievements = achievements.length > 3;
  
  // Helper function to get an icon based on achievement title
  const getAchievementIcon = (title: string) => {
    const lowercaseTitle = title.toLowerCase();
    if (lowercaseTitle.includes('winner') || lowercaseTitle.includes('champion')) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    } else if (lowercaseTitle.includes('top') || lowercaseTitle.includes('best')) {
      return <Star className="h-5 w-5 text-yellow-500" />;
    }
    return <Award className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          {displayedAchievements.map((achievement) => (
            <AccordionItem 
              key={achievement.id} 
              value={achievement.id}
              className="border border-muted rounded-md mb-3 last:mb-0 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                <div className="flex items-center gap-3 text-left">
                  {getAchievementIcon(achievement.title)}
                  <div>
                    <div className="font-medium">{achievement.title}</div>
                    {achievement.date_achieved && (
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(achievement.date_achieved), 'MMMM yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-1 pb-3">
                {achievement.description && (
                  <p className="text-sm text-muted-foreground ml-8">
                    {achievement.description}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {hasMoreAchievements && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 text-sm flex items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show all {achievements.length} achievements <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
};


import { useAuth } from '@/components/AuthProvider';
import { Award, ChevronDown, ChevronUp, Star, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface AchievementsListProps {
  userId: string;
}

export const AchievementsList = ({ userId }: AchievementsListProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const isOwnProfile = user?.id === userId;
  const timelineRef = useRef<HTMLDivElement>(null);

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

  // Track which achievements are visible for animations
  const [visibleAchievements, setVisibleAchievements] = useState<Record<string, boolean>>({});

  // Set up intersection observer for scroll animations
  useEffect(() => {
    if (!achievements?.length || !timelineRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleAchievements(prev => ({
            ...prev,
            [entry.target.id]: true
          }));
        }
      });
    }, { 
      threshold: 0.2,
      rootMargin: "0px 0px -100px 0px"
    });

    // Observe all timeline items
    const timelineItems = timelineRef.current.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => observer.observe(item));

    return () => {
      timelineItems.forEach(item => observer.unobserve(item));
    };
  }, [achievements, isExpanded]);

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
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div 
          className="relative timeline-container ml-4 pr-2" 
          ref={timelineRef}
        >
          {/* Vertical timeline line */}
          <div className="absolute left-5 top-1.5 bottom-10 w-0.5 bg-primary/20 rounded-full" />
          
          {/* Achievement timeline cards */}
          <div className="space-y-8">
            {displayedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                id={`achievement-${achievement.id}`}
                className={`timeline-item relative pl-12 ${index % 2 === 0 ? 'timeline-right' : 'timeline-left'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={visibleAchievements[`achievement-${achievement.id}`] ? 
                  { opacity: 1, y: 0 } : 
                  { opacity: 0, y: 20 }
                }
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Timeline dot/icon */}
                <div className="absolute left-0 rounded-full p-2.5 bg-background border-2 border-primary/50 flex items-center justify-center z-10">
                  {getAchievementIcon(achievement.title)}
                </div>
                
                {/* Achievement card */}
                <Card className={`border shadow-sm overflow-hidden transition-all hover:shadow-md w-full md:w-[calc(100%-24px)]`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{achievement.title}</h3>
                      {achievement.date_achieved && (
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(achievement.date_achieved), 'MMMM yyyy')}
                        </Badge>
                      )}
                    </div>
                    
                    {achievement.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {achievement.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Show more/less button */}
          {hasMoreAchievements && (
            <div className="mt-6 text-center relative z-10">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-sm text-primary font-medium"
              >
                {isExpanded ? (
                  <>Show less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>Show all {achievements.length} achievements <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

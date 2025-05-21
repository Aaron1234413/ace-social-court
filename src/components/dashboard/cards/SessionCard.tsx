
import React from 'react';
import { format } from 'date-fns';
import { Session } from '@/types/logging';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, ListChecks, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  session: Session;
  isCoach: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, isCoach }) => {
  const formattedDate = session.session_date ? 
    format(new Date(session.session_date), 'PPP') : 
    'Unknown date';
  
  const completedSteps = session.next_steps?.filter(step => step.completed).length || 0;
  const totalSteps = session.next_steps?.length || 0;
  const stepProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  // Get first letter of coach name for avatar fallback
  const getCoachInitial = () => {
    if (session.coach?.username) return session.coach.username[0].toUpperCase();
    if (session.coach?.full_name) return session.coach.full_name[0].toUpperCase();
    return 'C';
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Left sidebar with session type indicator */}
          <div className="w-2 bg-tennis-clay" />
          
          {/* Main content */}
          <div className="p-4 flex-grow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{formattedDate}</span>
              </div>
              {session.reminder_date && (
                <Badge variant="outline" className="bg-tennis-highlight/10 border-tennis-highlight text-tennis-highlight">
                  Reminder: {format(new Date(session.reminder_date), 'MMM d')}
                </Badge>
              )}
            </div>
            
            {!isCoach && session.coach && (
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.coach.avatar_url || ''} alt={session.coach.username || 'Coach'} />
                  <AvatarFallback>{getCoachInitial()}</AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-medium">
                    Coach: {session.coach?.username || session.coach?.full_name || 'Unknown coach'}
                  </h3>
                </div>
              </div>
            )}
            
            {/* Focus areas */}
            {session.focus_areas && session.focus_areas.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-2 text-sm font-medium">
                  <Target className="h-4 w-4 text-tennis-clay" />
                  <span>Focus Areas</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {session.focus_areas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="capitalize">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Drills summary */}
            {session.drills && session.drills.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Drills ({session.drills.length})</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {session.drills.slice(0, 2).map((drill, index) => (
                    <div key={index} className="bg-muted rounded px-3 py-2">
                      <div className="font-medium">{drill.name}</div>
                      {drill.rating && (
                        <div className="text-sm text-muted-foreground">
                          Rating: {drill.rating}/5
                        </div>
                      )}
                    </div>
                  ))}
                  {session.drills.length > 2 && (
                    <div className="text-sm text-muted-foreground pt-1">
                      +{session.drills.length - 2} more drills...
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Next steps progress */}
            {session.next_steps && session.next_steps.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <ListChecks className="h-4 w-4 text-tennis-green" />
                    <span>Next Steps</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {completedSteps}/{totalSteps} completed
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-muted h-1.5 rounded-full mt-1 mb-2">
                  <div 
                    className="bg-tennis-green h-1.5 rounded-full" 
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
                
                {/* Steps list */}
                <ul className="space-y-1">
                  {session.next_steps.slice(0, 2).map((step, index) => (
                    <li key={index} className="text-sm flex items-start gap-1">
                      <CheckCircle2 
                        className={cn("h-4 w-4 mt-0.5", 
                          step.completed ? "text-tennis-green" : "text-muted-foreground"
                        )} 
                      />
                      <span className={cn(step.completed ? "line-through text-muted-foreground" : "")}>
                        {step.description}
                      </span>
                    </li>
                  ))}
                  {session.next_steps.length > 2 && (
                    <li className="text-sm text-muted-foreground">
                      +{session.next_steps.length - 2} more steps...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {session.session_note && (
        <CardFooter className="bg-muted/30 p-3 border-t">
          <p className="text-sm">{session.session_note}</p>
        </CardFooter>
      )}
    </Card>
  );
};

export default SessionCard;

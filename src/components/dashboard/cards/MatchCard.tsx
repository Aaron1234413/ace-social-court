
import React from 'react';
import { format } from 'date-fns';
import { Match } from '@/types/logging';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const formattedDate = match.match_date ? 
    format(new Date(match.match_date), 'PPP') : 
    'Unknown date';
  
  // Get first letter of opponent name for avatar fallback
  const getOpponentInitial = () => {
    if (match.opponent?.username) return match.opponent.username[0].toUpperCase();
    if (match.opponent?.full_name) return match.opponent.full_name[0].toUpperCase();
    return 'O';
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Left sidebar with match details */}
          <div className="w-2 bg-tennis-green" />
          
          {/* Main content */}
          <div className="p-4 flex-grow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{formattedDate}</span>
              </div>
              {match.surface && (
                <Badge variant="outline" className="capitalize">
                  {match.surface}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              {match.opponent ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={match.opponent.avatar_url || ''} alt={match.opponent.username || 'Opponent'} />
                  <AvatarFallback>{getOpponentInitial()}</AvatarFallback>
                </Avatar>
              ) : null}
              
              <div>
                <h3 className="font-medium">
                  {match.opponent?.username || match.opponent?.full_name || 'Practice Session'}
                </h3>
                {match.location && (
                  <p className="text-sm text-muted-foreground">{match.location}</p>
                )}
              </div>
            </div>
            
            {match.score && (
              <div className="mb-3">
                <Badge variant="secondary" className="font-mono">{match.score}</Badge>
              </div>
            )}
            
            {/* Ratings */}
            {(match.serve_rating || match.return_rating || match.endurance_rating) && (
              <div className="grid grid-cols-3 gap-2 text-center">
                {match.serve_rating && (
                  <div className="bg-muted rounded px-2 py-1">
                    <div className="text-xs text-muted-foreground">Serve</div>
                    <div className="font-medium">{match.serve_rating}/5</div>
                  </div>
                )}
                
                {match.return_rating && (
                  <div className="bg-muted rounded px-2 py-1">
                    <div className="text-xs text-muted-foreground">Return</div>
                    <div className="font-medium">{match.return_rating}/5</div>
                  </div>
                )}
                
                {match.endurance_rating && (
                  <div className="bg-muted rounded px-2 py-1">
                    <div className="text-xs text-muted-foreground">Endurance</div>
                    <div className="font-medium">{match.endurance_rating}/5</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Highlights */}
            {match.highlights && match.highlights.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-1 mb-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-tennis-highlight" />
                  <span>Highlights</span>
                </div>
                <ul className="space-y-1">
                  {match.highlights.slice(0, 3).map((highlight, index) => (
                    <li key={index} className="text-sm flex items-start gap-1">
                      <span className="font-medium capitalize">{highlight.type}</span>
                      {highlight.note && <span>- {highlight.note}</span>}
                    </li>
                  ))}
                  {match.highlights.length > 3 && (
                    <li className="text-sm text-muted-foreground">
                      +{match.highlights.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {match.reflection_note && (
        <CardFooter className="bg-muted/30 p-3 border-t">
          <p className="text-sm italic">{match.reflection_note}</p>
        </CardFooter>
      )}
    </Card>
  );
};

export default MatchCard;

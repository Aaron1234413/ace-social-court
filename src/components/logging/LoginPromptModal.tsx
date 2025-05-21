
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clipboard, CalendarDays, MapPin } from "lucide-react";
import { useLogPrompts } from '@/hooks/use-log-prompts';
import { useAuth } from '@/components/AuthProvider';

export function LoginPromptModal() {
  const { user } = useAuth();
  const { shownToday, isLoading, logPrompt } = useLogPrompts();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Show modal on mount if not already shown today and user is logged in
  useEffect(() => {
    if (user && !isLoading && !shownToday) {
      setIsOpen(true);
      // Log that prompt was shown
      logPrompt({ promptType: 'daily_login' });
    }
  }, [user, isLoading, shownToday, logPrompt]);
  
  const handleAction = (action: 'match' | 'session' | 'explore') => {
    // Log user's choice
    logPrompt({ promptType: 'daily_login', actionTaken: action });
    
    // Close modal
    setIsOpen(false);
    
    // Navigate based on action
    if (action === 'match') {
      navigate('/log/match');
    } else if (action === 'session') {
      navigate('/log/session');
    }
    // For 'explore', just close the modal and let user continue
  };
  
  if (isLoading || !user) {
    return null;
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="bottom" className="h-[95vh] sm:h-auto sm:max-w-lg sm:mx-auto rounded-t-lg">
        <SheetHeader className="text-center pb-6">
          <SheetTitle className="text-2xl font-bold">Welcome back, {user.user_metadata?.full_name || 'Player'}!</SheetTitle>
          <SheetDescription className="text-lg">
            What would you like to log today?
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
          <Card 
            className="cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all" 
            onClick={() => handleAction('match')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-primary" />
                Log a Match
              </CardTitle>
              <CardDescription>Record your recent match</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Keep track of your scores, highlights, and performance insights.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Get Started</Button>
            </CardFooter>
          </Card>
          
          <Card 
            className="cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all" 
            onClick={() => handleAction('session')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Log a Session
              </CardTitle>
              <CardDescription>Record your training</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Document drills, focus areas, and track your improvement over time.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Get Started</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex justify-center mt-4">
          <Button 
            variant="ghost" 
            onClick={() => handleAction('explore')}
            className="text-muted-foreground"
          >
            Just Explore
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

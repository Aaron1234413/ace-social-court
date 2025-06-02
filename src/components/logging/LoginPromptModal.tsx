
import React, { useEffect, useState } from 'react';
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
import { Clipboard, CalendarDays } from "lucide-react";
import { useLogPrompts } from '@/hooks/use-log-prompts';
import { useAuth } from '@/components/AuthProvider';

export function LoginPromptModal() {
  const { user } = useAuth();
  const { shownToday, isLoading, logPrompt } = useLogPrompts();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  // Show modal on mount if not already shown today and user is logged in
  useEffect(() => {
    console.log("LoginPromptModal: Checking if modal should be shown", { 
      user: !!user, 
      userId: user?.id, 
      isLoading, 
      shownToday 
    });
    
    if (user && !isLoading && shownToday === false) {
      console.log("LoginPromptModal: Opening modal");
      setIsOpen(true);
      // Log that prompt was shown
      logPrompt({ promptType: 'daily_login' });
    }
  }, [user, isLoading, shownToday, logPrompt]);
  
  const handleAction = (action: 'match' | 'session' | 'explore') => {
    console.log("LoginPromptModal: User selected action:", action);
    
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
  
  // If not logged in, don't show the modal
  if (!user) {
    console.log("LoginPromptModal: No user found, not showing modal");
    return null;
  }
  
  if (isLoading) {
    console.log("LoginPromptModal: Still loading...");
    return null;
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="center" className="sm:max-w-md mx-auto rounded-lg p-4 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-center pb-4 space-y-2">
          <SheetTitle className="text-xl sm:text-2xl font-bold leading-tight">
            Game. Set. Match.<br />
            <span className="text-tennis-green">{user.user_metadata?.full_name || 'Player'}!</span>
          </SheetTitle>
          <SheetDescription className="text-base text-muted-foreground">
            What would you like to log today?
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-3 pb-4">
          <Card 
            className="cursor-pointer border-2 hover:border-tennis-green hover:shadow-md transition-all active:scale-[0.98]" 
            onClick={() => handleAction('match')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clipboard className="h-5 w-5 text-tennis-green flex-shrink-0" />
                Log a Match
              </CardTitle>
              <CardDescription className="text-sm">Record your recent match results</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track scores, highlights, and performance insights.
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full h-9 text-sm">Get Started</Button>
            </CardFooter>
          </Card>
          
          <Card 
            className="cursor-pointer border-2 hover:border-tennis-green hover:shadow-md transition-all active:scale-[0.98]" 
            onClick={() => handleAction('session')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-tennis-green flex-shrink-0" />
                Log a Session
              </CardTitle>
              <CardDescription className="text-sm">Record your training session</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Document drills, focus areas, and improvements.
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full h-9 text-sm">Get Started</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex justify-center pt-2">
          <Button 
            variant="ghost" 
            onClick={() => handleAction('explore')}
            className="text-muted-foreground hover:text-tennis-green transition-colors"
          >
            Just Explore
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

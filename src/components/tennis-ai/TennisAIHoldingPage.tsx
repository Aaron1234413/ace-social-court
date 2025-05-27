
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TennisAIHoldingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/feed')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Brain className="h-16 w-16 text-primary animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Tennis AI Assistant
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span className="text-lg">Coming Soon</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                We're building something amazing for you!
              </p>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our Tennis AI Assistant will help you improve your game with personalized coaching tips, 
                technique analysis, and strategic insights. We're putting the finishing touches on this 
                exciting feature.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="flex flex-col items-center p-4 rounded-lg bg-accent/20">
                  <Brain className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-medium text-sm">Smart Analysis</h4>
                  <p className="text-xs text-muted-foreground text-center">
                    AI-powered technique insights
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-4 rounded-lg bg-accent/20">
                  <Sparkles className="h-8 w-8 text-yellow-500 mb-2" />
                  <h4 className="font-medium text-sm">Personalized Tips</h4>
                  <p className="text-xs text-muted-foreground text-center">
                    Tailored coaching advice
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-4 rounded-lg bg-accent/20">
                  <Clock className="h-8 w-8 text-green-500 mb-2" />
                  <h4 className="font-medium text-sm">24/7 Available</h4>
                  <p className="text-xs text-muted-foreground text-center">
                    Always ready to help
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/feed')}
                className="w-full sm:w-auto"
              >
                Explore Other Features
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TennisAIHoldingPage;

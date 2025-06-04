
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Lock, Globe } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { FriendDiscovery } from './FriendDiscovery';
import { useUserFollows } from '@/hooks/useUserFollows';

interface SocialGraphOnboardingProps {
  onComplete: () => void;
}

export function SocialGraphOnboarding({ onComplete }: SocialGraphOnboardingProps) {
  const { user } = useAuth();
  const { followingCount } = useUserFollows();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const MINIMUM_FOLLOWS = 3;

  useEffect(() => {
    if (followingCount >= MINIMUM_FOLLOWS && !isComplete) {
      setIsComplete(true);
    }
  }, [followingCount, isComplete]);

  const steps = [
    {
      id: 'discovery',
      title: 'Find Your Tennis Community',
      description: 'Connect with other tennis players and coaches',
      icon: Users,
      completed: followingCount >= MINIMUM_FOLLOWS
    }
  ];

  const handleComplete = () => {
    onComplete();
  };

  const handleSkip = () => {
    // Allow users to skip onboarding but warn about limited functionality
    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to Your Tennis Network!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Let's help you connect with the tennis community and build your social graph
        </p>
        
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Follow Users</span>
            </div>
            <Progress 
              value={(followingCount / MINIMUM_FOLLOWS) * 100} 
              className="w-32"
            />
            <Badge variant={followingCount >= MINIMUM_FOLLOWS ? "default" : "secondary"}>
              {followingCount}/{MINIMUM_FOLLOWS}
            </Badge>
          </div>
          
          {followingCount < MINIMUM_FOLLOWS && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Follow {MINIMUM_FOLLOWS - followingCount} more users to unlock public posting</span>
            </div>
          )}
          
          {followingCount >= MINIMUM_FOLLOWS && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <Globe className="h-4 w-4" />
              <span>Public posting unlocked! You can now share with everyone</span>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 mb-1">Privacy Protection</h3>
              <p className="text-sm text-amber-700">
                Until you follow at least {MINIMUM_FOLLOWS} users, your posts will default to "private" to protect your privacy. 
                This ensures you're building meaningful connections before sharing publicly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <FriendDiscovery 
        onFollowCountChange={(count) => {
          // This will be handled by the useUserFollows hook
        }}
        currentFollowCount={followingCount}
      />

      {/* Bottom Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={handleSkip}
          className="flex items-center gap-2"
        >
          Skip for Now
        </Button>
        
        <div className="flex items-center gap-4">
          {followingCount >= MINIMUM_FOLLOWS && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Ready to go!</span>
            </div>
          )}
          
          <Button 
            onClick={handleComplete}
            disabled={followingCount < MINIMUM_FOLLOWS}
            className="flex items-center gap-2"
          >
            {followingCount >= MINIMUM_FOLLOWS ? 'Continue to App' : `Follow ${MINIMUM_FOLLOWS - followingCount} More`}
          </Button>
        </div>
      </div>

      {/* Benefits Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">What You'll Unlock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className={`h-4 w-4 mt-0.5 ${followingCount >= MINIMUM_FOLLOWS ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">Public Posts</p>
                <p className="text-muted-foreground">Share with the entire community</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className={`h-4 w-4 mt-0.5 ${followingCount >= 1 ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">Personalized Feed</p>
                <p className="text-muted-foreground">See posts from people you follow</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className={`h-4 w-4 mt-0.5 ${followingCount >= MINIMUM_FOLLOWS ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">Community Features</p>
                <p className="text-muted-foreground">Join discussions and events</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

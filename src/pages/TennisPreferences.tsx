import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { OnboardingQuestionnaire } from '@/components/tennis-ai/OnboardingQuestionnaire';
import { useTennisPreferences } from '@/hooks/use-tennis-preferences';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Loading } from '@/components/ui/loading';

const TennisPreferences = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { preferences, progress, isLoadingPreferences, isLoadingProgress, updatePreferences } = useTennisPreferences();
  
  React.useEffect(() => {
    if (!user) {
      toast.error("Please sign in to access your tennis preferences");
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleEdit = () => {
    // This will cause the full questionnaire to show without passing an invalid 'id' property
    updatePreferences({}); // Reset preferences to trigger the questionnaire
  };

  const handleReturnToChat = () => {
    navigate('/tennis-ai');
  };

  if (isLoadingPreferences || isLoadingProgress) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[70vh]">
        <Loading variant="spinner" text="Loading your tennis preferences..." />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Tennis Preferences</h1>
        <Card>
          <CardHeader>
            <CardTitle>Set Your Tennis Preferences</CardTitle>
            <CardDescription>
              Complete the questionnaire to personalize your Tennis AI experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingQuestionnaire onComplete={() => navigate('/tennis-ai')} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tennis Preferences</h1>
        <Button onClick={handleReturnToChat}>Return to Tennis AI</Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Tennis Profile</CardTitle>
            <CardDescription>
              These preferences help tailor the Tennis AI responses to your specific needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Playing Information</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Playing Style:</span>
                    <span className="font-medium capitalize">{preferences.preferred_play_style || 'Not specified'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Dominant Hand:</span>
                    <span className="font-medium capitalize">{preferences.dominant_hand || 'Not specified'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Experience Level:</span>
                    <span className="font-medium capitalize">{preferences.experience_level || 'Not specified'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Court Preference:</span>
                    <span className="font-medium capitalize">{preferences.court_surface_preference || 'Not specified'}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Training Information</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Training Frequency:</span>
                    <span className="font-medium capitalize">{preferences.training_frequency || 'Not specified'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Fitness Level:</span>
                    <span className="font-medium capitalize">{preferences.fitness_level || 'Not specified'}</span>
                  </li>
                </ul>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Focus Areas</h3>
              {preferences.focus_areas && preferences.focus_areas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.focus_areas.map((area, index) => (
                    <div key={index} className="bg-muted rounded-full px-3 py-1 text-sm">
                      {area}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No focus areas specified</p>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Goals</h3>
              {preferences.goals && preferences.goals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.goals.map((goal, index) => (
                    <div key={index} className="bg-muted rounded-full px-3 py-1 text-sm">
                      {goal}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No goals specified</p>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Favorite Professional Players</h3>
              {preferences.favorite_pros && preferences.favorite_pros.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.favorite_pros.map((pro, index) => (
                    <div key={index} className="bg-muted rounded-full px-3 py-1 text-sm">
                      {pro}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No favorite pros specified</p>
              )}
            </div>

            {preferences.recent_injuries && preferences.recent_injuries.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-2">Recent Injuries</h3>
                  <div className="flex flex-wrap gap-2">
                    {preferences.recent_injuries.map((injury, index) => (
                      <div key={index} className="bg-muted rounded-full px-3 py-1 text-sm">
                        {injury}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleEdit}>Edit Preferences</Button>
          </CardFooter>
        </Card>

        {progress && (
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>
                Track your tennis development and skills assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(progress?.skill_assessments || {}).length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Skill Assessments</h3>
                  {Object.entries(progress.skill_assessments).map(([skill, assessment]) => (
                    <div key={skill} className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <span className="capitalize">{skill}</span>
                        <span className="text-sm text-muted-foreground">
                          {assessment.rating}/10 (assessed: {new Date(assessment.last_assessed).toLocaleDateString()})
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{width: `${(assessment.rating / 10) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No skill assessments available yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TennisPreferences;

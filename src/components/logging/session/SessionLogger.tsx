
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionFormSchema, SessionFormValues } from './sessionSchema';
import { useSessionSubmit } from '@/hooks/use-session-submit';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Target, 
  Dumbbell, 
  Brain, 
  Zap, 
  Users,
  Save,
  Loader2
} from 'lucide-react';

// Import existing components
import SessionBasicsForm from './SessionBasicsForm';
import SessionDrillsForm from './SessionDrillsForm';
import SessionNextStepsForm from './SessionNextStepsForm';
import PhysicalTracker from './PhysicalTracker';
import MentalTracker from './MentalTracker';
import TechnicalTracker from './TechnicalTracker';
import SessionSummary from './SessionSummary';

// Import new components
import { MultiCoachSelect } from './MultiCoachSelect';
import { CoachNotificationToggle } from './CoachNotificationToggle';

const SessionLogger = () => {
  const { user, profile } = useAuth();
  const { submitSession, isSubmitting } = useSessionSubmit();
  const [activeTab, setActiveTab] = useState('basics');
  
  const isCoach = profile?.user_type === 'coach';
  
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      session_date: new Date(),
      coach_ids: [],
      notify_coaches: false,
      shared_with_coaches: [],
      focus_areas: [],
      drills: [],
      next_steps: [],
      participants: [],
      ai_suggestions_used: false,
    },
  });

  const handleSubmit = async (data: SessionFormValues) => {
    try {
      console.log('🎯 Submitting session with data:', data);
      await submitSession(data);
      
      // Reset form after successful submission
      form.reset();
      setActiveTab('basics');
    } catch (error) {
      console.error('❌ Session submission failed:', error);
    }
  };

  const watchedCoachIds = form.watch('coach_ids') || [];
  const watchedNotifyCoaches = form.watch('notify_coaches') || false;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Log Training Session</h1>
        <p className="text-muted-foreground">
          Track your tennis training progress and share with coaches
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
              <TabsTrigger value="basics" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Basics</span>
              </TabsTrigger>
              <TabsTrigger value="coaches" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Coaches</span>
              </TabsTrigger>
              <TabsTrigger value="physical" className="flex items-center gap-1">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Physical</span>
              </TabsTrigger>
              <TabsTrigger value="mental" className="flex items-center gap-1">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Mental</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Technical</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Summary</span>
              </TabsTrigger>
            </TabsList>

            {/* Basics Tab */}
            <TabsContent value="basics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Session Basics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SessionBasicsForm form={form} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* New Coaches Tab */}
            <TabsContent value="coaches">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Coach Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tag Coaches
                    </label>
                    <MultiCoachSelect
                      selectedCoachIds={watchedCoachIds}
                      onCoachIdsChange={(coachIds) => form.setValue('coach_ids', coachIds)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <CoachNotificationToggle
                    notifyCoaches={watchedNotifyCoaches}
                    onToggle={(notify) => form.setValue('notify_coaches', notify)}
                    hasCoaches={watchedCoachIds.length > 0}
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Physical Tab */}
            <TabsContent value="physical">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5" />
                    Physical Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PhysicalTracker form={form} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mental Tab */}
            <TabsContent value="mental">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Mental State
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MentalTracker form={form} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical Tab */}
            <TabsContent value="technical">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Technical Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TechnicalTracker form={form} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Session Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SessionSummary form={form} />
                  
                  {/* Submit Button */}
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving Session...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Log Training Session
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
};

export default SessionLogger;

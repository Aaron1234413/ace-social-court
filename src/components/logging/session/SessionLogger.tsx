
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionFormSchema, SessionFormValues } from './sessionSchema';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Target, 
  Dumbbell, 
  Brain, 
  Zap, 
  Users
} from 'lucide-react';

// Import existing components
import SessionBasicsForm from './SessionBasicsForm';
import SessionDrillsForm from './SessionDrillsForm';
import SessionNextStepsForm from './SessionNextStepsForm';
import PhysicalTracker from './PhysicalTracker';
import MentalTracker from './MentalTracker';
import TechnicalTracker from './TechnicalTracker';
import { SessionSummary } from './SessionSummary';
import SessionNavigationControls from './SessionNavigationControls';

// Import new components
import { MultiCoachSelect } from './MultiCoachSelect';
import { CoachNotificationToggle } from './CoachNotificationToggle';
import { SessionAutoPostIntegration } from './SessionAutoPostIntegration';

const SessionLogger = () => {
  const { user, profile } = useAuth();
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

  const watchedCoachIds = form.watch('coach_ids') || [];
  const watchedNotifyCoaches = form.watch('notify_coaches') || false;

  // Get current form values for auto-post generation
  const currentFormValues = form.getValues();

  // Validation logic for each step
  const validateCurrentStep = (tab: string): boolean => {
    switch (tab) {
      case 'basics':
        return !!form.getValues('session_date');
      case 'coaches':
        return true; // Optional step
      case 'physical':
      case 'mental':
      case 'technical':
        return true; // These are optional but user might want to complete them
      default:
        return true;
    }
  };

  const canProceedFromCurrentTab = validateCurrentStep(activeTab);
  const isFirstTab = activeTab === 'basics';
  const isLastTab = activeTab === 'summary';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Log Training Session</h1>
        <p className="text-muted-foreground">
          Track your tennis training progress and share with coaches
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
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
                  <SessionBasicsForm />
                  <SessionNavigationControls
                    currentTab={activeTab}
                    onTabChange={setActiveTab}
                    canProceed={canProceedFromCurrentTab}
                    isFirstTab={isFirstTab}
                    isLastTab={isLastTab}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Coaches Tab */}
            <TabsContent value="coaches">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Coach Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Tag Coaches
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Select coaches to tag in this training session
                    </p>
                    <MultiCoachSelect
                      selectedCoachIds={watchedCoachIds}
                      onCoachIdsChange={(coachIds) => {
                        form.setValue('coach_ids', coachIds);
                        if (coachIds.length === 0) {
                          form.setValue('notify_coaches', false);
                        }
                      }}
                      disabled={false}
                    />
                  </div>

                  <CoachNotificationToggle
                    notifyCoaches={watchedNotifyCoaches}
                    onToggle={(notify) => form.setValue('notify_coaches', notify)}
                    hasCoaches={watchedCoachIds.length > 0}
                    disabled={false}
                  />

                  {watchedCoachIds.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Tip:</strong> Tagged coaches will be able to see this session in their dashboard and provide feedback.
                      </p>
                    </div>
                  )}

                  <SessionNavigationControls
                    currentTab={activeTab}
                    onTabChange={setActiveTab}
                    canProceed={canProceedFromCurrentTab}
                    isFirstTab={isFirstTab}
                    isLastTab={isLastTab}
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
                  <PhysicalTracker
                    onDataChange={(data) => form.setValue('physical_data', data)}
                    initialData={form.getValues('physical_data')}
                  />
                  <SessionNavigationControls
                    currentTab={activeTab}
                    onTabChange={setActiveTab}
                    canProceed={canProceedFromCurrentTab}
                    isFirstTab={isFirstTab}
                    isLastTab={isLastTab}
                  />
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
                  <MentalTracker
                    onDataChange={(data) => form.setValue('mental_data', data)}
                    initialData={form.getValues('mental_data')}
                  />
                  <SessionNavigationControls
                    currentTab={activeTab}
                    onTabChange={setActiveTab}
                    canProceed={canProceedFromCurrentTab}
                    isFirstTab={isFirstTab}
                    isLastTab={isLastTab}
                  />
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
                  <TechnicalTracker
                    onDataChange={(data) => form.setValue('technical_data', data)}
                    initialData={form.getValues('technical_data')}
                    onAISuggestionUsed={() => form.setValue('ai_suggestions_used', true)}
                  />
                  <SessionNavigationControls
                    currentTab={activeTab}
                    onTabChange={setActiveTab}
                    canProceed={canProceedFromCurrentTab}
                    isFirstTab={isFirstTab}
                    isLastTab={isLastTab}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Session Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SessionSummary 
                      pillarData={{
                        physical: form.getValues('physical_data'),
                        mental: form.getValues('mental_data'),
                        technical: form.getValues('technical_data')
                      }}
                      selectedPillars={form.getValues('focus_areas') || []}
                      aiSuggestionsUsed={form.getValues('ai_suggestions_used') || false}
                      onBack={() => setActiveTab('technical')}
                      onEdit={(pillar) => setActiveTab(pillar)}
                      onSuccess={() => {
                        form.reset();
                        setActiveTab('basics');
                      }}
                      formData={currentFormValues}
                    />
                  </CardContent>
                </Card>

                <SessionAutoPostIntegration
                  sessionData={currentFormValues}
                  onPostCreated={() => {
                    console.log('📝 Auto-generated post created from session');
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
};

export default SessionLogger;

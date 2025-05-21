
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionSchema, SessionFormValues } from '@/components/logging/session/sessionSchema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSessionSubmit } from '@/hooks/use-session-submit';
import { useNavigate } from 'react-router-dom';
import SessionBasicsForm from '@/components/logging/session/SessionBasicsForm';
import SessionDrillsForm from '@/components/logging/session/SessionDrillsForm';
import SessionNextStepsForm from '@/components/logging/session/SessionNextStepsForm';
import { useAuth } from '@/components/AuthProvider';
import { LoginPromptModal } from '@/components/logging/LoginPromptModal';

// Steps for the wizard
const STEPS = [
  { id: "basics", title: "Session Basics", description: "Date, coach, and focus areas" },
  { id: "drills", title: "Session Drills", description: "What drills did you do?" },
  { id: "next-steps", title: "Notes & Next Steps", description: "Reflection and follow-up" }
];

export default function LogSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const { submitSession, isSubmitting } = useSessionSubmit();

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      session_date: new Date(),
      focus_areas: [],
      drills: [],
      next_steps: [],
      session_note: "",
    }
  });

  // Handle form submission
  const onSubmit = async (data: SessionFormValues) => {
    try {
      const result = await submitSession(data);
      if (result) {
        navigate('/feed');
      }
    } catch (error) {
      console.error('Error submitting session:', error);
    }
  };

  // Navigate to next step
  const nextStep = () => {
    const currentFields = STEPS[currentStep].id === 'basics' 
      ? ['session_date', 'focus_areas'] 
      : [];
    
    form.trigger(currentFields as any).then((isValid) => {
      if (isValid) {
        setCurrentStep(Math.min(currentStep + 1, STEPS.length - 1));
      }
    });
  };

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  // Check if current step is valid
  const isCurrentStepValid = async (): Promise<boolean> => {
    if (currentStep === 0) {
      return await form.trigger(['session_date', 'focus_areas']);
    }
    return true;
  };

  // Get the current UI step
  const currentStepId = STEPS[currentStep].id;

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      {!user && <LoginPromptModal />}
      
      <h1 className="text-2xl font-bold mb-6">Log a Training Session</h1>
      
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {STEPS.map((step, index) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center space-y-2 w-full"
            >
              <div className="relative w-full">
                {/* Line connecting steps */}
                {index > 0 && (
                  <div className="absolute top-4 left-0 w-full h-1 bg-muted -translate-y-1/2">
                    <div 
                      className="h-full bg-tennis-green transition-all duration-300 ease-in-out"
                      style={{ 
                        width: currentStep >= index ? '100%' : '0%'
                      }}
                    />
                  </div>
                )}
                
                {/* Step circle */}
                <div className="relative z-10 flex justify-center">
                  <div 
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full 
                      text-sm font-medium transition-colors duration-300
                      ${currentStep >= index 
                        ? 'bg-tennis-green text-white' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Step title and description - only show on medium screens and up */}
              <div className="hidden md:block text-center">
                <div className={`text-sm font-medium ${currentStep === index ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={currentStepId} className="w-full">
            <TabsContent value="basics" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Session Basics</CardTitle>
                  <CardDescription>
                    Enter the basic information about your training session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionBasicsForm />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost" type="button" disabled>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="drills" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Session Drills</CardTitle>
                  <CardDescription>
                    What drills did you do during this session and how did they go?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionDrillsForm />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost" type="button" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="next-steps" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Session Notes & Next Steps</CardTitle>
                  <CardDescription>
                    Add your overall notes and steps to follow up on
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionNextStepsForm />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost" type="button" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-tennis-green hover:bg-tennis-darkGreen"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Session
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </FormProvider>
    </div>
  );
}

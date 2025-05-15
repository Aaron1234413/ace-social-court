import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTennisPreferences } from '@/hooks/use-tennis-preferences';
import { TennisUserPreferences } from '@/components/tennis-ai/types';

const playStyles = [
  { value: 'aggressive', label: 'Aggressive (Power and attacking play)' },
  { value: 'defensive', label: 'Defensive (Consistent and patient play)' },
  { value: 'all-court', label: 'All-court (Versatile and balanced play)' },
  { value: 'serve-and-volley', label: 'Serve and Volley (Net-focused play)' }
];

const experienceLevels = [
  { value: 'beginner', label: 'Beginner (New to tennis or playing casually)' },
  { value: 'intermediate', label: 'Intermediate (Regular player with basic skills)' },
  { value: 'advanced', label: 'Advanced (Competitive player with refined skills)' },
  { value: 'professional', label: 'Professional (Tournament player or coach)' }
];

const surfaces = [
  { value: 'hard', label: 'Hard Court' },
  { value: 'clay', label: 'Clay Court' },
  { value: 'grass', label: 'Grass Court' },
  { value: 'indoor', label: 'Indoor Court' }
];

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'occasionally', label: 'Occasionally' }
];

const hands = [
  { value: 'right', label: 'Right-handed' },
  { value: 'left', label: 'Left-handed' }
];

const fitnessLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const stepSchema = z.object({
  preferred_play_style: z.string().optional(),
  dominant_hand: z.string().optional(),
  experience_level: z.string().optional(),
  focus_areas: z.string().optional(),
  court_surface_preference: z.string().optional(),
  training_frequency: z.string().optional(),
  fitness_level: z.string().optional(),
  recent_injuries: z.string().optional(),
  goals: z.string().optional(),
  favorite_pros: z.string().optional(),
});

type StepFormValues = z.infer<typeof stepSchema>;

interface OnboardingQuestionnaireProps {
  onComplete: () => void;
}

export function OnboardingQuestionnaire({ onComplete }: OnboardingQuestionnaireProps) {
  const { updatePreferences, isUpdatingPreferences } = useTennisPreferences();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const form = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      preferred_play_style: '',
      dominant_hand: '',
      experience_level: '',
      focus_areas: '',
      court_surface_preference: '',
      training_frequency: '',
      fitness_level: '',
      recent_injuries: '',
      goals: '',
      favorite_pros: '',
    }
  });

  const steps = [
    {
      title: "Playing Style",
      description: "How would you describe your tennis playing style?",
      fields: ['preferred_play_style'],
    },
    {
      title: "Dominant Hand",
      description: "Which hand do you play with?",
      fields: ['dominant_hand'],
    },
    {
      title: "Experience Level",
      description: "How experienced are you at playing tennis?",
      fields: ['experience_level'],
    },
    {
      title: "Training Areas",
      description: "What areas of your game would you like to focus on improving?",
      fields: ['focus_areas'],
    },
    {
      title: "Court Preference",
      description: "What type of court surface do you prefer playing on?",
      fields: ['court_surface_preference'],
    },
    {
      title: "Training Frequency",
      description: "How often do you train or play tennis?",
      fields: ['training_frequency'],
    },
    {
      title: "Fitness Level",
      description: "How would you rate your overall fitness level?",
      fields: ['fitness_level'],
    },
    {
      title: "Recent Injuries",
      description: "Do you have any recent injuries or physical limitations? (optional)",
      fields: ['recent_injuries'],
    },
    {
      title: "Goals",
      description: "What are your tennis goals or what would you like to achieve?",
      fields: ['goals'],
    },
    {
      title: "Favorite Pros",
      description: "Who are your favorite professional tennis players? (optional)",
      fields: ['favorite_pros'],
    },
  ];
  
  const isLastStep = currentStep === steps.length - 1;
  
  const handleNext = async (values: StepFormValues) => {
    const updatedData = { ...formData, ...values };
    setFormData(updatedData);
    
    if (isLastStep) {
      try {
        // Format the data for API submission
        const preferenceData: Partial<TennisUserPreferences> = {
          preferred_play_style: updatedData.preferred_play_style as TennisUserPreferences['preferred_play_style'],
          dominant_hand: updatedData.dominant_hand as TennisUserPreferences['dominant_hand'],
          experience_level: updatedData.experience_level as TennisUserPreferences['experience_level'],
          focus_areas: updatedData.focus_areas ? updatedData.focus_areas.split(',').map(item => item.trim()) : [],
          court_surface_preference: updatedData.court_surface_preference as TennisUserPreferences['court_surface_preference'],
          training_frequency: updatedData.training_frequency as TennisUserPreferences['training_frequency'],
          fitness_level: updatedData.fitness_level as TennisUserPreferences['fitness_level'],
          recent_injuries: updatedData.recent_injuries ? updatedData.recent_injuries.split(',').map(item => item.trim()) : [],
          goals: updatedData.goals ? updatedData.goals.split(',').map(item => item.trim()) : [],
          favorite_pros: updatedData.favorite_pros ? updatedData.favorite_pros.split(',').map(item => item.trim()) : [],
        };
        
        // Save to database
        await updatePreferences(preferenceData);
        toast.success("Your preferences have been saved!");
        onComplete();
      } catch (error) {
        console.error("Error saving preferences:", error);
        toast.error("Failed to save your preferences. Please try again.");
      }
    } else {
      // Move to next step
      setCurrentStep(prevStep => prevStep + 1);
      // Reset the form with new values for next step
      form.reset({});
    }
  };
  
  const currentStepData = steps[currentStep];
  
  const renderStepContent = () => {
    const currentField = currentStepData.fields[0];
    
    switch (currentField) {
      case 'preferred_play_style':
        return (
          <FormField
            control={form.control}
            name="preferred_play_style"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3"
                  >
                    {playStyles.map((style) => (
                      <div key={style.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={style.value} id={style.value} />
                        <Label htmlFor={style.value}>{style.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'dominant_hand':
        return (
          <FormField
            control={form.control}
            name="dominant_hand"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3"
                  >
                    {hands.map((hand) => (
                      <div key={hand.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={hand.value} id={hand.value} />
                        <Label htmlFor={hand.value}>{hand.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'experience_level':
        return (
          <FormField
            control={form.control}
            name="experience_level"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3"
                  >
                    {experienceLevels.map((level) => (
                      <div key={level.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={level.value} id={level.value} />
                        <Label htmlFor={level.value}>{level.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'focus_areas':
        return (
          <FormField
            control={form.control}
            name="focus_areas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter focus areas separated by commas</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. forehand, backhand, serve, volley" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Examples: forehand, backhand, serve, volley, fitness, strategy
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'court_surface_preference':
        return (
          <FormField
            control={form.control}
            name="court_surface_preference"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3"
                  >
                    {surfaces.map((surface) => (
                      <div key={surface.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={surface.value} id={surface.value} />
                        <Label htmlFor={surface.value}>{surface.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'training_frequency':
        return (
          <FormField
            control={form.control}
            name="training_frequency"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3"
                  >
                    {frequencies.map((freq) => (
                      <div key={freq.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={freq.value} id={freq.value} />
                        <Label htmlFor={freq.value}>{freq.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'fitness_level':
        return (
          <FormField
            control={form.control}
            name="fitness_level"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3"
                  >
                    {fitnessLevels.map((level) => (
                      <div key={level.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={level.value} id={level.value} />
                        <Label htmlFor={level.value}>{level.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'recent_injuries':
        return (
          <FormField
            control={form.control}
            name="recent_injuries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter any recent injuries separated by commas (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g. tennis elbow, sprained ankle" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'goals':
        return (
          <FormField
            control={form.control}
            name="goals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter your tennis goals separated by commas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g. improve serve, compete in tournaments" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'favorite_pros':
        return (
          <FormField
            control={form.control}
            name="favorite_pros"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter your favorite tennis pros separated by commas (optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Roger Federer, Serena Williams" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      default:
        return null;
    }
  };
  
  const renderProgressIndicator = () => {
    return (
      <div className="flex justify-between mb-4">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full flex-1 mx-0.5 ${
              index <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{currentStepData.title}</CardTitle>
        <CardDescription>{currentStepData.description}</CardDescription>
        {renderProgressIndicator()}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
            {renderStepContent()}
            <CardFooter className="flex justify-between pt-4 px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(prev => prev - 1);
                  } else {
                    // Skip the whole flow
                    onComplete();
                  }
                }}
              >
                {currentStep > 0 ? 'Previous' : 'Skip'}
              </Button>
              <Button type="submit" disabled={isUpdatingPreferences}>
                {isLastStep ? 'Complete' : 'Next'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

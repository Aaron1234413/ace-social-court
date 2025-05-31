
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import MatchBasicsForm from '@/components/logging/match/MatchBasicsForm';
import MatchHighlightsForm from '@/components/logging/match/MatchHighlightsForm';
import MatchReflectionForm from '@/components/logging/match/MatchReflectionForm';
import MatchMediaForm from '@/components/logging/match/MatchMediaForm';
import { useAuth } from '@/components/AuthProvider';
import { matchFormSchema } from '@/components/logging/match/matchSchema';
import { useMatchSubmit } from '@/hooks/use-match-submit';
import { MatchData } from '@/components/logging/match/MatchLogger';

export default function LogMatch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('basics');
  const { submitMatch, isSubmitting } = useMatchSubmit();

  // Define form with zod validation
  const form = useForm<z.infer<typeof matchFormSchema>>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      match_date: new Date(),
      surface: '',
      location: '',
      score: '',
      highlights: [],
      serve_rating: 3,
      return_rating: 3,
      endurance_rating: 3,
      reflection_note: '',
      media_url: '',
      media_type: '',
    }
  });

  // Handle tab navigation
  const goToNextTab = () => {
    if (activeTab === 'basics') setActiveTab('highlights');
    else if (activeTab === 'highlights') setActiveTab('reflection');
    else if (activeTab === 'reflection') setActiveTab('media');
  };

  const goToPrevTab = () => {
    if (activeTab === 'highlights') setActiveTab('basics');
    else if (activeTab === 'reflection') setActiveTab('highlights');
    else if (activeTab === 'media') setActiveTab('reflection');
  };

  // Form submission handler
  async function onSubmit(data: z.infer<typeof matchFormSchema>) {
    if (!user) {
      toast.error("You must be logged in to submit a match");
      return;
    }

    try {
      // Transform the form data to match MatchData interface
      const matchData: MatchData = {
        match_date: data.match_date, // This is required in MatchData
        opponent_id: data.opponent_id,
        opponent_name: data.opponent_name,
        surface: data.surface as 'hard' | 'clay' | 'grass' | 'other' | undefined,
        location: data.location,
        score: data.score,
        serve_rating: data.serve_rating,
        return_rating: data.return_rating,
        endurance_rating: data.endurance_rating,
        highlights: data.highlights?.filter(h => h.type).map(h => ({
          type: h.type!,
          note: h.note,
          timestamp: h.timestamp
        })) || [],
        reflection_note: data.reflection_note,
        media_url: data.media_url,
        media_type: data.media_type,
        // Default values for new fields
        tags: [],
        notify_coach: false
      };

      await submitMatch(matchData);
      toast.success("Match logged successfully!");
      navigate('/feed');
    } catch (error) {
      console.error("Error logging match:", error);
      toast.error("Failed to log match. Please try again.");
    }
  }

  return (
    <>
      <Helmet>
        <title>Log a Match - rallypointx</title>
        <meta name="description" content="Log your tennis match details and performance" />
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="gap-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold mt-2">Log a Match</h1>
          <p className="text-muted-foreground">Record your recent match details and performance.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-4">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="highlights">Highlights</TabsTrigger>
                <TabsTrigger value="reflection">Reflection</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <Card className="mb-6">
                <TabsContent value="basics">
                  <MatchBasicsForm form={form} />
                </TabsContent>

                <TabsContent value="highlights">
                  <MatchHighlightsForm form={form} />
                </TabsContent>

                <TabsContent value="reflection">
                  <MatchReflectionForm form={form} />
                </TabsContent>

                <TabsContent value="media">
                  <MatchMediaForm form={form} />
                </TabsContent>
              </Card>

              <div className="flex justify-between mt-4">
                {activeTab !== 'basics' && (
                  <Button type="button" variant="outline" onClick={goToPrevTab}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
                
                {activeTab !== 'media' ? (
                  <Button type="button" className="ml-auto" onClick={goToNextTab}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Save Match Log"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Tabs>
          </form>
        </Form>
      </div>
    </>
  );
}

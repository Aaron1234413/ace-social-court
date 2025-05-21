
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { Separator } from '@/components/ui/separator';
import { Testimonial } from '@/components/Testimonial';
import { FeatureCard } from '@/components/FeatureCard';
import { CalendarDays, MapPin, Trophy, MessageCircle, MessageSquare, BookOpen } from 'lucide-react';

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to feed if already logged in
  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      {/* Tennis-themed background pattern */}
      <div className="absolute inset-0 court-pattern opacity-[0.03] pointer-events-none -z-10"></div>
      
      <div className="container px-4 py-10 mx-auto max-w-7xl">
        <header className="py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-tennis-green to-tennis-highlight flex items-center justify-center text-white font-bold text-xl">R</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-tennis-green to-tennis-highlight text-transparent bg-clip-text">RallyPointX</h1>
          </div>
        </header>
        
        <div className="flex flex-col lg:flex-row gap-12 py-12">
          <div className="flex-1 space-y-8">
            <div className="space-y-4 max-w-xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-tennis-green to-tennis-highlight">
                Welcome to RallyPointX
              </h1>
              <p className="text-gray-500 md:text-xl">
                Connect with players, find courts, track your progress, and improve your game with personalized insights.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <FeatureCard 
                icon={<Trophy className="h-8 w-8 text-tennis-green" />}
                title="Track Progress"
                description="Log matches and training sessions to monitor your improvement over time."
              />
              <FeatureCard 
                icon={<MessageCircle className="h-8 w-8 text-tennis-highlight" />}
                title="Connect with Players"
                description="Find and connect with players of similar skill levels in your area."
              />
              <FeatureCard 
                icon={<MapPin className="h-8 w-8 text-tennis-clay" />}
                title="Discover Courts"
                description="Find tennis courts near you with detailed information and reviews."
              />
              <FeatureCard 
                icon={<MessageSquare className="h-8 w-8 text-tennis-blue" />}
                title="Tennis AI Coach"
                description="Get personalized tips and advice from our AI tennis assistant."
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">What Players Are Saying</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Testimonial 
                  quote="RallyPointX helped me find a consistent hitting partner and improved my game dramatically."
                  author="Michael K."
                  position="4.0 NTRP Player"
                />
                <Testimonial 
                  quote="I love being able to track my progress and see how my game improves over time."
                  author="Sarah L."
                  position="3.5 NTRP Player"
                />
              </div>
            </div>
          </div>
          
          <div className="lg:w-[400px] space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Sign In or Register</CardTitle>
                <CardDescription>
                  Connect with tennis players and coaches in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthForm />
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <p className="text-xs text-muted-foreground mt-2">
                  By continuing, you agree to RallyPointX's Terms of Service and Privacy Policy.
                </p>
              </CardFooter>
            </Card>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Also Available On</h3>
              <div className="flex space-x-2">
                <div className="border border-gray-200 rounded-md px-4 py-2 text-sm flex items-center gap-2 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" /><path d="M10 2c1 .5 2 2 2 5" /></svg>
                  iOS App
                </div>
                <div className="border border-gray-200 rounded-md px-4 py-2 text-sm flex items-center gap-2 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11Z" /><path d="m8 11 2-8h4l2 8" /><path d="M8 11v1.5C8 14 8.5 16 12 16s4-2 4-3.5V11" /></svg>
                  Android App
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

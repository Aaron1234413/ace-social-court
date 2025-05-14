
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import FeatureCard from "@/components/FeatureCard";
import { Testimonial } from "@/components/Testimonial";
import { ChevronRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Add console log for debugging
  console.log("Index page rendering, user:", user);

  useEffect(() => {
    if (user) {
      console.log("User is authenticated, redirecting to feed");
      navigate('/feed');
    }
  }, [user, navigate]);

  // If user is authenticated, don't render anything while redirecting
  if (user) {
    console.log("User authenticated, returning null while redirecting");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4">
        <div className="py-20 md:py-32 text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-blue-600 to-indigo-500 bg-clip-text text-transparent animate-fade-in">
            Tennis. Together.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Connect with players and coaches nearby, improve your game with AI analysis,
            and join a community passionate about tennis.
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              Get Started <ChevronRight className="ml-1" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose rallypointx</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Connect"
              description="Find and connect with tennis players and coaches in your area based on skill level, playing style and availability."
              icon="Users"
            />
            <FeatureCard
              title="Share & Learn"
              description="Share videos of your matches, get feedback from coaches, and learn from a community of passionate tennis players."
              icon="Video"
            />
            <FeatureCard
              title="Improve"
              description="Get AI-powered analysis of your technique, personalized drills, and track your progress over time with detailed stats."
              icon="Star"
            />
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Community Says</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Testimonial 
              quote="I found my regular doubles partners and improved my backhand thanks to the video analysis feature."
              name="Alex Chen"
              title="Amateur Player"
            />
            <Testimonial 
              quote="As a coach, I can easily manage my students and track their progress with the detailed statistics dashboard."
              name="Sarah Johnson"
              title="Professional Coach"
            />
            <Testimonial 
              quote="The local court finder helped me discover courts I didn't even know existed in my neighborhood."
              name="Michael Taylor"
              title="Recreational Player"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center bg-accent rounded-lg mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to elevate your tennis experience?</h2>
            <p className="mb-8 text-lg">Join thousands of players and coaches who are already using rallypointx to connect and improve.</p>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-lg px-8"
            >
              Join Our Community
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

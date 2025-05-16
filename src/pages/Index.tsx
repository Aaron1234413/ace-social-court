
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import FeatureCard from "@/components/FeatureCard";
import { Testimonial } from "@/components/Testimonial";
import { ChevronRight, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Add console log for debugging
  console.log("Index page rendering, user:", user, "path:", location.pathname);

  useEffect(() => {
    // Only auto-redirect to /feed when we're actually at "/"
    if (user && location.pathname === "/") {
      console.log("Index: authenticated on root → redirecting to /feed");
      navigate('/feed');
    }
  }, [user, navigate, location.pathname]);

  // If user is authenticated and we're on root, don't render anything while redirecting
  if (user && location.pathname === "/") {
    console.log("Index: authenticated on root, returning null while redirecting");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Enhanced with better visual hierarchy */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent z-0"></div>
        <main className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="py-24 md:py-32 text-center space-y-8">
            <div className="space-y-4">
              <p className="text-primary font-semibold tracking-wide uppercase">Welcome to rallypointx</p>
              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="block">Tennis.</span>
                <span className="block bg-gradient-to-r from-primary via-blue-600 to-indigo-500 bg-clip-text text-transparent">Together.</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Connect with players and coaches nearby, improve your game with AI analysis,
              and join a community passionate about tennis.
            </p>
            
            {/* Single, more prominent CTA */}
            <div className="flex justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all group"
              >
                Get Started 
                <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Features Grid - Enhanced with better visual styling */}
          <div className="mb-28">
            <h2 className="text-3xl font-bold text-center mb-8">Why Choose rallypointx</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="Connect"
                description="Find and connect with tennis players and coaches in your area based on skill level, playing style and availability."
                icon="Users"
                highlightColor="from-blue-500 to-indigo-500"
              />
              <FeatureCard
                title="Share & Learn"
                description="Share videos of your matches, get feedback from coaches, and learn from a community of passionate tennis players."
                icon="Video"
                highlightColor="from-green-500 to-emerald-500"
              />
              <FeatureCard
                title="Improve"
                description="Get AI-powered analysis of your technique, personalized drills, and track your progress over time with detailed stats."
                icon="Star"
                highlightColor="from-amber-500 to-orange-500"
              />
            </div>
          </div>

          {/* Testimonials - Enhanced with better visual distinction */}
          <div className="mb-28">
            <h2 className="text-3xl font-bold text-center mb-4">What Our Community Says</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join thousands of tennis enthusiasts who are already elevating their game with rallypointx
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Testimonial 
                quote="I found my regular doubles partners and improved my backhand thanks to the video analysis feature."
                name="Alex Chen"
                title="Amateur Player"
                accentColor="bg-blue-500/10 border-blue-500/20"
              />
              <Testimonial 
                quote="As a coach, I can easily manage my students and track their progress with the detailed statistics dashboard."
                name="Sarah Johnson"
                title="Professional Coach"
                accentColor="bg-green-500/10 border-green-500/20"
              />
              <Testimonial 
                quote="The local court finder helped me discover courts I didn't even know existed in my neighborhood."
                name="Michael Taylor"
                title="Recreational Player"
                accentColor="bg-amber-500/10 border-amber-500/20"
              />
            </div>
          </div>

          {/* CTA Section - Only one prominent CTA */}
          <div className="py-16 px-6 text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl mb-16">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to elevate your tennis experience?</h2>
              <p className="mb-8 text-lg">Join thousands of players and coaches who are already using rallypointx to connect and improve.</p>
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary/90 text-lg px-10 py-6"
              >
                Join Now <ChevronRight />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;

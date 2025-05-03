
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import FeatureCard from "@/components/FeatureCard";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { AppScreenshot } from "@/components/AppScreenshot";
import { Testimonial } from "@/components/Testimonial";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  // If user is authenticated, don't render anything while redirecting
  if (user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4">
        <div className="py-16 md:py-24 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Tennis. Together.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Connect with players and coaches nearby, improve your game with AI analysis,
            and join a community passionate about tennis.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>Get Started</Button>
            <Button size="lg" variant="outline">Watch Demo</Button>
          </div>
        </div>

        {/* App Screenshots - Updated with tennis-related images */}
        <div className="mb-24">
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <AppScreenshot 
                  src="https://images.unsplash.com/photo-1542144582-1ba00456b5e3"
                  alt="Finding tennis partners nearby"
                  title="Find Tennis Partners"
                />
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <AppScreenshot 
                  src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0"
                  alt="Tracking your tennis progress"
                  title="Track Your Progress" 
                />
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <AppScreenshot 
                  src="https://images.unsplash.com/photo-1592656094267-764a45160876"
                  alt="Video analysis of tennis technique"
                  title="Analyze Your Technique" 
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
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
            <Button size="lg" onClick={() => navigate("/auth")}>Join Now</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

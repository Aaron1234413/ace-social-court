import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FeatureCard from "@/components/FeatureCard";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">AceSocial</h1>
          <div className="flex gap-4">
            {user ? (
              <>
                <Button onClick={() => navigate("/profile")}>Profile</Button>
                <Button onClick={handleSignOut}>Sign out</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Log in
                </Button>
                <Button onClick={() => navigate("/auth")}>Sign up</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold">
            Connect with Tennis Players & Coaches
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join the community where tennis players and coaches meet, share, and improve together.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="secondary">Learn More</Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Connect"
            description="Find and connect with tennis players and coaches in your area."
            icon="Users"
          />
          <FeatureCard
            title="Share & Learn"
            description="Share your progress and learn from others in the community."
            icon="Video"
          />
          <FeatureCard
            title="Improve"
            description="Get AI-powered feedback on your technique and personalized drills."
            icon="Star"
          />
        </div>
      </main>
    </div>
  );
};

export default Index;

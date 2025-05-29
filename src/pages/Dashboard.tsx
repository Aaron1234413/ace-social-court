
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/components/AuthProvider';
import PlayerDashboard from '@/components/dashboard/PlayerDashboard';
import CoachDashboard from '@/components/dashboard/CoachDashboard';
import { Link } from 'react-router-dom';
import { BeakerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading text="Loading dashboard..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to view your dashboard</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCoach = profile?.user_type === 'coach';

  return (
    <>
      <Helmet>
        <title>Dashboard - rallypointx</title>
        <meta name="description" content="Your tennis training dashboard" />
      </Helmet>
      
      {/* Mobile-optimized container with proper spacing */}
      <div className="min-h-screen bg-background">
        {/* Testing Tools Button - Mobile optimized */}
        <div className="container py-4">
          <Link to="/user-testing" className="inline-block">
            <Button variant="outline" className="flex items-center gap-2 h-12 px-4 touch-manipulation">
              <BeakerIcon size={16} />
              <span className="text-sm">User Testing Guide</span>
            </Button>
          </Link>
        </div>
        
        {/* Role-based Dashboard Rendering */}
        <div className="container pb-20 md:pb-8">
          {isCoach ? <CoachDashboard /> : <PlayerDashboard />}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

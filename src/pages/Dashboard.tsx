
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
      
      {/* Testing Tools Button */}
      <div className="container mb-4">
        <Link to="/user-testing" className="inline-block">
          <Button variant="outline" className="flex items-center gap-2">
            <BeakerIcon size={16} />
            <span>User Testing Guide</span>
          </Button>
        </Link>
      </div>
      
      {/* Role-based Dashboard Rendering */}
      {isCoach ? <CoachDashboard /> : <PlayerDashboard />}
    </>
  );
};

export default Dashboard;

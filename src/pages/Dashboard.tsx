
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/components/AuthProvider';
import PlayerDashboard from '@/components/dashboard/PlayerDashboard';
import CoachDashboard from '@/components/dashboard/CoachDashboard';
import { Link } from 'react-router-dom';
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

  // Use current_active_role to determine which dashboard to show
  const isCoach = profile?.current_active_role === 'coach';

  return (
    <>
      <Helmet>
        <title>Dashboard - rallypointx</title>
        <meta name="description" content="Your tennis training dashboard" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container pb-20 md:pb-8">
          {isCoach ? <CoachDashboard /> : <PlayerDashboard />}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

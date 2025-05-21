
import React from 'react';
import { Helmet } from 'react-helmet-async';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { Link } from 'react-router-dom';
import { BeakerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard - rallypointx</title>
        <meta name="description" content="View your tennis matches and training sessions" />
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
      
      <DashboardContent />
    </>
  );
};

export default Dashboard;

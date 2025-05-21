
import React from 'react';
import { Helmet } from 'react-helmet-async';
import DashboardContent from '@/components/dashboard/DashboardContent';

const Dashboard = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard - rallypointx</title>
        <meta name="description" content="View your tennis matches and training sessions" />
      </Helmet>
      <DashboardContent />
    </>
  );
};

export default Dashboard;

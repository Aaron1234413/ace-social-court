
import React from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layout/MainLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';

const Dashboard = () => {
  return (
    <MainLayout>
      <Helmet>
        <title>Dashboard - rallypointx</title>
        <meta name="description" content="View your tennis matches and training sessions" />
      </Helmet>
      <DashboardContent />
    </MainLayout>
  );
};

export default Dashboard;

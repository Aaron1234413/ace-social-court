
import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';
import TennisCourtImporter from '@/components/admin/TennisCourtImporter';
import { Separator } from "@/components/ui/separator";

const AdminTools = () => {
  const { user } = useAuth();
  
  // Simple admin check - in a real app you would check admin permissions
  // For now, we'll just make sure the user is logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Tools</h1>
        <p className="text-muted-foreground">Manage database and application settings</p>
      </div>
      
      <Separator />
      
      <div className="grid gap-6">
        <TennisCourtImporter />
      </div>
    </div>
  );
};

export default AdminTools;

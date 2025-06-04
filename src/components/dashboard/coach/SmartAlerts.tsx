
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertEngine, StudentAlert, AlertThresholds } from '@/services/AlertEngine';
import { WeeklyDigestCard } from './WeeklyDigestCard';
import { AlertResolution } from './AlertResolution';
import { ThresholdSettings } from './ThresholdSettings';
import { useAuth } from '@/components/AuthProvider';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Loading } from '@/components/ui/loading';

export function SmartAlerts() {
  const { user } = useAuth();
  const [selectedAlert, setSelectedAlert] = useState<{
    studentId: string;
    studentName: string;
    action: string;
  } | null>(null);

  const { data: alertData, isLoading, error, refetch } = useQuery({
    queryKey: ['coach-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      return AlertEngine.generateAlerts(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const handleResolveAlert = (alertId: string, action: string) => {
    if (!alertData) return;
    
    const alert = alertData.alerts.find(a => a.id === alertId);
    if (!alert) return;

    setSelectedAlert({
      studentId: alert.studentId,
      studentName: alert.studentName,
      action
    });
  };

  const handleViewDetails = (studentId: string) => {
    // Could navigate to student detail page or open profile modal
    console.log('View student details:', studentId);
  };

  const handleResolutionSuccess = () => {
    refetch(); // Refresh alerts after successful resolution
  };

  if (isLoading) {
    return <Loading text="Loading student alerts..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load alerts"
        message="Unable to fetch student activity alerts"
        onRetry={refetch}
      />
    );
  }

  if (!alertData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ThresholdSettings currentThresholds={alertData.thresholds} />
      
      <WeeklyDigestCard
        alerts={alertData.alerts}
        thresholds={alertData.thresholds}
        summary={alertData.summary}
        onResolveAlert={handleResolveAlert}
        onViewDetails={handleViewDetails}
      />

      {selectedAlert && (
        <AlertResolution
          studentId={selectedAlert.studentId}
          studentName={selectedAlert.studentName}
          action={selectedAlert.action}
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onSuccess={handleResolutionSuccess}
        />
      )}
    </div>
  );
}

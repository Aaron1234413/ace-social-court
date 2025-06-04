
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { StudentAlert, AlertThresholds } from '@/services/AlertEngine';

interface WeeklyDigestCardProps {
  alerts: StudentAlert[];
  thresholds: AlertThresholds;
  summary: {
    totalStudents: number;
    activeStudents: number;
    atRiskStudents: number;
  };
  onResolveAlert: (alertId: string, action: string) => void;
  onViewDetails: (studentId: string) => void;
}

export function WeeklyDigestCard({ 
  alerts, 
  thresholds, 
  summary, 
  onResolveAlert,
  onViewDetails 
}: WeeklyDigestCardProps) {
  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertMessage = (alert: StudentAlert) => {
    switch (alert.alertType) {
      case 'never_posted':
        return `${alert.studentName} registered ${alert.daysSinceRegistration} days ago but hasn't logged any sessions`;
      case 'missed_sessions':
        return `${alert.studentName} missed ${alert.missedCount} session${alert.missedCount > 1 ? 's' : ''} this week`;
      case 'consecutive_missed':
        return `${alert.studentName} missed ${alert.missedCount} consecutive days`;
      default:
        return `${alert.studentName} needs attention`;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            All Good This Week!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="text-green-600 mb-4">
                <CheckCircle className="h-16 w-16 mx-auto opacity-20" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Alerts This Week</h3>
              <p className="text-muted-foreground">All {summary.totalStudents} students are staying active!</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Ambassador Tips</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Keep the momentum going with encouragement</li>
                <li>• Share technique tips or motivational content</li>
                <li>• Consider group challenges or friendly competitions</li>
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.totalStudents}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.activeStudents}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-muted-foreground">At Risk</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Weekly Student Alerts
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {thresholds.rosterSize < 5 
            ? `Adjusted to ${thresholds.missedSessionThreshold} missed session because your group is small`
            : `Tracking ${thresholds.missedSessionThreshold} missed sessions for your ${thresholds.rosterSize}-student group`
          }
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-bold">{summary.totalStudents}</div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.activeStudents}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.atRiskStudents}</div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </div>
          </div>

          {/* Alert List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{alert.alertType.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-700">{getAlertMessage(alert)}</p>
                      {alert.lastActivity && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last activity: {new Date(alert.lastActivity).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  {alert.suggestedActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => onResolveAlert(alert.id, action)}
                      className="text-xs"
                    >
                      {action}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(alert.studentId)}
                    className="text-xs"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

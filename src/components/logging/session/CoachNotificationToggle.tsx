
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';

interface CoachNotificationToggleProps {
  notifyCoaches: boolean;
  onToggle: (notify: boolean) => void;
  hasCoaches: boolean;
  disabled?: boolean;
}

export const CoachNotificationToggle: React.FC<CoachNotificationToggleProps> = ({
  notifyCoaches,
  onToggle,
  hasCoaches,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        {notifyCoaches ? (
          <Bell className="h-4 w-4 text-blue-600" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1">
        <Label 
          htmlFor="notify-coaches" 
          className={`text-sm font-medium ${!hasCoaches ? 'text-muted-foreground' : ''}`}
        >
          Notify Tagged Coaches
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          {hasCoaches 
            ? 'Send notifications to selected coaches about this session'
            : 'Select coaches above to enable notifications'
          }
        </p>
      </div>
      
      <Switch
        id="notify-coaches"
        checked={notifyCoaches && hasCoaches}
        onCheckedChange={onToggle}
        disabled={disabled || !hasCoaches}
      />
    </div>
  );
};

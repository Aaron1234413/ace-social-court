
import { Bell } from "lucide-react";

const NotificationsEmpty = () => {
  return (
    <div className="py-16 px-4 text-center rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 border border-border/50 shadow-inner">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-muted p-4 text-muted-foreground animate-pulse-subtle">
          <Bell className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">No notifications yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            When you get new match invitations, messages, or other updates, they'll appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsEmpty;

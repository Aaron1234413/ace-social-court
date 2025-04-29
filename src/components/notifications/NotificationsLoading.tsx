
import { Skeleton } from '@/components/ui/skeleton';

const NotificationsLoading = () => {
  return (
    <div className="p-4 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsLoading;

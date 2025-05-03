
import { Loading } from '@/components/ui/loading';

interface NotificationsLoadingProps {
  error?: {
    message: string;
    guidance?: string;
    onRetry?: () => void;
  };
}

const NotificationsLoading = ({ error }: NotificationsLoadingProps) => {
  if (error) {
    return <Loading 
      variant="error" 
      error={error}
      className="p-4" 
    />;
  }
  return <Loading variant="skeleton" count={3} className="p-4" />;
};

export default NotificationsLoading;

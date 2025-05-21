
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart2 } from 'lucide-react';

interface ProfileDashboardButtonProps {
  userId: string;
  isOwnProfile: boolean;
}

const ProfileDashboardButton: React.FC<ProfileDashboardButtonProps> = ({ userId, isOwnProfile }) => {
  if (!isOwnProfile) return null;
  
  return (
    <Button asChild size="sm" variant="outline">
      <Link to="/dashboard">
        <BarChart2 className="h-4 w-4 mr-2" />
        View Dashboard
      </Link>
    </Button>
  );
};

export default ProfileDashboardButton;

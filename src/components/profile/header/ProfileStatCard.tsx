
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProfileStatCardProps {
  count: number;
  label: string;
  href: string;
  icon: ReactNode;
}

export const ProfileStatCard = ({ icon, count, label, href }: ProfileStatCardProps) => {
  return (
    <Link to={href} className="group">
      <div className="flex items-center gap-3 px-4 py-3 bg-background rounded-full border shadow-sm transition-all hover:border-primary hover:shadow-md hover:shadow-primary/10 group-hover:scale-105">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xl font-semibold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Link>
  );
};

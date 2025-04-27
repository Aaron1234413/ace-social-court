
import { useAuth } from '@/components/AuthProvider';
import { Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CertificationsListProps {
  userId: string;
}

export const CertificationsList = ({ userId }: CertificationsListProps) => {
  const { data: certifications } = useQuery({
    queryKey: ['certifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId)
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (!certifications?.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Award className="h-5 w-5" />
        Certifications
      </h2>
      <div className="grid gap-3">
        {certifications.map((cert) => (
          <div key={cert.id} className="border rounded-lg p-3">
            <h3 className="font-medium">{cert.title}</h3>
            <p className="text-sm text-muted-foreground">
              {cert.issuing_organization}
            </p>
            {cert.issue_date && (
              <p className="text-sm text-muted-foreground mt-1">
                Issued: {format(new Date(cert.issue_date), 'MMM yyyy')}
                {cert.expiry_date && ` · Expires: ${format(new Date(cert.expiry_date), 'MMM yyyy')}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

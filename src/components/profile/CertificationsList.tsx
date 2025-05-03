
import { useAuth } from '@/components/AuthProvider';
import { Award, BookOpen, Calendar, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CertificationsListProps {
  userId: string;
}

export const CertificationsList = ({ userId }: CertificationsListProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const isOwnProfile = user?.id === userId;

  const { data: certifications, isLoading } = useQuery({
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

  if (isLoading) {
    return null;
  }

  if (!certifications?.length) return null;

  // Show a limited number when collapsed
  const displayedCertifications = isExpanded ? certifications : certifications.slice(0, 3);
  const hasMoreCertifications = certifications.length > 3;
  
  // Group certifications by issuing organization for tabs
  const organizations = [...new Set(certifications.map(cert => cert.issuing_organization))];
  const hasTabs = organizations.length > 1;

  // Check if a certification is about to expire (within 3 months)
  const isAboutToExpire = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= new Date();
  };
  
  // Check if a certification is expired
  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Render a single certification card
  const renderCertification = (cert: any) => (
    <div key={cert.id} className="border rounded-lg p-4 mb-3 last:mb-0 hover:bg-accent transition-colors">
      <div className="flex items-start gap-3">
        <GraduationCap className="h-5 w-5 text-primary mt-1" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{cert.title}</h3>
            {cert.expiry_date && isExpired(cert.expiry_date) && (
              <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Expired</Badge>
            )}
            {cert.expiry_date && isAboutToExpire(cert.expiry_date) && !isExpired(cert.expiry_date) && (
              <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Expiring soon</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {cert.issuing_organization}
          </p>
          
          {(cert.issue_date || cert.expiry_date) && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {cert.issue_date && `Issued: ${format(new Date(cert.issue_date), 'MMM yyyy')}`}
                {cert.issue_date && cert.expiry_date && ' · '}
                {cert.expiry_date && `Expires: ${format(new Date(cert.expiry_date), 'MMM yyyy')}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Certifications
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasTabs ? (
          <Tabs defaultValue={organizations[0]} className="w-full">
            <TabsList className="mb-4">
              {organizations.map(org => (
                <TabsTrigger key={org} value={org} className="text-xs">
                  {org}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {organizations.map(org => (
              <TabsContent key={org} value={org}>
                {displayedCertifications
                  .filter(cert => cert.issuing_organization === org)
                  .map(renderCertification)}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-3">
            {displayedCertifications.map(renderCertification)}
          </div>
        )}

        {hasMoreCertifications && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-4 text-sm flex items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show all {certifications.length} certifications <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
};

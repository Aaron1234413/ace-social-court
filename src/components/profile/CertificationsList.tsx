
import { useAuth } from '@/components/AuthProvider';
import { Award, BookOpen, Calendar, ChevronDown, ChevronUp, GraduationCap, Plus } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CreatePostModal } from '@/components/profile/CreatePostModal';

interface CertificationsListProps {
  userId: string;
}

interface Certification {
  id: string;
  title: string;
  issuing_organization: string;
  issue_date: string | null;
  expiry_date: string | null;
  user_id: string;
}

export const CertificationsList = ({ userId }: CertificationsListProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const isOwnProfile = user?.id === userId;
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);

  const { data: certifications, isLoading, refetch } = useQuery({
    queryKey: ['certifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId)
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return data as Certification[];
    }
  });

  const handlePostCreated = () => {
    refetch();
    setCreatePostModalOpen(false);
  };

  if (isLoading) {
    return null;
  }

  if (!certifications?.length) return null;

  // Show a limited number when collapsed
  const displayedCertifications = isExpanded ? certifications : certifications.slice(0, 6);
  const hasMoreCertifications = certifications.length > 6;
  
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

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 flex justify-between items-start">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Certifications
          </CardTitle>
        </div>
        {isOwnProfile && (
          <Button 
            onClick={() => setCreatePostModalOpen(true)} 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedCertifications
                    .filter(cert => cert.issuing_organization === org)
                    .map((cert) => (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <button
                          onClick={() => setSelectedCertification(cert)}
                          className="text-left w-full border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <GraduationCap className="h-5 w-5 text-primary mt-1 group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium truncate">{cert.title}</h3>
                                {cert.expiry_date && isExpired(cert.expiry_date) && (
                                  <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Expired</Badge>
                                )}
                                {cert.expiry_date && isAboutToExpire(cert.expiry_date) && !isExpired(cert.expiry_date) && (
                                  <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Expiring soon</Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground truncate">
                                {cert.issuing_organization}
                              </p>
                              
                              {(cert.issue_date || cert.expiry_date) && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span className="truncate">
                                    {cert.issue_date && `Issued: ${format(new Date(cert.issue_date), 'MMM yyyy')}`}
                                    {cert.issue_date && cert.expiry_date && ' · '}
                                    {cert.expiry_date && `Expires: ${format(new Date(cert.expiry_date), 'MMM yyyy')}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedCertifications.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <button
                  onClick={() => setSelectedCertification(cert)}
                  className="text-left w-full border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-primary mt-1 group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{cert.title}</h3>
                        {cert.expiry_date && isExpired(cert.expiry_date) && (
                          <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Expired</Badge>
                        )}
                        {cert.expiry_date && isAboutToExpire(cert.expiry_date) && !isExpired(cert.expiry_date) && (
                          <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Expiring soon</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {cert.issuing_organization}
                      </p>
                      
                      {(cert.issue_date || cert.expiry_date) && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="truncate">
                            {cert.issue_date && `Issued: ${format(new Date(cert.issue_date), 'MMM yyyy')}`}
                            {cert.issue_date && cert.expiry_date && ' · '}
                            {cert.expiry_date && `Expires: ${format(new Date(cert.expiry_date), 'MMM yyyy')}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {hasMoreCertifications && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-6 text-sm flex items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show all {certifications.length} certifications <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}

        {/* Certification Lightbox Dialog */}
        <Dialog open={!!selectedCertification} onOpenChange={() => setSelectedCertification(null)}>
          <DialogContent className="sm:max-w-lg">
            {selectedCertification && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    {selectedCertification.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Issuing Organization</h4>
                    <p>{selectedCertification.issuing_organization}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCertification.issue_date && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Issue Date</h4>
                        <p>{format(new Date(selectedCertification.issue_date), 'MMMM d, yyyy')}</p>
                      </div>
                    )}
                    
                    {selectedCertification.expiry_date && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Expiry Date</h4>
                        <p className={isExpired(selectedCertification.expiry_date) ? "text-red-500" : ""}>
                          {format(new Date(selectedCertification.expiry_date), 'MMMM d, yyyy')}
                          {isExpired(selectedCertification.expiry_date) && " (Expired)"}
                          {isAboutToExpire(selectedCertification.expiry_date) && !isExpired(selectedCertification.expiry_date) && " (Expiring soon)"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>

      <CreatePostModal 
        open={createPostModalOpen} 
        onOpenChange={setCreatePostModalOpen} 
        onPostCreated={handlePostCreated}
      />
    </Card>
  );
};

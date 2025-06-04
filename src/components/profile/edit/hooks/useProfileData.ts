
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { ProfileFormValues } from '../profileSchema';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export const useProfileData = () => {
  const { user, profile } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);

  // Fetch user achievements and certifications
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          // Fetch achievements
          const { data: achievementsData, error: achievementsError } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', user.id);
          
          if (achievementsError) throw achievementsError;
          setAchievements(achievementsData || []);
          
          // Fetch certifications
          const { data: certificationsData, error: certificationsError } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', user.id);
          
          if (certificationsError) throw certificationsError;
          setCertifications(certificationsData || []);
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to fetch user data');
        }
      };
      
      fetchUserData();
    }
  }, [user]);

  return { 
    form: null, // This will be passed from parent component
    profile,
    achievements, 
    certifications 
  };
};

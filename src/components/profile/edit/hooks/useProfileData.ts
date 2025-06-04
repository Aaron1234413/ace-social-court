
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { ProfileFormValues } from '../profileSchema';
import { useAuth } from '@/components/AuthProvider';
import { ProfileData } from '../ProfileEditContainer';
import { toast } from 'sonner';

export const useProfileData = (
  form: UseFormReturn<ProfileFormValues>,
  profileData: ProfileData | null,
  setLocationName: (name: string) => void
) => {
  const { user, profile } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);

  // Initialize form with profile data when it becomes available
  useEffect(() => {
    if (profileData && form) {
      console.log('Initializing form with profile data:', profileData);
      
      form.reset({
        username: profileData.username || '',
        full_name: profileData.full_name || '',
        user_type: profileData.user_type,
        playing_style: profileData.playing_style || '',
        experience_level: profileData.experience_level || 'beginner',
        bio: profileData.bio || '',
        location_name: profileData.location_name || '',
        latitude: profileData.latitude || undefined,
        longitude: profileData.longitude || undefined,
        achievements: [],
        certifications: []
      });

      if (profileData.location_name) {
        setLocationName(profileData.location_name);
      }
    }
  }, [profileData, form, setLocationName]);

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
          
          // Update form with achievements
          if (achievementsData && form) {
            form.setValue('achievements', achievementsData.map(a => ({
              id: a.id,
              title: a.title,
              date_achieved: a.date_achieved || '',
              description: a.description || ''
            })));
          }
          
          // Fetch certifications
          const { data: certificationsData, error: certificationsError } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', user.id);
          
          if (certificationsError) throw certificationsError;
          setCertifications(certificationsData || []);
          
          // Update form with certifications
          if (certificationsData && form) {
            form.setValue('certifications', certificationsData.map(c => ({
              id: c.id,
              title: c.title,
              issuing_organization: c.issuing_organization,
              issue_date: c.issue_date || '',
              expiry_date: c.expiry_date || ''
            })));
          }
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to fetch user data');
        }
      };
      
      fetchUserData();
    }
  }, [user, form]);

  return { 
    profile,
    achievements, 
    certifications 
  };
};

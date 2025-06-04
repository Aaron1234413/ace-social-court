
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../profileSchema';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useProfileSubmit = (
  form: UseFormReturn<ProfileFormValues>,
  isNewUser: boolean
) => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = form.handleSubmit(async (values: ProfileFormValues) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setValidationMessage(null);
    setIsSubmitting(true);
    
    try {
      // Prepare the data for submission
      const latitude = values.latitude !== undefined ? Number(parseFloat(values.latitude.toString()).toFixed(6)) : null;
      const longitude = values.longitude !== undefined ? Number(parseFloat(values.longitude.toString()).toFixed(6)) : null;
      
      const profileData = {
        id: user.id,
        username: values.username,
        full_name: values.full_name,
        user_type: values.user_type,
        playing_style: values.playing_style || null,
        experience_level: values.experience_level,
        bio: values.bio || null,
        location_name: values.location_name || null,
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date().toISOString()
      };
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      // Update achievements
      if (values.achievements && values.achievements.length > 0) {
        // First delete all existing achievements
        const { error: deleteError } = await supabase
          .from('achievements')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) throw deleteError;
        
        // Then insert new achievements
        const achievementsToInsert = values.achievements.map(achievement => ({
          user_id: user.id,
          title: achievement.title,
          date_achieved: achievement.date_achieved || null,
          description: achievement.description || null
        }));
        
        if (achievementsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('achievements')
            .insert(achievementsToInsert);
          
          if (insertError) throw insertError;
        }
      }
      
      // Update certifications
      if (values.certifications && values.certifications.length > 0) {
        // First delete all existing certifications
        const { error: deleteError } = await supabase
          .from('certifications')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) throw deleteError;
        
        // Then insert new certifications
        const certificationsToInsert = values.certifications.map(certification => ({
          user_id: user.id,
          title: certification.title,
          issuing_organization: certification.issuing_organization,
          issue_date: certification.issue_date || null,
          expiry_date: certification.expiry_date || null
        }));
        
        if (certificationsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('certifications')
            .insert(certificationsToInsert);
          
          if (insertError) throw insertError;
        }
      }
      
      // Refresh the profile
      await refreshProfile();
      
      toast.success('Profile updated successfully');
      
      // Redirect based on user state
      if (isNewUser) {
        navigate('/feed');
      } else {
        // Navigate to the profile page with the user ID
        navigate(`/profile/${user.id}`);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    handleSubmit,
    isSubmitting,
    validationMessage,
    setValidationMessage
  };
};


import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BasicInfoFields } from './form-sections/BasicInfoFields';
import { PlayingInfoFields } from './form-sections/PlayingInfoFields';
import { LocationField } from './form-sections/LocationField';
import { AchievementsField } from './form-sections/AchievementsField';
import { CertificationsField } from './form-sections/CertificationsField';
import { RoleManagementField } from './form-sections/RoleManagementField';
import { profileSchema, ProfileFormValues } from './profileSchema';
import { useProfileSubmit } from './hooks/useProfileSubmit';
import { useProfileData } from './hooks/useProfileData';
import { useLocationState } from './hooks/useLocationState';
import { useAuth } from '@/components/AuthProvider';

interface ProfileEditFormProps {
  isNewUser?: boolean;
}

export { ProfileFormValues };

export function ProfileEditForm({ isNewUser = false }: ProfileEditFormProps) {
  const { profile } = useAuth();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      full_name: '',
      user_type: 'player',
      playing_style: '',
      experience_level: 'beginner',
      bio: '',
      location_name: '',
      latitude: undefined,
      longitude: undefined,
      achievements: [],
      certifications: []
    },
  });

  const {
    locationName,
    isLocationPickerOpen,
    setIsLocationPickerOpen,
    openLocationPicker,
    onSelectLocation
  } = useLocationState(form);

  const { handleSubmit, isSubmitting } = useProfileSubmit(form, isNewUser);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-8">
          <BasicInfoFields control={form.control} />
          <PlayingInfoFields control={form.control} />
          <LocationField 
            form={form}
            locationName={locationName}
            isLocationPickerOpen={isLocationPickerOpen}
            setIsLocationPickerOpen={setIsLocationPickerOpen}
            openLocationPicker={openLocationPicker}
            onSelectLocation={onSelectLocation}
          />
          
          {/* Only show role management for existing users who already have a complete profile */}
          {!isNewUser && profile && (
            <RoleManagementField />
          )}
          
          {profile?.current_active_role === 'coach' && (
            <CertificationsField control={form.control} />
          )}
          
          <AchievementsField control={form.control} />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

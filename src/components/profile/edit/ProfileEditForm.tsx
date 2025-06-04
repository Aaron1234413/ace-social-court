
import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BasicInfoFields } from './form-sections/BasicInfoFields';
import { PlayingInfoFields } from './form-sections/PlayingInfoFields';
import { LocationField } from './form-sections/LocationField';
import { AchievementsField } from './form-sections/AchievementsField';
import { CertificationsField } from './form-sections/CertificationsField';
import { RoleManagementField } from './form-sections/RoleManagementField';
import { useProfileSubmit } from './hooks/useProfileSubmit';
import { useProfileData } from './hooks/useProfileData';

interface ProfileEditFormProps {
  isNewUser?: boolean;
}

export function ProfileEditForm({ isNewUser = false }: ProfileEditFormProps) {
  const { form, profile } = useProfileData();
  const { handleSubmit, isSubmitting } = useProfileSubmit(form, isNewUser);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-8">
          <BasicInfoFields form={form} />
          <PlayingInfoFields form={form} />
          <LocationField form={form} />
          
          {/* Only show role management for existing users who already have a complete profile */}
          {!isNewUser && profile && (
            <RoleManagementField />
          )}
          
          {profile?.current_active_role === 'coach' && (
            <CertificationsField form={form} />
          )}
          
          <AchievementsField form={form} />
          
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

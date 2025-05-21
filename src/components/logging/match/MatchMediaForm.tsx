
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MatchFormValues } from './matchSchema';
import { MediaUploader } from '@/components/media/MediaUploader';
import { FormLabel } from '@/components/ui/form';

interface MatchMediaFormProps {
  form: UseFormReturn<MatchFormValues>;
}

const MatchMediaForm = ({ form }: MatchMediaFormProps) => {
  const handleMediaUploaded = (url: string, type: string) => {
    form.setValue('media_url', url);
    form.setValue('media_type', type);
  };

  const mediaUrl = form.watch('media_url');
  const mediaType = form.watch('media_type');

  return (
    <>
      <CardHeader>
        <CardTitle>Match Media</CardTitle>
        <CardDescription>Upload photos or videos from your match (optional)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <FormLabel>Upload Media</FormLabel>
            <div className="mt-2">
              <MediaUploader 
                onFileUploaded={handleMediaUploaded}
                existingUrl={mediaUrl}
                existingType={mediaType}
                allowedTypes={['image/*', 'video/*']}
                maxFileSizeMB={50}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default MatchMediaForm;

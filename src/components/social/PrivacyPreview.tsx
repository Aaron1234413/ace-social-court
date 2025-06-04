
import React from 'react';
import { EnhancedPrivacyPreview } from './EnhancedPrivacyPreview';
import { PrivacyLevel } from './EnhancedPrivacySelector';

interface PrivacyPreviewProps {
  privacyLevel: PrivacyLevel;
  postContent?: string;
  authorName?: string;
  followingCount?: number;
}

export function PrivacyPreview(props: PrivacyPreviewProps) {
  return <EnhancedPrivacyPreview {...props} />;
}

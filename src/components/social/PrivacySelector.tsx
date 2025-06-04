
import React from 'react';
import { EnhancedPrivacySelector, PrivacyLevel } from './EnhancedPrivacySelector';

interface PrivacySelectorProps {
  value: PrivacyLevel;
  onValueChange: (value: PrivacyLevel) => void;
  followingCount?: number;
}

export function PrivacySelector(props: PrivacySelectorProps) {
  return <EnhancedPrivacySelector {...props} showPreview={true} />;
}

export type { PrivacyLevel };

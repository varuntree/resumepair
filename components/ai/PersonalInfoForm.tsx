/**
 * Personal Info Form Component
 *
 * Collapsible form for entering personal information.
 * Optional seed data for AI resume generation.
 *
 * @component
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { PersonalInfo } from '@/libs/ai/prompts';

interface PersonalInfoFormProps {
  personalInfo?: PersonalInfo;
  onChange: (info: Partial<PersonalInfo>) => void;
  disabled?: boolean;
}

export default function PersonalInfoForm({
  personalInfo = {},
  onChange,
  disabled = false,
}: PersonalInfoFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ [field]: value || undefined });
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      {/* Header */}
      <Button
        variant="ghost"
        className="h-auto w-full justify-between p-0 font-medium hover:bg-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm">Personal Information (Optional)</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Description */}
      {!isExpanded && (
        <p className="text-xs text-muted-foreground">
          Add your details to personalize the generated resume
        </p>
      )}

      {/* Form Fields */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="personal-name" className="text-xs">
              Full Name
            </Label>
            <Input
              id="personal-name"
              type="text"
              value={personalInfo.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={disabled}
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="personal-email" className="text-xs">
              Email
            </Label>
            <Input
              id="personal-email"
              type="email"
              value={personalInfo.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={disabled}
              placeholder="john.doe@example.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="personal-phone" className="text-xs">
              Phone
            </Label>
            <Input
              id="personal-phone"
              type="tel"
              value={personalInfo.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={disabled}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="personal-location" className="text-xs">
              Location
            </Label>
            <Input
              id="personal-location"
              type="text"
              value={personalInfo.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              disabled={disabled}
              placeholder="San Francisco, CA"
            />
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground">
            This information will be used to seed the contact section of your
            resume. All fields are optional.
          </p>
        </div>
      )}
    </div>
  );
}

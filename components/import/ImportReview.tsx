/**
 * Import Review Component
 *
 * Allows user to review and correct parsed resume data before saving.
 * Shows confidence score and editable fields.
 *
 * @component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useImportStore } from '@/stores/importStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ApiResponse } from '@/libs/api-utils/responses';
import toast from 'react-hot-toast';

export function ImportReview() {
  const router = useRouter();
  const { parsedResume, corrections, applyCorrection, resetImport } = useImportStore();
  const [isSaving, setIsSaving] = useState(false);

  if (!parsedResume) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">No resume data to review</p>
      </div>
    );
  }

  const { data, confidence = 0 } = parsedResume;

  // Apply corrections to data
  const finalData = {
    ...data,
    profile: {
      ...data.profile,
      ...(corrections.profile || {}),
    },
    summary: corrections.summary !== undefined ? corrections.summary : data.summary,
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Create new resume document
      const response = await fetch('/api/v1/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalData.profile.fullName
            ? `${finalData.profile.fullName}'s Resume`
            : 'Imported Resume',
          data: finalData,
        }),
      });

      const result: ApiResponse<any> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to save resume');
      }

      toast.success('Resume imported successfully!');
      resetImport();

      // Redirect to editor
      router.push(`/editor/${result.data.id}`);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confidence Score */}
      <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="font-medium">Extraction Confidence</p>
          <p className="text-sm text-muted-foreground">
            How confident we are in the extracted data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{Math.round(confidence * 100)}%</div>
          {confidence > 0.8 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
        </div>
      </div>

      {confidence < 0.8 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Low confidence detected.</strong> Please review the extracted information
            carefully and make corrections as needed.
          </p>
        </div>
      )}

      {/* Profile Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Profile Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={finalData.profile.fullName || ''}
              onChange={(e) => applyCorrection('profile.fullName', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={finalData.profile.email || ''}
              onChange={(e) => applyCorrection('profile.email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={finalData.profile.phone || ''}
              onChange={(e) => applyCorrection('profile.phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={
                finalData.profile.location
                  ? `${finalData.profile.location.city || ''}, ${finalData.profile.location.country || ''}`.trim()
                  : ''
              }
              onChange={(e) =>
                applyCorrection('profile.location', {
                  city: e.target.value.split(',')[0]?.trim() || '',
                  country: e.target.value.split(',')[1]?.trim() || '',
                })
              }
              placeholder="City, Country"
            />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {data.summary && (
        <div className="space-y-2">
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea
            id="summary"
            rows={4}
            value={finalData.summary || ''}
            onChange={(e) => applyCorrection('summary', e.target.value)}
          />
        </div>
      )}

      {/* Work Experience Count */}
      {data.work && data.work.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm">
            <strong>Work Experience:</strong> {data.work.length} position
            {data.work.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}

      {/* Education Count */}
      {data.education && data.education.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm">
            <strong>Education:</strong> {data.education.length} institution
            {data.education.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}

      {/* Skills Count */}
      {data.skills && data.skills.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm">
            <strong>Skills:</strong> {data.skills.reduce((sum, group) => sum + group.items.length, 0)}{' '}
            skills across {data.skills.length} categories
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={resetImport} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Resume'
          )}
        </Button>
      </div>
    </div>
  );
}

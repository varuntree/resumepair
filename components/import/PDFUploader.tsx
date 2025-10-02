/**
 * PDF Uploader Component
 *
 * Drag-and-drop file uploader for PDF resumes.
 * Uses design tokens and shadcn/ui patterns.
 *
 * @component
 */

'use client';

import React, { useCallback } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { useImportStore } from '@/stores/importStore';

export function PDFUploader() {
  const { setFile, setError, error } = useImportStore();

  const handleFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file is not empty
    if (file.size === 0) {
      setError('File is empty');
      return;
    }

    setFile(file);
  }, [setFile, setError]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFile(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Drop your resume PDF here</p>
            <p className="text-sm text-muted-foreground mt-2">or click to browse</p>
          </div>
          <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

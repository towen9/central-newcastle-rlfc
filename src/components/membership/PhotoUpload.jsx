import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PhotoUpload({ onPhotoUploaded, currentPhotoUrl }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl || null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);

      // Upload to server
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      onPhotoUploaded(file_url);
      toast.success('Photo uploaded');
    } catch (error) {
      toast.error('Failed to upload photo');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onPhotoUploaded(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Member Photo ID <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-500">
        Required for gate verification. Upload a clear photo of yourself.
      </p>

      {previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl}
            alt="Member photo"
            className="w-full aspect-square object-cover rounded-xl border-2 border-gray-200"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer">
            {uploading ? (
              <div className="animate-pulse">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <>
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Click to upload photo
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG up to 5MB
                </p>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
}
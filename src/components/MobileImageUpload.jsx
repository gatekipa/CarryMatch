import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Mobile-optimized image upload component
 * Features:
 * - Camera access for mobile devices
 * - Image compression for faster uploads
 * - Preview with remove option
 * - Multiple image support
 * - Progress indicator
 */

export default function MobileImageUpload({ 
  onImagesUploaded, 
  maxImages = 5,
  currentImages = [],
  compress = true 
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState(currentImages);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1200px)
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;
          
          if (width > height && width > maxSize) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width / height) * maxSize;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality compression
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files) => {
    if (previews.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newUrls = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        // Validate file size (10MB max before compression)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        // Compress image if enabled
        let processedFile = file;
        if (compress) {
          processedFile = await compressImage(file);
        }

        // Upload to server
        const { file_url } = await base44.integrations.Core.UploadFile({ 
          file: processedFile 
        });
        
        newUrls.push(file_url);
      }

      const updatedPreviews = [...previews, ...newUrls];
      setPreviews(updatedPreviews);
      onImagesUploaded(updatedPreviews);
      
      if (newUrls.length > 0) {
        toast.success(`${newUrls.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onImagesUploaded(updatedPreviews);
  };

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading || previews.length >= maxImages}
          className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
        >
          <Camera className="w-4 h-4 mr-2" />
          Camera
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || previews.length >= maxImages}
          className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
        >
          <Upload className="w-4 h-4 mr-2" />
          Gallery
        </Button>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"
        >
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span className="text-sm text-blue-400">Uploading & optimizing...</span>
        </motion.div>
      )}

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence>
            {previews.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square"
              >
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        {previews.length}/{maxImages} images • Images are automatically compressed for faster uploads
      </p>
    </div>
  );
}
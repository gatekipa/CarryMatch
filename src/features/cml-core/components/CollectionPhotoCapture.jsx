import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Image as ImageIcon, Lock } from "lucide-react";
import { uploadCollectionPhoto } from "@/features/cml-core/api/cmlPhotos";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function CollectionPhotoCapture({ vendorId, shipmentId, existingPhotoUrl, canUsePhotoUpload, onPhotoUploaded }) {
  const { t } = useI18n();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [preview, setPreview] = useState(existingPhotoUrl || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!canUsePhotoUpload) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
        <Lock className="h-4 w-4 text-slate-400" />
        <p className="text-sm text-slate-500">{t("collectionPhoto.proRequired")}</p>
      </div>
    );
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const url = await uploadCollectionPhoto(vendorId, shipmentId, selectedFile);
      setPreview(url);
      setSelectedFile(null);
      toast.success(t("collectionPhoto.uploadSuccess"));
      onPhotoUploaded?.(url);
    } catch (error) {
      toast.error(error.message || t("collectionPhoto.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {t("collectionPhoto.title")}
      </p>

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          <img src={preview} alt="Collection proof" className="h-40 w-full object-cover" />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
          <Camera className="mr-1.5 h-4 w-4" /> {t("collectionPhoto.camera")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="mr-1.5 h-4 w-4" /> {t("collectionPhoto.browse")}
        </Button>

        {selectedFile && !isUploading ? (
          <Button type="button" size="sm" onClick={handleUpload}>
            <Upload className="mr-1.5 h-4 w-4" /> {t("collectionPhoto.upload")}
          </Button>
        ) : null}

        {isUploading ? (
          <Button disabled size="sm">
            {t("common.saving")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

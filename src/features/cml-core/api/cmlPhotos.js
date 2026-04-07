import { supabase, supabaseConfigError } from "@/lib/supabaseClient";
import { compressImage } from "@/features/cml-core/lib/imageCompress";

const BUCKET_NAME = "shipment-photos";

export async function uploadCollectionPhoto(vendorId, shipmentId, file) {
  if (!supabase) throw new Error(supabaseConfigError);
  if (!file) throw new Error("No file provided.");

  // Compress image
  const compressed = await compressImage(file);

  // Upload to Supabase Storage
  const filePath = `${vendorId}/${shipmentId}/collection.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, compressed, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const publicUrl = urlData?.publicUrl || null;

  // Update shipment record
  const { error: updateError } = await supabase
    .from("vendor_shipments")
    .update({ collection_photo_url: publicUrl })
    .eq("vendor_id", vendorId)
    .eq("id", shipmentId);

  if (updateError) throw updateError;

  return publicUrl;
}

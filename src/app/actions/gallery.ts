"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function deleteGalleryImage(name: string) {
  const { error } = await supabaseAdmin
    .storage
    .from("gallery")
    .remove([name]);

  if (error) {
    console.error("Gallery delete error:", error.message);
    throw new Error("Görsel silinemedi");
  }

  return true;
}

export async function uploadGalleryImage(formData: FormData) {
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("Dosya bulunamadı");
  }

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("gallery")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Gallery upload error:", error.message);
    throw new Error("Görsel yüklenemedi");
  }

  const { data } = supabaseAdmin.storage
    .from("gallery")
    .getPublicUrl(fileName);

  return {
    name: fileName,
    url: data.publicUrl,
  };
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type GalleryImage = {
  name: string;
  url: string;
};

const SLIDE_INTERVAL = 5500;

export function GalleryHero() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase.storage
        .from("gallery")
        .list("", { sortBy: { column: "created_at", order: "desc" } });

      if (error) {
        console.error("Galeri resimleri alınırken hata:", error.message);
        return;
      }

      const files = (data ?? []).filter((f) => !f.name.startsWith("."));

      const mapped: GalleryImage[] = files.map((file) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from("gallery").getPublicUrl(file.name);
        return { name: file.name, url: publicUrl };
      });

      setImages(mapped);
      setActiveIndex(0);
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;

    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(id);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/70 text-xs text-slate-500">
        Admin panelden galeri görselleri yüklendiğinde burada otomatik
        gösterilecektir.
      </div>
    );
  }

  return (
    <div className="relative h-56 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80 shadow-[0_0_70px_rgba(0,0,0,0.75)] sm:h-64 md:h-72">
      {images.map((img, index) => {
        const isActive = index === activeIndex;
        const isPrev =
          index === (activeIndex - 1 + images.length) % images.length;

        return (
          <div
            key={img.name}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              isActive
                ? "opacity-100 translate-x-0 scale-100"
                : isPrev
                  ? "-translate-x-6 scale-[1.02] opacity-0"
                  : "translate-x-6 scale-[1.02] opacity-0"
            }`}
          >
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${img.url})` }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-slate-950/40" />
          </div>
        );
      })}

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {images.slice(0, 6).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-4 rounded-full transition ${
              i === activeIndex
                ? "bg-alf-gold shadow-[0_0_12px_rgba(233,196,106,0.8)]"
                : "bg-slate-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}




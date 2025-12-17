// 1. Build hatasını önlemek için sayfayı dinamik yapıyoruz
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";
import Link from "next/link";

type Teacher = {
  id: string;
  full_name: string;
  branch: string;
  image_url: string;
  created_at: string;
};

async function getTeacher(id: string) {
  // UUID formatında mı kontrol et
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return null;
  }

  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Öğretmen alınırken hata:", error);
    return null;
  }

  return data;
}

// 2. Next.js 15'te params bir Promise'dir, bu yüzden await ile almalıyız
export default async function OgretmenDetayPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const teacher = await getTeacher(resolvedParams.id);

  if (!teacher) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
        <div className="flex items-center justify-between">
          <h1 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            Öğretmen Detayı
          </h1>
          <Link
            href="/ogretmenlerimiz"
            className="rounded-full border border-alf-gold/60 bg-alf-gold/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-alf-gold shadow-sm transition hover:bg-alf-gold/15"
          >
            Geri Dön
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-slate-800/80 md:w-1/3">
              {teacher.image_url ? (
                <img 
                  src={teacher.image_url} 
                  alt={teacher.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800/50">
                  <span className="text-slate-500">Fotoğraf Yok</span>
                </div>
              )}
            </div>
            
            <div className="md:w-2/3 w-full">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-100">
                  {teacher.full_name}
                </h2>
                <p className="mt-2 text-lg text-alf-gold">
                  {teacher.branch}
                </p>
              </div>
              
              <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Hakkında
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Bu öğretmen hakkında detaylı bilgi henüz eklenmemiş.
                </p>
              </div>
              
              <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  İletişim
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Detaylı iletişim bilgileri için lütfen kurs merkezimizle iletişime geçiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
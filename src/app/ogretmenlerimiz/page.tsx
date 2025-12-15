import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type Teacher = {
  id: string;
  full_name: string;
  branch: string;
  image_url: string;
  created_at: string;
};

async function getTeachers() {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Öğretmenler alınırken hata:", error);
    return [];
  }

  return data ?? [];
}

export default async function OgretmenlerimizPage() {
  const teachers = await getTeachers();

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
        <h1 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Öğretmenlerimiz
        </h1>
        <p className="text-center text-sm text-slate-300">
          Anadolu Fen Bilimleri Özel Öğretim Kursu Merkezi olarak öğrencilerimize eğitim veren değerli öğretmenlerimiz
        </p>

        {teachers.length === 0 ? (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">Henüz hiç öğretmen eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {teachers.map((teacher: Teacher) => (
              <div 
                key={teacher.id} 
                className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 transition-transform duration-300 hover:scale-105"
              >
                <div className="aspect-square w-full overflow-hidden">
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
                <div className="flex-grow p-4 flex flex-col">
                  <h3 className="text-center text-sm font-semibold text-slate-100 flex-grow">
                    {teacher.full_name}
                  </h3>
                  <p className="mt-1 text-center text-xs text-alf-gold">
                    {teacher.branch}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
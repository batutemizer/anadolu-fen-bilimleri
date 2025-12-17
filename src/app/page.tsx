import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { GalleryHero } from "@/components/GalleryHero";

type FeaturedStudent = {
  id: string;
  full_name: string;
  class: string;
  field: string;
  description: string;
  photo_url: string;
  is_active: boolean;
  created_at: string;
};

async function getAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Duyurular alınırken hata:", error);
    return [];
  }

  return data ?? [];
}

async function getFeaturedStudents() {
  const { data, error } = await supabase
    .from("featured_students")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Öne çıkan öğrenciler alınırken hata:", error);
    return [];
  }

  return data ?? [];
}

export default async function Home() {
  const announcements = await getAnnouncements();
  const featuredStudents = await getFeaturedStudents();

  return (
    <>
      <Navbar />
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-24 px-4 pb-20 pt-12 md:px-6 md:pt-20">
        {/* Animated background elements */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-yellow-500/10 to-amber-500/5 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-yellow-400/8 to-orange-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-amber-500/6 to-yellow-500/4 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* HERO SECTION */}
        <section className="grid gap-12 md:grid-cols-[1.2fr,1fr] md:items-center md:gap-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-yellow-500/30 bg-yellow-500/5 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-yellow-500 shadow-lg shadow-yellow-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              ANADOLU FEN BİLİMLERİ ÖZEL ÖGRETİM KURSU • TYT &amp; AYT
            </div>
            
            <div className="space-y-6">
              {/* LOGO EKLENMİŞ BAŞLIK */}
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                    Üniversite hedefi{" "}
                    <span className="relative inline-block">
                      <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 blur-xl opacity-50"></span>
                      <span className="relative bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                        disiplinli takip
                      </span>
                    </span>{" "}
                    ve{" "}
                    <span className="relative inline-block">
                      <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-400 blur-xl opacity-50"></span>
                      <span className="relative bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                        şeffaf veli sistemi
                      </span>
                    </span>{" "}
                    ile başlar.
                  </h1>
                </div>
                
                {/* Logo - sadece büyük ekranlarda göster */}
                <div className="hidden lg:block flex-shrink-0 mt-2">
                  <div className="relative group">
                    {/* Glow effect */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    
                    {/* Logo container */}
                    <div className="relative w-40 h-40 rounded-full border border-yellow-400/10 bg-slate-950/100 backdrop-blur-sm p-3 overflow-hidden">
                      {/* Logo resmi - Next.js Image component ile */}
                      <div className="relative w-full h-full">
                        <Image
                          src="/AlfLogo2.png"
                          alt="Alf Kurs Logo"
                          fill
                          sizes="10000px"
                          className="object-contain"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                Anadolu Fen Bilimleri Özel Öğretim Kursu olarak TYT–AYT hazırlığında öğrencinin akademik
                gelişimini, velinin ise sürece tam erişimini ön planda tutuyoruz.
                Deneme analizleri, birebir mentorluk ve güçlü raporlama
                altyapımızla süreci uçtan uca yönetiyoruz.
              </p>
            </div>

            <div className="flex flex-wrap items-start gap-6">

            </div>

            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              {[
                "Yoğun Deneme Programı",
                "Net Takibi & Analiz",
                "Raporlama"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
                  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-yellow-400 to-transparent"></div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Sağ tarafta galeri + program kartı */}
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative">
                <GalleryHero />
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 p-6 backdrop-blur-sm shadow-2xl">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Program Özeti
                    </p>
                    <h2 className="text-xl font-bold text-white">
                      TYT – AYT Yoğun Hazırlık
                    </h2>
                  </div>
                  <span className="rounded-full border border-yellow-100/50 bg-yellow-500/10 px-2 py-1.5 text-xs font-bold tracking-wider text-yellow-400">
                    2025-2026
                  </span>
                </div>

                <ul className="space-y-4 text-sm text-slate-300 mb-6">
                  {[
                    { text: "Haftalık deneme sınavları ve detaylı soru bazlı analiz raporları", highlight: "deneme sınavları" },
                    { text: "Branş bazlı konu anlatımı + soru çözümü seansları", highlight: "konu anlatımı + soru çözümü" },
                    { text: "Öğrenciye atanmış bireysel mentörlük ve çalışma planı", highlight: "bireysel mentörlük" },
                    
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 group/item">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-400 group-hover/item:ring-4 group-hover/item:ring-yellow-400/20 transition-all flex-shrink-0"></div>
                      <span className="group-hover/item:text-white transition-colors">
                        {item.text.split(item.highlight)[0]}
                        <span className="font-semibold text-yellow-400">
                          {item.highlight}
                        </span>
                        {item.text.split(item.highlight)[1]}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 backdrop-blur-sm hover:border-yellow-500/30 transition-colors">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      İletişim
                    </p>
                    <p className="text-sm font-medium text-white">0(424)502 4840</p>
                    <p className="text-xs text-slate-400 mt-1">info@alfkurs.com</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 backdrop-blur-sm hover:border-yellow-500/30 transition-colors">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Adres
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Anadolu Fen Bilimleri Özel Öğretim Kursu, Şube Adresi
                      <br />
                      (Detaylı adres bilgisi)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Öne Çıkan Öğrenciler Section */}
        {featuredStudents.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Son 1 Ayda Deneme Performansıyla Öne Çıkan Öğrencilerimiz
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Bu değerlendirme son 1 ayda yapılan deneme sınavları baz alınarak yapılmıştır.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 backdrop-blur-sm hover:border-yellow-500/40 transition-all duration-300"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative flex flex-col items-center text-center">
                    <div className="mb-6">
                      {student.photo_url ? (
                        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-amber-400/20">
                          <img 
                            src={student.photo_url} 
                            alt={student.full_name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-amber-400/20 bg-slate-800/50 flex items-center justify-center">
                          <span className="text-slate-500">Foto yok</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">
                      {student.full_name}
                    </h3>
                    
                    <p className="text-amber-400 font-medium mb-4">
                      {student.class} – {student.field}
                    </p>
                    
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {student.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3 kolonluk özellikler - Modern Cards */}
        <section className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Öğrenci Takibi", desc: "Net artış grafikleri, deneme performansı ve konu eksiklerini tek panelde takip edin." },
            { title: "Kurumsal Yapı", desc: "Program, ödeme ve iletişim süreçlerinin tamamı kurumsal standartlara göre tasarlandı."}
          ].map((item, i) => (
            <div key={i} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative h-full rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur-sm hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-4"></div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Kurum bilgileri + Duyurular */}
        <section className="grid gap-8 md:grid-cols-[1fr,1.5fr]">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/90 p-8 backdrop-blur-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
                KURUM BİLGİLERİ
                <div className="h-px flex-1 bg-gradient-to-l from-yellow-500/50 to-transparent"></div>
              </h2>
              <div className="space-y-4 text-sm text-slate-300">
                {[
                  { label: "Adres", value: "ATAŞEHİR MAHALLESİ SANCAKTAR SOKAK NO:42/AB" },
                  { label: "Telefon", value: "0(424)502 4840" },
                  { label: "E-posta", value: "-" },
                  { label: "Çalışma Saatleri", value: "Hafta içi 09:00 – 22:00 • Hafta sonu 09:00 – 22:00 / Tatil Günü:Pazartesi" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="font-bold text-yellow-400 min-w-[140px]">{item.label}:</span>
                    <span className="text-slate-300">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/90 p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
                  GÜNCEL DUYURULAR
                </h2>
                <span className="text-xs text-slate-500 bg-slate-950/60 px-3 py-1 rounded-full">
                  {announcements.length} kayıt
                </span>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {announcements.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    Şu an için yayımlanmış bir duyuru bulunmuyor.
                  </p>
                ) : (
                  announcements.map((a: any) => (
                    <div
                      key={a.id}
                      className="group/item relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all duration-300 hover:border-yellow-500/40 hover:bg-slate-900/80 hover:-translate-y-0.5"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                      <h3 className="relative text-sm font-semibold text-white group-hover/item:text-yellow-400 transition-colors">
                        {a.title}
                      </h3>
                      {a.description && (
                        <p className="relative mt-2 text-xs text-slate-400 leading-relaxed">
                          {a.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* GOOGLE MAPS */}
        <section>
          <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
            KONUM
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
          </h2>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 shadow-2xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d461.940260497418!2d39.174914!3d38.661878!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4076ea9fcec59957%3A0x9791db3457c467d2!2sAlfkursmerkezi!5e1!3m2!1str!2str!4v1764856138791!5m2!1str!2str"
                width="100%"
                height="500"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Oturum kontrol fonksiyonu
const checkAdminSession = () => {
  if (typeof window === "undefined") return false;
  
  const isAdmin = sessionStorage.getItem("alf_admin");
  const loginTime = sessionStorage.getItem("alf_admin_login_time");
  const sessionId = sessionStorage.getItem("alf_admin_session_id");
  const currentTime = Date.now();
  const sessionTimeout = 30 * 60 * 1000; // 30 dakika
  
  // Oturum geçerli mi kontrolü
  if (!isAdmin || 
      (loginTime && (currentTime - parseInt(loginTime)) > sessionTimeout) ||
      !sessionId) {
    // Oturum geçersizse session'ı temizle
    sessionStorage.removeItem("alf_admin");
    sessionStorage.removeItem("alf_admin_login_time");
    sessionStorage.removeItem("alf_admin_session_id");
    return false;
  }
  
  return true;
};

type Teacher = {
  id: string;
  full_name: string;
  branch: string;
  image_url: string;
  created_at: string;
};

export default function OgretmenlerPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Öğretmen ekleme formu state'i
  const [teacherForm, setTeacherForm] = useState({
    full_name: "",
    branch: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // İlk yüklemede oturum kontrolü
    if (!checkAdminSession()) {
      router.replace("/admin-login");
      return;
    } else {
      setIsAuthorized(true);
    }

    // Dosya seçildiğinde önizleme oluştur
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }

    // SessionStorage değişikliklerini dinle
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "alf_admin" && !e.newValue) {
        router.replace("/admin-login");
      }
    };
    
    window.addEventListener("storage", handleStorageChange);

    // Öğretmenleri çek
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!error) {
        setTeachers(data as Teacher[]);
      }
      setLoading(false);
    };

    fetchTeachers();

    // Cleanup function
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setUploading(true);

    try {
      // Dosya yükleme
      let imageUrl = "";
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('teachers')
          .upload(fileName, selectedFile);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Dosyanın public URL'sini al
        const { data: { publicUrl } } = supabase.storage
          .from('teachers')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Öğretmeni veritabanına ekle
      const { data, error } = await supabase
        .from("teachers")
        .insert({
          full_name: teacherForm.full_name,
          branch: teacherForm.branch,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Listeyi güncelle
      setTeachers(prev => [data as Teacher, ...prev]);
      
      // Formu sıfırla
      setTeacherForm({ full_name: "", branch: "" });
      setSelectedFile(null);
      setFilePreview(null);
      setMessage("Öğretmen başarıyla eklendi.");
    } catch (error: any) {
      console.error("Öğretmen eklenirken hata:", error.message);
      setMessage("Öğretmen eklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTeacher = async (id: string, imageUrl: string) => {
    try {
      // Veritabanından sil
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      // Dosyayı storage'dan sil (sadece URL varsa)
      if (imageUrl) {
        // URL'den dosya adını çıkar
        try {
          const url = new URL(imageUrl);
          const fileName = url.pathname.split('/').pop();
          
          if (fileName) {
            const { error: storageError } = await supabase.storage
              .from('teachers')
              .remove([fileName]);
            
            if (storageError) {
              console.warn("Dosya silinirken hata:", storageError.message);
            }
          }
        } catch (urlError) {
          console.warn("URL parse hatası:", urlError);
        }
      }

      // Listeyi güncelle
      setTeachers(prev => prev.filter(teacher => teacher.id !== id));
      setMessage("Öğretmen başarıyla silindi.");
    } catch (error: any) {
      console.error("Öğretmen silinirken hata:", error.message);
      setMessage("Öğretmen silinirken bir hata oluştu.");
    }
  };

  if (isAuthorized === null) {
    // Yetki kontrolü yapılıyor
    return (
      <>
        <Navbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h1 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              Yetki Kontrolü
            </h1>
            <p className="mt-4 text-sm text-slate-300">Yönlendiriliyorsunuz...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthorized) {
    // Yetkisiz erişim
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
        <div className="flex items-center justify-between">
          <h1 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            Öğretmenler
          </h1>
          <button
            onClick={() => router.push("/admin-panel")}
            className="rounded-full border border-alf-gold/60 bg-alf-gold/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-alf-gold shadow-sm transition hover:bg-alf-gold/15"
          >
            Geri Dön
          </button>
        </div>

        {/* Öğretmen Ekleme Formu */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300 mb-4">
            Öğretmen Ekle
          </h2>
          <form onSubmit={handleAddTeacher} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Öğretmen Ad Soyad</label>
              <input
                type="text"
                required
                value={teacherForm.full_name}
                onChange={(e) => setTeacherForm({...teacherForm, full_name: e.target.value})}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Branş</label>
              <input
                type="text"
                required
                value={teacherForm.branch}
                onChange={(e) => setTeacherForm({...teacherForm, branch: e.target.value})}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-slate-200">Fotoğraf (Opsiyonel)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-alf-gold file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-alf-navy hover:file:bg-alf-gold/90"
              />
              {filePreview && (
                <div className="mt-2">
                  <img 
                    src={filePreview} 
                    alt="Önizleme" 
                    className="h-32 w-32 rounded-lg object-cover border border-slate-700/80"
                  />
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={uploading}
                className="flex w-full items-center justify-center rounded-full bg-alf-gold px-4 py-2.5 text-sm font-semibold text-alf-navy shadow-lg shadow-alf-gold/30 transition hover:bg-alf-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploading ? "Kaydediliyor..." : "Öğretmeni Kaydet"}
              </button>
              {message && (
                <p className="mt-2 text-xs font-medium text-emerald-400">
                  {message}
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Öğretmen Listesi */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300 mb-4">
            Öğretmen Listesi
          </h2>
          {loading ? (
            <p className="text-sm text-slate-300">Yükleniyor...</p>
          ) : teachers.length === 0 ? (
            <p className="text-sm text-slate-300">Henüz hiç öğretmen eklenmemiş.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60">
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
                  <div className="flex-grow p-3 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-100 truncate flex-grow">
                      {teacher.full_name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {teacher.branch}
                    </p>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.image_url)}
                      className="mt-2 w-full rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 transition hover:bg-red-500/20"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
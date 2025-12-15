"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { deleteGalleryImage } from "@/app/actions/gallery";
import { uploadGalleryImage } from "@/app/actions/gallery";



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

type Student = {
  id: string;
  full_name?: string;
  name?: string;
  student_unique_id: string;
  total_payment_amount: number;
  installment_count?: number;
  start_date?: string;
  end_date?: string;
  parent_full_name?: string;
  parent_phone?: string;
};

type Announcement = {
  id: number;
  title: string;
  description?: string;
};

type GalleryFile = {
  name: string;
  url: string;
};

type Payment = {
  id: string;
  student_id: string;
  installment_no: number;
  paid_amount: number;
  paid_date?: string;
  created_at?: string;
};

// Featured Students type
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

export default function AdminPanelPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [gallery, setGallery] = useState<GalleryFile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [featuredStudents, setFeaturedStudents] = useState<FeaturedStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // İlk render'da oturum kontrolü
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Öğrenci ekleme formu state'i
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    total_payment_amount: "",
    installment_count: "",
    start_date: "",
    end_date: "",
    parent_full_name: "",
    parent_phone: "",
    student_unique_id: ""
  });

  // Ödeme formu state'i
  const [paymentForm, setPaymentForm] = useState({
    student_id: "",
    installment_no: "",
    paid_amount: ""
  });

  // Featured Student form state
  const [featuredStudentForm, setFeaturedStudentForm] = useState({
    full_name: "",
    class: "",
    field: "Sayısal",
    description: "",
    is_active: true,
  });

  // Featured Student photo state
  const [featuredStudentPhoto, setFeaturedStudentPhoto] = useState<File | null>(null);
  const [featuredStudentPhotoPreview, setFeaturedStudentPhotoPreview] = useState<string | null>(null);
  const [featuredStudentLoading, setFeaturedStudentLoading] = useState(false);
  const [featuredStudentMessage, setFeaturedStudentMessage] = useState<string | null>(null);

  // Seçilen öğrenciye göre kalan taksit numaralarını hesapla
  const getAvailableInstallments = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return [];

    // Öğrenciye ait ödemeleri filtrele
    const studentPayments = payments.filter(p => p.student_id === studentId);
    
    // Kullanılmış taksit numaralarını al
    const usedInstallments = studentPayments.map(p => p.installment_no);
    
    // Tüm mümkün taksit numaralarını oluştur
    const allInstallments = Array.from(
      { length: student.installment_count || 0 }, 
      (_, i) => i + 1
    );
    
    // Kullanılmamış taksit numaralarını döndür
    return allInstallments.filter(num => !usedInstallments.includes(num));
  };

  // Öğrenci seçildiğinde ödeme formunu sıfırla
  const handleStudentChange = (studentId: string) => {
    setPaymentForm({
      ...paymentForm,
      student_id: studentId,
      installment_no: "",
      paid_amount: ""
    });
  };

  // Taksit numarası seçildiğinde otomatik olarak taksit tutarını doldur
  const handleInstallmentChange = (installmentNo: string) => {
    setPaymentForm(prev => ({
      ...prev,
      installment_no: installmentNo,
    }));
    
    // Eğer öğrenci seçiliyse ve taksit numarası seçildiyse, otomatik olarak taksit tutarını doldur
    if (paymentForm.student_id && installmentNo) {
      const installmentAmount = getInstallmentAmount(paymentForm.student_id);
      setPaymentForm(prev => ({
        ...prev,
        installment_no: installmentNo,
        paid_amount: installmentAmount.toString()
      }));
    }
  };

  // Seçilen öğrenciye göre taksit tutarını hesapla
  const getInstallmentAmount = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !student.installment_count) return 0;
    return student.total_payment_amount / student.installment_count;
  };

  // Ödenen tutar değiştirildiğinde
  const handlePaidAmountChange = (amount: string) => {
    setPaymentForm(prev => ({
      ...prev,
      paid_amount: amount
    }));
  };

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    description: "",
  });

  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentMessage, setStudentMessage] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(
    null,
  );
  const [galleryMessage, setGalleryMessage] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);

  useEffect(() => {
    // İlk yüklemede oturum kontrolü
    if (!checkAdminSession()) {
      router.replace("/admin-login");
      return;
    } else {
      setIsAuthorized(true);
    }

    // SessionStorage değişikliklerini dinle
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "alf_admin" && !e.newValue) {
        router.replace("/admin-login");
      }
    };
    
    window.addEventListener("storage", handleStorageChange);

    // Belirli aralıklarla oturum kontrolü (her 5 dakikada bir)
    const interval = setInterval(() => {
      if (!checkAdminSession()) {
        router.replace("/admin-login");
      }
    }, 5 * 60 * 1000); // 5 dakika

    const fetchInitial = async () => {
      // Öğrencileri çek
      const { data: sData } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: true });
      setStudents((sData as Student[]) ?? []);

      // Duyuruları çek
      const { data: aData } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      setAnnouncements((aData as Announcement[]) ?? []);

      // Ödemeleri çek
      const { data: pData } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: true });
      setPayments((pData as Payment[]) ?? []);

      // Galeri dosyalarını çek
      const { data: files, error } = await supabase.storage
        .from("gallery")
        .list("", { sortBy: { column: "created_at", order: "desc" } });

      if (!error && files) {
        const mapped: GalleryFile[] = files
          .filter((f) => !f.name.startsWith("."))
          .map((file) => {
            const {
              data: { publicUrl },
            } = supabase.storage.from("gallery").getPublicUrl(file.name);
            return { name: file.name, url: publicUrl };
          });
        setGallery(mapped);
      }

      // Öne çıkan öğrencileri çek
      const { data: fsData } = await supabase
        .from("featured_students")
        .select("*")
        .order("created_at", { ascending: false });
      setFeaturedStudents((fsData as FeaturedStudent[]) ?? []);
    };

    fetchInitial();

    // Cleanup function
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  // Öğrenci ekleme fonksiyonu
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStudent(true);
    setStudentMessage(null);

    const { data, error } = await supabase
      .from("students")
      .insert({
        full_name: studentForm.full_name,
        total_payment_amount: Number(studentForm.total_payment_amount),
        installment_count: Number(studentForm.installment_count),
        start_date: studentForm.start_date || null,
        end_date: studentForm.end_date || null,
        parent_full_name: studentForm.parent_full_name,
        parent_phone: studentForm.parent_phone,
        student_unique_id: studentForm.student_unique_id
      })
      .select("*")
      .single();

    if (!error && data) {
      setStudents((prev) => [...prev, data as Student]);
      setStudentForm({
        full_name: "",
        total_payment_amount: "",
        installment_count: "",
        start_date: "",
        end_date: "",
        parent_full_name: "",
        parent_phone: "",
        student_unique_id: ""
      });
      setStudentMessage("Öğrenci başarıyla eklendi.");
    } else {
      console.error("Öğrenci eklenirken hata:", error?.message);
      setStudentMessage("Öğrenci eklenirken bir hata oluştu.");
    }

    setLoadingStudent(false);
  };

  // Ödeme ekleme fonksiyonu
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPayment(true);
    setPaymentMessage(null);

    const { error } = await supabase.from("payments").insert({
      student_id: paymentForm.student_id,
      installment_no: Number(paymentForm.installment_no),
      paid_amount: Number(paymentForm.paid_amount)
    });

    if (error) {
      console.error("Ödeme eklenirken hata:", error.message);
      setPaymentMessage("Ödeme eklenirken bir hata oluştu.");
    } else {
      setPaymentForm({
        student_id: "",
        installment_no: "",
        paid_amount: ""
      });
      setPaymentMessage("Ödeme başarıyla eklendi.");
      
      // Ödemeleri yeniden çek
      const { data: pData } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: true });
      setPayments((pData as Payment[]) ?? []);
    }

    setLoadingPayment(false);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAnnouncement(true);
    setAnnouncementMessage(null);

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: announcementForm.title,
        description: announcementForm.description,
      })
      .select("*")
      .single();

    if (!error && data) {
      setAnnouncements((prev) => [data as Announcement, ...prev]);
      setAnnouncementForm({ title: "", description: "" });
    } else {
      console.error("Duyuru eklenirken hata:", error?.message);
      setAnnouncementMessage("Duyuru eklenirken bir hata oluştu.");
      setLoadingAnnouncement(false);
      return;
    }

    setAnnouncementMessage("Duyuru başarıyla eklendi.");
    setLoadingAnnouncement(false);
  };

  const handleDeleteAnnouncement = async (id: number) => {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Duyuru silinirken hata:", error.message);
      return;
    }

    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUploadGallery = async (
  e: React.ChangeEvent<HTMLInputElement>,
) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  setGalleryLoading(true);
  setGalleryMessage(null);

  try {
    const uploadedResults: GalleryFile[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadGalleryImage(formData);
      uploadedResults.push(result);
    }

    setGallery((prev) => [...uploadedResults, ...prev]);
    setGalleryMessage("Görseller başarıyla yüklendi.");
  } catch (err) {
    console.error("Gallery upload error:", err);
    setGalleryMessage("Görseller yüklenirken bir hata oluştu.");
  } finally {
    setGalleryLoading(false);
    e.target.value = "";
  }
};


  

  const handleDeleteGalleryImage = async (name: string) => {
  setGalleryLoading(true);
  setGalleryMessage(null);

  try {
    await deleteGalleryImage(name);

    setGallery((prev) => prev.filter((g) => g.name !== name));
    setGalleryMessage("Görsel başarıyla silindi.");
  } catch (err) {
    console.error("Galeri görseli silinirken hata:", err);
    setGalleryMessage("Görsel silinirken bir hata oluştu.");
  } finally {
    setGalleryLoading(false);
  }
};


  // Featured Student photo change handler
  const handleFeaturedStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedStudentPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeaturedStudentPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Featured Student form submit handler
  const handleAddFeaturedStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeaturedStudentLoading(true);
    setFeaturedStudentMessage(null);

    try {
      let photoUrl = "";

      // Upload photo if provided
      if (featuredStudentPhoto) {
        const ext = featuredStudentPhoto.name.split(".").pop();
        const fileName = `featured-student-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("featured-students")
          .upload(fileName, featuredStudentPhoto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Fotoğraf yüklenirken hata: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from("featured-students")
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Insert featured student record
      const { data, error } = await supabase
        .from("featured_students")
        .insert({
          full_name: featuredStudentForm.full_name,
          class: featuredStudentForm.class,
          field: featuredStudentForm.field,
          description: featuredStudentForm.description,
          photo_url: photoUrl,
          is_active: featuredStudentForm.is_active,
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Add to state
      setFeaturedStudents(prev => [data as FeaturedStudent, ...prev]);

      // Reset form
      setFeaturedStudentForm({
        full_name: "",
        class: "",
        field: "Sayısal",
        description: "",
        is_active: true,
      });
      setFeaturedStudentPhoto(null);
      setFeaturedStudentPhotoPreview(null);

      setFeaturedStudentMessage("Öne çıkan öğrenci başarıyla eklendi.");
    } catch (error: any) {
      console.error("Öne çıkan öğrenci eklenirken hata:", error);
      setFeaturedStudentMessage(`Hata: ${error.message || "Bir hata oluştu"}`);
    } finally {
      setFeaturedStudentLoading(false);
    }
  };

  // Delete featured student
  const handleDeleteFeaturedStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("featured_students")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      setFeaturedStudents(prev => prev.filter(student => student.id !== id));
      setFeaturedStudentMessage("Öne çıkan öğrenci başarıyla silindi.");
    } catch (error: any) {
      console.error("Öne çıkan öğrenci silinirken hata:", error);
      setFeaturedStudentMessage(`Hata: ${error.message || "Bir hata oluştu"}`);
    }
  };

  // Toggle featured student active status
  const handleToggleFeaturedStudentActive = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from("featured_students")
        .update({ is_active: !currentStatus })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setFeaturedStudents(prev => 
        prev.map(student => 
          student.id === id ? { ...student, is_active: !currentStatus } : student
        )
      );

      setFeaturedStudentMessage(`Öne çıkan öğrenci ${!currentStatus ? "aktif" : "pasif"} yapıldı.`);
    } catch (error: any) {
      console.error("Öne çıkan öğrenci durumu güncellenirken hata:", error);
      setFeaturedStudentMessage(`Hata: ${error.message || "Bir hata oluştu"}`);
    }
  };

  // Öğrenci listesini filtrele
  const filteredStudents = students.filter(student => 
    (student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.id.includes(searchTerm))
  );

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
            Admin Paneli
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin-panel/ogretmenler"
              className="rounded-full border border-blue-500/60 bg-blue-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400 shadow-sm transition hover:bg-blue-500/15"
            >
              Öğretmenler
            </Link>
            <Link
              href="/admin-panel/iletisim-mesajlari"
              className="rounded-full border border-green-500/60 bg-green-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-green-400 shadow-sm transition hover:bg-green-500/15"
            >
              İletişim Mesajları
            </Link>
            <button
              onClick={() => {
                // Session'ı temizle
                sessionStorage.removeItem("alf_admin");
                sessionStorage.removeItem("alf_admin_login_time");
                sessionStorage.removeItem("alf_admin_session_id");
                // Login sayfasına yönlendir
                router.push("/admin-login");
              }}
              className="rounded-full border border-red-500/60 bg-red-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 shadow-sm transition hover:bg-red-500/15"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          Öğrenci kayıtları, taksit/ödeme işlemleri ve duyuruları bu alandan
          yönetebilirsiniz.
        </p>

        {/* Öğrenci Ekleme Formu */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
            Öğrenci Ekleme
          </h2>
          <form
            onSubmit={handleAddStudent}
            className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2"
          >
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-200">Öğrenci ID (student_unique_id)</label>
              <input
                type="text"
                required
                value={studentForm.student_unique_id}
                onChange={(e) =>
                  setStudentForm({ ...studentForm, student_unique_id: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-200">Öğrenci Ad Soyad</label>
              <input
                type="text"
                required
                value={studentForm.full_name}
                onChange={(e) =>
                  setStudentForm({ ...studentForm, full_name: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Toplam Ücret</label>
              <input
                type="number"
                required
                value={studentForm.total_payment_amount}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    total_payment_amount: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Taksit Sayısı</label>
              <input
                type="number"
                required
                value={studentForm.installment_count}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    installment_count: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Başlangıç Tarihi</label>
              <input
                type="date"
                value={studentForm.start_date}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    start_date: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Bitiş Tarihi</label>
              <input
                type="date"
                value={studentForm.end_date}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    end_date: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Veli Ad Soyad</label>
              <input
                type="text"
                value={studentForm.parent_full_name}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    parent_full_name: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Veli Cep Telefonu</label>
              <input
                type="text"
                value={studentForm.parent_phone}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    parent_phone: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={loadingStudent}
                className="flex w-full items-center justify-center rounded-full bg-alf-gold px-4 py-2.5 text-sm font-semibold text-alf-navy shadow-lg shadow-alf-gold/30 transition hover:bg-alf-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingStudent ? "Kaydediliyor..." : "Öğrenciyi Kaydet"}
              </button>
              {studentMessage && (
                <p className="mt-2 text-xs font-medium text-emerald-400">
                  {studentMessage}
                </p>
              )}
              {studentForm.full_name && studentForm.student_unique_id && (
                <p className="mt-1 text-xs text-slate-400">
                  Öğrenci ID: {studentForm.student_unique_id} - {studentForm.full_name}
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Taksit Ödeme Ekranı */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
            Taksit Ödeme
          </h2>
          <form
            onSubmit={handleAddPayment}
            className="mt-4 grid grid-cols-1 gap-3 text-sm"
          >
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Öğrenci</label>
              <select
                required
                value={paymentForm.student_id}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              >
                <option value="">Seçiniz...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.name || "İsimsiz"} ({s.student_unique_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Taksit Numarası</label>
              <select
                required
                value={paymentForm.installment_no}
                onChange={(e) => handleInstallmentChange(e.target.value)}
                disabled={!paymentForm.student_id}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2 disabled:opacity-50"
              >
                <option value="">Önce öğrenci seçin...</option>
                {paymentForm.student_id && getAvailableInstallments(paymentForm.student_id).map(num => (
                  <option key={num} value={num}>
                    {num}. Taksit
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-200">
                Ödenen Tutar
                {paymentForm.student_id && (
                  <span className="ml-2 text-alf-gold">
                    (Taksit Tutarı: {getInstallmentAmount(paymentForm.student_id).toFixed(2)} TL)
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={paymentForm.paid_amount}
                  onChange={(e) => handlePaidAmountChange(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                />
                {paymentForm.student_id && paymentForm.installment_no && (
                  <button
                    type="button"
                    onClick={() => {
                      const installmentAmount = getInstallmentAmount(paymentForm.student_id);
                      handlePaidAmountChange(installmentAmount.toString());
                    }}
                    className="rounded-xl border border-alf-gold/60 bg-alf-gold/5 px-3 py-2 text-xs font-semibold text-alf-gold shadow-sm transition hover:bg-alf-gold/15"
                  >
                    Taksit Tutarını Kullan
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2">
              <button
                type="submit"
                disabled={loadingPayment}
                className="flex w-full items-center justify-center rounded-full bg-alf-gold px-4 py-2.5 text-sm font-semibold text-alf-navy shadow-lg shadow-alf-gold/30 transition hover:bg-alf-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingPayment ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
              </button>
              {paymentMessage && (
                <p className="mt-2 text-xs font-medium text-emerald-400">
                  {paymentMessage}
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Öğrenci Listesi */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Öğrenci Listesi
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Öğrenci ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-full border border-slate-700/80 bg-slate-950/60 px-4 py-1.5 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2 w-48"
              />
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800/80">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Öğrenci Adı</th>
                  <th className="px-3 py-2 text-left">Toplam Ücret</th>
                  <th className="px-3 py-2 text-left">Toplam Ödenen</th>
                  <th className="px-3 py-2 text-left">Kalan Borç</th>
                  <th className="px-3 py-2 text-left">Kalan Taksit</th>
                  <th className="px-3 py-2 text-left">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                {filteredStudents.map((student) => {
                  // Öğrenciye ait ödemeleri filtrele
                  const studentPayments = payments.filter(
                    (p) => p.student_id === student.id
                  );
                  
                  // Toplam ödenen miktarı hesapla
                  const totalPaid = studentPayments.reduce(
                    (sum, payment) => sum + (payment.paid_amount || 0),
                    0
                  );
                  
                  // Kalan borç (NaN olmaması için kontrol)
                  const remainingDebt = Math.max(
                    (student.total_payment_amount || 0) - totalPaid,
                    0
                  );
                  
                  // Kalan taksit sayısı
                  const remainingInstallments = Math.max(
                    (student.installment_count || 0) - studentPayments.length,
                    0
                  );

                  return (
                    <tr key={student.id} className="hover:bg-slate-900/60">
                      <td className="px-3 py-2 text-slate-100">
                        {student.full_name || student.name || "İsimsiz"}
                      </td>
                      <td className="px-3 py-2 text-alf-gold">
                        {student.total_payment_amount ? `${(student.total_payment_amount || 0).toLocaleString("tr-TR")} TL` : "-"}
                      </td>
                      <td className="px-3 py-2 text-green-400">
                        {totalPaid > 0 ? `${totalPaid.toLocaleString("tr-TR")} TL` : "0 TL"}
                      </td>
                      <td className="px-3 py-2 text-red-400">
                        {remainingDebt > 0 ? `${remainingDebt.toLocaleString("tr-TR")} TL` : "0 TL"}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {remainingInstallments}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => router.push(`/admin-panel/student-details?id=${student.id}`)}
                          className="rounded-full border border-alf-gold/60 bg-alf-gold/5 px-3 py-1 text-xs font-semibold text-alf-gold shadow-sm transition hover:bg-alf-gold/15"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                {searchTerm ? "Arama kriterlerinize uygun öğrenci bulunamadı." : "Henüz hiç öğrenci eklenmemiş."}
              </div>
            )}
          </div>
        </section>

        {/* Öne Çıkan Öğrenciler */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
            Öne Çıkan Öğrenciler
          </h2>
          <form
            onSubmit={handleAddFeaturedStudent}
            className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2"
          >
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-200">Ad Soyad</label>
              <input
                type="text"
                required
                value={featuredStudentForm.full_name}
                onChange={(e) =>
                  setFeaturedStudentForm({ ...featuredStudentForm, full_name: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Sınıf</label>
              <input
                type="text"
                required
                value={featuredStudentForm.class}
                onChange={(e) =>
                  setFeaturedStudentForm({ ...featuredStudentForm, class: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Alan</label>
              <select
                value={featuredStudentForm.field}
                onChange={(e) =>
                  setFeaturedStudentForm({ ...featuredStudentForm, field: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              >
                <option value="Sayısal">Sayısal</option>
                <option value="EA">EA</option>
                <option value="Sözel">Sözel</option>
              </select>
            </div>
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-200">Açıklama (son 1 ay deneme performansına dair kısa metin)</label>
              <textarea
                rows={3}
                required
                value={featuredStudentForm.description}
                onChange={(e) =>
                  setFeaturedStudentForm({ ...featuredStudentForm, description: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-200">Fotoğraf (jpg/png)</label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFeaturedStudentPhotoChange}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
              />
              {featuredStudentPhotoPreview && (
                <div className="mt-2">
                  <img 
                    src={featuredStudentPhotoPreview} 
                    alt="Preview" 
                    className="h-24 w-24 rounded-full object-cover border border-slate-700/80"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-y-1">
              <input
                type="checkbox"
                id="is_active"
                checked={featuredStudentForm.is_active}
                onChange={(e) =>
                  setFeaturedStudentForm({ ...featuredStudentForm, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-700/80 bg-slate-950/60 text-alf-gold focus:ring-alf-gold"
              />
              <label htmlFor="is_active" className="ml-2 text-xs text-slate-200">
                Aktif mi?
              </label>
            </div>
            
            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={featuredStudentLoading}
                className="flex w-full items-center justify-center rounded-full bg-alf-gold px-4 py-2.5 text-sm font-semibold text-alf-navy shadow-lg shadow-alf-gold/30 transition hover:bg-alf-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {featuredStudentLoading ? "Kaydediliyor..." : "Öğrenciyi Kaydet"}
              </button>
              {featuredStudentMessage && (
                <p className="mt-2 text-xs font-medium text-emerald-400">
                  {featuredStudentMessage}
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Öne Çıkan Öğrenciler Listesi */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
            Kayıtlı Öne Çıkan Öğrenciler
          </h2>
          <div className="mt-4 space-y-4">
            {featuredStudents.length === 0 ? (
              <p className="text-sm text-slate-300">
                Henüz öne çıkan öğrenci eklenmemiş.
              </p>
            ) : (
              featuredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-3 transition hover:border-alf-gold/60 hover:bg-slate-900/70"
                >
                  <div className="flex items-center gap-4">
                    {student.photo_url ? (
                      <img 
                        src={student.photo_url} 
                        alt={student.full_name} 
                        className="h-16 w-16 rounded-full object-cover border border-slate-700/80"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/80">
                        <span className="text-slate-500 text-xs">Foto yok</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-50">
                        {student.full_name}
                      </h3>
                      <p className="text-xs text-slate-300">
                        {student.class} - {student.field}
                      </p>
                      <p className="text-xs text-alf-gold mt-1">
                        {student.is_active ? "Aktif" : "Pasif"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleFeaturedStudentActive(student.id, student.is_active)}
                      className="rounded-full border border-alf-gold/60 bg-alf-gold/5 px-3 py-1 text-xs font-semibold text-alf-gold shadow-sm transition hover:bg-alf-gold/15"
                    >
                      {student.is_active ? "Pasif Yap" : "Aktif Yap"}
                    </button>
                    <button
                      onClick={() => handleDeleteFeaturedStudent(student.id)}
                      className="rounded-full border border-red-500/60 bg-red-500/5 px-3 py-1 text-xs font-semibold text-red-400 shadow-sm transition hover:bg-red-500/15"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Duyuru Yönetimi */}
        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Duyuru Ekle
            </h2>
            <form
              onSubmit={handleAddAnnouncement}
              className="mt-4 space-y-3 text-sm"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-200">Başlık</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-200">Açıklama</label>
                <textarea
                  rows={4}
                  value={announcementForm.description}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                  placeholder="İsteğe bağlı açıklama..."
                />
              </div>
              <button
                type="submit"
                disabled={loadingAnnouncement}
                className="mt-1 flex w-full items-center justify-center rounded-full bg-alf-gold px-4 py-2.5 text-sm font-semibold text-alf-navy shadow-lg shadow-alf-gold/30 transition hover:bg-alf-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingAnnouncement ? "Kaydediliyor..." : "Duyuru Ekle"}
              </button>
              {announcementMessage && (
                <p className="mt-2 text-xs font-medium text-emerald-400">
                  {announcementMessage}
                </p>
              )}
            </form>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Mevcut Duyurular
            </h2>
            <div className="mt-4 space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-slate-300">
                  Henüz eklenmiş bir duyuru bulunmuyor.
                </p>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-3 transition hover:border-alf-gold/60 hover:bg-slate-900/70"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-slate-50 group-hover:text-alf-gold">
                        {a.title}
                      </h3>
                      {a.description && (
                        <p className="mt-1 text-xs text-slate-300">
                          {a.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Galeri Yönetimi */}
        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Ana Sayfa Galerisi
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Buraya yüklediğiniz görseller ana sayfadaki otomatik slider
              içerisinde sırayla gösterilir.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadGallery}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-alf-gold file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-alf-navy hover:file:bg-alf-gold/90"
              />
              {galleryMessage && (
                <p className="text-xs font-medium text-emerald-400">
                  {galleryMessage}
                </p>
              )}
              {galleryLoading && (
                <p className="text-xs text-slate-300">
                  İşlem gerçekleştiriliyor...
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Yüklü Görseller
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.length === 0 ? (
                <p className="text-sm text-slate-300">
                  Henüz galeriye görsel yüklenmemiş.
                </p>
              ) : (
                gallery.map((g) => (
                  <div
                    key={g.name}
                    className="group overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60"
                  >
                    <div
                      className="h-24 w-full bg-cover bg-center transition group-hover:scale-105"
                      style={{ backgroundImage: `url(${g.url})` }}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryImage(g.name)}
                      className="flex w-full items-center justify-center bg-slate-950/80 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-900/40 hover:text-red-200"
                    >
                      Sil
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
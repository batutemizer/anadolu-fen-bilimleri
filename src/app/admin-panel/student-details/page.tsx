"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  created_at?: string;
};

type Payment = {
  id: string;
  student_id: string;
  installment_no: number;
  paid_amount: number;
  paid_date?: string;
  created_at?: string;
};

export default function StudentDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // İlk render'da oturum kontrolü
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // İlk yüklemede oturum kontrolü
    if (!checkAdminSession()) {
      router.replace("/admin-login");
      return;
    } else {
      setIsAuthorized(true);
    }

    if (!studentId) {
      router.replace("/admin-panel");
      return;
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

    const fetchStudentDetails = async () => {
      // Öğrenci bilgilerini çek
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError) {
        console.error("Öğrenci bilgileri alınırken hata:", studentError.message);
        router.replace("/admin-panel");
        return;
      }

      setStudent(studentData as Student);

      // Öğrenciye ait ödemeleri çek
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", studentId)
        .order("installment_no", { ascending: true });

      if (!paymentsError) {
        setPayments(paymentsData as Payment[]);
      }

      setLoading(false);
    };

    fetchStudentDetails();

    // Cleanup function
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router, studentId]);

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

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h1 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              Öğrenci Detayları
            </h1>
            <p className="mt-4 text-sm text-slate-300">Yükleniyor...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!student) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h1 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              Öğrenci Detayları
            </h1>
            <p className="mt-4 text-sm text-slate-300">Öğrenci bulunamadı.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Taksit tutarını hesapla
  const installmentAmount = student.installment_count && student.installment_count > 0
    ? student.total_payment_amount / student.installment_count 
    : 0;

  // Ödenen toplam tutarı hesapla
  const totalPaid = payments.reduce(
    (sum, payment) => sum + (payment.paid_amount || 0),
    0
  );

  // Kalan borç (NaN olmaması için kontrol)
  const remainingDebt = Math.max(student.total_payment_amount - totalPaid, 0);

  // Kalan taksit sayısı
  const remainingInstallments = Math.max(
    (student.installment_count || 0) - payments.length,
    0
  );

  // Taksit durumu hesaplama fonksiyonu
  const getInstallmentStatus = (installmentNo: number) => {
    const payment = payments.find(p => p.installment_no === installmentNo);
    
    if (!payment) {
      return { status: "ÖDENMEDİ", color: "text-red-400" };
    }
    
    // Taksit tutarı 0 ise veya tanımsızsa
    if (installmentAmount <= 0) {
      return { status: payment.paid_amount > 0 ? "ÖDENDİ" : "ÖDENMEDİ", color: payment.paid_amount > 0 ? "text-green-400" : "text-red-400" };
    }
    
    if (payment.paid_amount >= installmentAmount) {
      return { status: "ÖDENDİ", color: "text-green-400" };
    } else if (payment.paid_amount > 0) {
      return { status: "KISMİ", color: "text-yellow-400" };
    } else {
      return { status: "ÖDENMEDİ", color: "text-red-400" };
    }
  };

  // Taksit için ödenen miktarı bul
  const getPaidAmountForInstallment = (installmentNo: number) => {
    const payment = payments.find(p => p.installment_no === installmentNo);
    return payment ? payment.paid_amount : 0;
  };

  // Taksit için kalan miktarı hesapla
  const getRemainingAmountForInstallment = (installmentNo: number) => {
    const paidAmount = getPaidAmountForInstallment(installmentNo);
    return Math.max(installmentAmount - paidAmount, 0);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
        <div className="flex items-center justify-between">
          <h1 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            Öğrenci Detayları
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-alf-gold/60 bg-alf-gold/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-alf-gold shadow-sm transition hover:bg-alf-gold/15"
            >
              Geri Dön
            </button>
            <button
              onClick={() => {
                // Session'ı temizle
                sessionStorage.removeItem("alf_admin");
                sessionStorage.removeItem("alf_admin_login_time");
                // Login sayfasına yönlendir
                router.push("/admin-login");
              }}
              className="rounded-full border border-red-500/60 bg-red-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 shadow-sm transition hover:bg-red-500/15"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Öğrenci Bilgileri */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300 mb-4">
              Öğrenci Bilgileri
            </h2>
            <div className="space-y-2 text-sm text-slate-200">
              <p>
                <span className="font-semibold text-alf-gold">Ad Soyad:</span>{" "}
                {student.full_name || student.name || "-"}
              </p>
              <p>
                <span className="font-semibold text-alf-gold">Toplam Ücret:</span>{" "}
                {student.total_payment_amount?.toLocaleString("tr-TR")} TL
              </p>
              <p>
                <span className="font-semibold text-alf-gold">Taksit Sayısı:</span>{" "}
                {student.installment_count || "-"}
              </p>
              <p>
                <span className="font-semibold text-alf-gold">Taksit Tutarı:</span>{" "}
                {installmentAmount > 0 ? `${installmentAmount.toLocaleString("tr-TR")} TL` : "-"}
              </p>
              <p>
                <span className="font-semibold text-alf-gold">Başlangıç Tarihi:</span>{" "}
                {student.start_date || "-"}
              </p>
              <p>
                <span className="font-semibold text-alf-gold">Bitiş Tarihi:</span>{" "}
                {student.end_date || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300 mb-4">
              Veli Bilgileri
            </h2>
            <div className="space-y-2 text-sm text-slate-200">
              <p>
                <span className="font-semibold text-alf-gold">Ad Soyad:</span>{" "}
                {student.parent_full_name || "-"}
              </p>
              <p>
                <span className="font-semibold text-alf-gold">Telefon:</span>{" "}
                {student.parent_phone || "-"}
              </p>
            </div>
          </div>
        </section>

        {/* Finansal Özet */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300 mb-4">
            Finansal Özet
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Toplam Ücret
              </p>
              <p className="text-lg font-bold text-alf-gold">
                {student.total_payment_amount ? `${student.total_payment_amount.toLocaleString("tr-TR")} TL` : "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Toplam Ödenen
              </p>
              <p className="text-lg font-bold text-green-400">
                {totalPaid > 0 ? `${totalPaid.toLocaleString("tr-TR")} TL` : "0 TL"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Kalan Borç
              </p>
              <p className="text-lg font-bold text-red-400">
                {remainingDebt > 0 ? `${remainingDebt.toLocaleString("tr-TR")} TL` : "0 TL"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Kalan Taksit
              </p>
              <p className="text-lg font-bold text-slate-300">
                {remainingInstallments}
              </p>
            </div>
          </div>
        </section>

        {/* Taksit Tablosu */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300 mb-4">
            Taksit Detayları
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-800/80">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Taksit No</th>
                  <th className="px-3 py-2 text-left">Taksit Tutarı</th>
                  <th className="px-3 py-2 text-left">Ödenen</th>
                  <th className="px-3 py-2 text-left">Kalan</th>
                  <th className="px-3 py-2 text-left">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                {Array.from({ length: student.installment_count || 0 }, (_, i) => i + 1).map(
                  (installmentNo) => {
                    const { status, color } = getInstallmentStatus(installmentNo);
                    const paidAmount = getPaidAmountForInstallment(installmentNo);
                    const remainingAmount = getRemainingAmountForInstallment(installmentNo);

                    return (
                      <tr key={installmentNo} className="hover:bg-slate-900/60">
                        <td className="px-3 py-2 text-slate-100">{installmentNo}</td>
                        <td className="px-3 py-2 text-alf-gold">
                          {installmentAmount > 0 ? `${installmentAmount.toLocaleString("tr-TR")} TL` : "-"}
                        </td>
                        <td className="px-3 py-2 text-green-400">
                          {paidAmount.toLocaleString("tr-TR")} TL
                        </td>
                        <td className="px-3 py-2 text-red-400">
                          {remainingAmount.toLocaleString("tr-TR")} TL
                        </td>
                        <td className={`px-3 py-2 font-semibold ${color}`}>
                          {status}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
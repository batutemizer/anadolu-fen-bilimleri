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

type ContactMessage = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  message: string;
  created_at: string;
};

export default function IletisimMesajlariPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

    // Mesajları çek
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!error) {
        setMessages(data as ContactMessage[]);
      }
      setLoading(false);
    };

    fetchMessages();

    // Cleanup function
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  const handleDeleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      // Listeyi güncelle
      setMessages(prev => prev.filter(msg => msg.id !== id));
      setMessage("Mesaj başarıyla silindi.");
      
      // Detay penceresini kapat
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    } catch (error: any) {
      console.error("Mesaj silinirken hata:", error.message);
      setMessage("Mesaj silinirken bir hata oluştu.");
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
            İletişim Mesajları
          </h1>
          <button
            onClick={() => router.push("/admin-panel")}
            className="rounded-full border border-alf-gold/60 bg-alf-gold/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-alf-gold shadow-sm transition hover:bg-alf-gold/15"
          >
            Geri Dön
          </button>
        </div>

        {/* Mesaj Listesi */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300 mb-4">
            Tüm Mesajlar
          </h2>
          {message && (
            <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
              {message}
            </div>
          )}
          {loading ? (
            <p className="text-sm text-slate-300">Yükleniyor...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-300">Henüz hiç mesaj alınmamış.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800/80">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.16em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Gönderen</th>
                    <th className="px-4 py-3 text-left">İletişim</th>
                    <th className="px-4 py-3 text-left">Tarih</th>
                    <th className="px-4 py-3 text-left">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                  {messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-3 text-slate-100">
                        {msg.full_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {msg.email && <div>E: {msg.email}</div>}
                        {msg.phone && <div>T: {msg.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(msg.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className="rounded-full border border-blue-500/60 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/15"
                          >
                            Detay
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="rounded-full border border-red-500/60 bg-red-500/5 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/15"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Mesaj Detayı Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">
                Mesaj Detayı
              </h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Gönderen
                </p>
                <p className="text-slate-100">{selectedMessage.full_name}</p>
              </div>
              
              {(selectedMessage.email || selectedMessage.phone) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    İletişim Bilgileri
                  </p>
                  <div className="text-slate-300">
                    {selectedMessage.email && <p>E-posta: {selectedMessage.email}</p>}
                    {selectedMessage.phone && <p>Telefon: {selectedMessage.phone}</p>}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Tarih
                </p>
                <p className="text-slate-300">
                  {new Date(selectedMessage.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Mesaj
                </p>
                <p className="mt-2 whitespace-pre-wrap text-slate-300">
                  {selectedMessage.message}
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="rounded-full border border-slate-600/60 bg-slate-600/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-600/15"
                >
                  Kapat
                </button>
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="rounded-full border border-red-500/60 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/15"
                >
                  Mesajı Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
}
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validasyon
    if (!formData.full_name.trim()) {
      setError("Ad Soyad alanı zorunludur.");
      setLoading(false);
      return;
    }
    
    if (!formData.message.trim()) {
      setError("Mesaj alanı zorunludur.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert([
          {
            full_name: formData.full_name,
            email: formData.email || null,
            phone: formData.phone || null,
            message: formData.message
          }
        ]);

      if (error) throw error;

      setSuccess(true);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (err: any) {
      console.error("Mesaj gönderilirken hata:", err);
      setError("Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 pt-10 md:px-6 md:pt-14">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
          <h1 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 mb-2">
            İletişim
          </h1>
          <p className="text-center text-sm text-slate-300 mb-8">
            Bize ulaşmak için aşağıdaki formu doldurabilirsiniz.
          </p>

          {success ? (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
              <h2 className="text-lg font-semibold text-green-400 mb-2">
                Mesajınız Bize Ulaştı
              </h2>
              <p className="text-slate-300">
                En kısa sürede sizinle iletişime geçeceğiz.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 rounded-full bg-alf-gold px-4 py-2 text-sm font-semibold text-alf-navy hover:bg-alf-gold/90"
              >
                Yeni Mesaj Gönder
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Ad Soyad <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                    placeholder="Adınızı ve soyadınızı girin"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      E-posta (Opsiyonel)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                      placeholder="ornek@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Telefon (Zorunlu)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                      placeholder="5XX XXX XX XX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Mesaj <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-50 outline-none ring-alf-gold/40 transition focus:border-alf-gold/70 focus:ring-2"
                    placeholder="Mesajınızı buraya yazın..."
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-alf-gold px-4 py-2.5 text-sm font-semibold text-alf-navy shadow-lg shadow-alf-gold/30 transition hover:bg-alf-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Gönderiliyor..." : "Mesajı Gönder"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}